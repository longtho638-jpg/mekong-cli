"""
Tests for RaaS Webhook Bridge

Tests Stripe/Polar webhook event transformation and pushing.
"""

import pytest
from datetime import datetime, timezone

from src.raas.webhook_bridge import (
    WebhookBridge,
    WebhookConfig,
    WebhookResult,
    BillingProvider,
    get_bridge,
    reset_bridge,
)
from src.raas.usage_event_schema import WebhookEvent


class TestWebhookConfig:
    """Test WebhookConfig class."""

    def test_default_config(self):
        """Test default configuration values."""
        config = WebhookConfig()

        assert config.stripe_api_key is None
        assert config.stripe_api_base == "https://api.stripe.com/v1"
        assert config.polar_api_key is None
        assert config.polar_api_base == "https://api.polar.sh/v1"
        assert config.max_retries == 3
        assert config.retry_delay_ms == 1000
        assert config.timeout_seconds == 30

    def test_config_from_env(self, monkeypatch):
        """Test loading config from environment."""
        monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_123")
        monkeypatch.setenv("POLAR_API_KEY", "pk_test_456")

        bridge = WebhookBridge()

        assert bridge.config.stripe_api_key == "sk_test_123"
        assert bridge.config.polar_api_key == "pk_test_456"


class TestWebhookResult:
    """Test WebhookResult dataclass."""

    def test_success_result(self):
        """Test successful webhook result."""
        result = WebhookResult(
            success=True,
            provider=BillingProvider.STRIPE,
            event_id="evt_123",
            status_code=200,
            elapsed_ms=150.5,
        )

        assert result.success is True
        assert result.provider == BillingProvider.STRIPE
        assert result.status_code == 200
        assert result.error is None

    def test_failure_result(self):
        """Test failed webhook result."""
        result = WebhookResult(
            success=False,
            provider=BillingProvider.POLAR,
            event_id="evt_456",
            error="Connection timeout",
            retries=3,
        )

        assert result.success is False
        assert result.error == "Connection timeout"
        assert result.retries == 3


class TestWebhookBridge:
    """Test WebhookBridge class."""

    def setup_method(self):
        """Reset bridge before each test."""
        reset_bridge()

    def test_init_default_config(self):
        """Test initialization with default config."""
        bridge = WebhookBridge()

        assert bridge.config is not None
        assert bridge.config.max_retries == 3

    def test_init_custom_config(self):
        """Test initialization with custom config."""
        config = WebhookConfig(max_retries=5, retry_delay_ms=2000)
        bridge = WebhookBridge(config=config)

        assert bridge.config.max_retries == 5
        assert bridge.config.retry_delay_ms == 2000

    def test_build_stripe_event(self):
        """Test building Stripe event."""
        bridge = WebhookBridge()

        event = bridge.build_stripe_event(
            tenant_id="tenant_123",
            usage_data={"total_tokens": 1000},
        )

        assert event.type == "stripe"
        assert event.tenant_id == "tenant_123"
        assert event.usage_data["total_tokens"] == 1000

    def test_build_polar_event(self):
        """Test building Polar event."""
        bridge = WebhookBridge()

        event = bridge.build_polar_event(
            tenant_id="tenant_456",
            usage_data={"total_tokens": 500, "benefit_id": "benefit_789"},
        )

        assert event.type == "polar"
        assert event.tenant_id == "tenant_456"
        assert event.usage_data["benefit_id"] == "benefit_789"

    def test_generate_idempotency_key(self):
        """Test idempotency key generation."""
        bridge = WebhookBridge()

        event1 = WebhookEvent(
            type="stripe",
            tenant_id="tenant",
            usage_data={"tokens": 100},
            created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),  # Fixed timestamp
        )
        # Create event2 with identical data
        event2 = WebhookEvent(
            type="stripe",
            tenant_id="tenant",
            usage_data={"tokens": 100},
            created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),  # Same timestamp
        )
        event3 = WebhookEvent(
            type="stripe",
            tenant_id="tenant",
            usage_data={"tokens": 200},  # Different data
            created_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc),
        )

        key1 = bridge.generate_idempotency_key(event1)
        key2 = bridge.generate_idempotency_key(event2)
        key3 = bridge.generate_idempotency_key(event3)

        # Same event data should produce same key
        assert key1 == key2
        # Different data should produce different key
        assert key1 != key3

    def test_duplicate_detection(self):
        """Test duplicate event detection."""
        bridge = WebhookBridge()

        key = "test_key_123"

        # First check should be not duplicate
        assert bridge.is_duplicate(key) is False

        # Mark as sent
        bridge.mark_sent(key)

        # Second check should be duplicate
        assert bridge.is_duplicate(key) is True

    def test_transform_hourly_buckets(self):
        """Test transforming hourly buckets to webhook events."""
        bridge = WebhookBridge()

        buckets = [
            {
                "hour_bucket": "2024-01-01-10",
                "tenant_id": "tenant_123",
                "event_count": 100,
                "total_tokens": 5000,
                "events_by_type": {"cli:command": 60, "llm:call": 40},
            },
            {
                "hour_bucket": "2024-01-01-11",
                "tenant_id": "tenant_123",
                "event_count": 150,
                "total_tokens": 7500,
            },
        ]

        events = bridge.transform_hourly_buckets(buckets, BillingProvider.STRIPE)

        assert len(events) == 2
        assert events[0].type == "stripe"
        assert events[0].tenant_id == "tenant_123"
        assert events[0].usage_data["hour_bucket"] == "2024-01-01-10"
        assert events[1].usage_data["total_tokens"] == 7500


class TestWebhookBridgeAsync:
    """Test async webhook push methods."""

    def setup_method(self):
        reset_bridge()

    @pytest.mark.asyncio
    async def test_push_to_stripe_no_api_key(self):
        """Test push to Stripe without API key fails gracefully."""
        bridge = WebhookBridge()

        event = bridge.build_stripe_event(
            tenant_id="tenant",
            usage_data={"total_tokens": 100},
        )

        # Without API key, should fail gracefully
        # Note: This test will skip actual API call
        result = await bridge.push_to_stripe(event, "si_123")

        # Should have some result (may fail due to no API key)
        assert isinstance(result, WebhookResult)

    @pytest.mark.asyncio
    async def test_push_to_polar_no_api_key(self):
        """Test push to Polar without API key fails gracefully."""
        bridge = WebhookBridge()

        event = bridge.build_polar_event(
            tenant_id="tenant",
            usage_data={"total_tokens": 100},
        )

        result = await bridge.push_to_polar(event)

        assert isinstance(result, WebhookResult)

    @pytest.mark.asyncio
    async def test_push_to_gateway_no_license(self):
        """Test push to gateway without license fails."""
        bridge = WebhookBridge()

        events = [
            bridge.build_stripe_event("tenant", {"tokens": 100}),
        ]

        results = await bridge.push_to_gateway(events)

        # Should fail due to no RAAS_LICENSE_KEY
        assert len(results) == 1
        assert results[0].success is False
        assert "No RAAS_LICENSE_KEY" in results[0].error


class TestGetBridge:
    """Test global bridge functions."""

    def setup_method(self):
        reset_bridge()

    def test_get_bridge_creates_instance(self):
        """Test that get_bridge creates instance."""
        bridge = get_bridge()

        assert bridge is not None
        assert isinstance(bridge, WebhookBridge)

    def test_get_bridge_returns_singleton(self):
        """Test that get_bridge returns same instance."""
        bridge1 = get_bridge()
        bridge2 = get_bridge()

        assert bridge1 is bridge2

    def test_reset_bridge(self):
        """Test reset_bridge clears instance."""
        bridge1 = get_bridge()
        reset_bridge()
        bridge2 = get_bridge()

        assert bridge1 is not bridge2


class TestBillingProvider:
    """Test BillingProvider enum."""

    def test_provider_values(self):
        """Test provider enum values."""
        assert BillingProvider.STRIPE.value == "stripe"
        assert BillingProvider.POLAR.value == "polar"
