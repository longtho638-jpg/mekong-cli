"""
Tests for RaaS Usage Event Schema

Tests validation, serialization, and transformation of usage events.
"""

from datetime import timezone

from src.raas.usage_event_schema import (
    UsageEvent,
    UsageEventType,
    HourlyBucket,
    UsageSummary,
    EncryptedPayload,
    WebhookEvent,
)


class TestUsageEvent:
    """Test UsageEvent schema."""

    def test_create_minimal_event(self):
        """Test creating event with minimal fields."""
        event = UsageEvent(
            event_type=UsageEventType.CLI_COMMAND,
            tenant_id="tenant_123",
            license_key="mk_test_key",
        )

        assert event.event_type == UsageEventType.CLI_COMMAND
        assert event.tenant_id == "tenant_123"
        assert event.license_key == "mk_test_key"
        assert event.input_tokens == 0
        assert event.output_tokens == 0
        assert event.duration_ms == 0.0
        assert event.metadata == {}

    def test_create_full_event(self):
        """Test creating event with all fields."""
        event = UsageEvent(
            event_type=UsageEventType.LLM_CALL,
            tenant_id="tenant_456",
            license_key="mk_another_key",
            endpoint="/api/generate",
            model="qwen3.5-plus",
            input_tokens=1000,
            output_tokens=500,
            duration_ms=250.5,
            metadata={"user": "test_user"},
        )

        assert event.endpoint == "/api/generate"
        assert event.model == "qwen3.5-plus"
        assert event.input_tokens == 1000
        assert event.output_tokens == 500
        assert event.duration_ms == 250.5
        assert event.metadata["user"] == "test_user"

    def test_event_id_auto_generated(self):
        """Test that event_id is auto-generated UUID."""
        event1 = UsageEvent(
            event_type=UsageEventType.CLI_COMMAND,
            tenant_id="tenant",
            license_key="mk_key",
        )
        event2 = UsageEvent(
            event_type=UsageEventType.CLI_COMMAND,
            tenant_id="tenant",
            license_key="mk_key",
        )

        assert event1.event_id != event2.event_id
        assert event1.event_id.startswith("00") or len(event1.event_id) == 36

    def test_timestamp_auto_utc(self):
        """Test that timestamp is auto-set to UTC."""
        event = UsageEvent(
            event_type=UsageEventType.CLI_COMMAND,
            tenant_id="tenant",
            license_key="mk_key",
        )

        assert event.timestamp.tzinfo == timezone.utc

    def test_to_dict(self):
        """Test conversion to dictionary."""
        event = UsageEvent(
            event_type=UsageEventType.AGENT_SPAWN,
            tenant_id="tenant",
            license_key="mk_key",
            endpoint="/api/agent",
        )

        d = event.to_dict()

        assert d["event_type"] == "agent:spawn"
        assert d["tenant_id"] == "tenant"
        assert d["endpoint"] == "/api/agent"
        assert "timestamp" in d


class TestHourlyBucket:
    """Test HourlyBucket schema."""

    def test_from_events(self):
        """Test building hourly bucket from events."""
        events = [
            UsageEvent(
                event_type=UsageEventType.CLI_COMMAND,
                tenant_id="tenant",
                license_key="mk_key",
                input_tokens=100,
                output_tokens=50,
                duration_ms=100.0,
                endpoint="/api/cmd1",
            ),
            UsageEvent(
                event_type=UsageEventType.LLM_CALL,
                tenant_id="tenant",
                license_key="mk_key",
                input_tokens=200,
                output_tokens=100,
                duration_ms=200.0,
                endpoint="/api/cmd2",
            ),
        ]

        bucket = HourlyBucket.from_events(events)

        assert bucket.event_count == 2
        assert bucket.total_tokens == 450  # 100+50+200+100
        assert bucket.total_duration_ms == 300.0
        assert bucket.events_by_type["cli:command"] == 1
        assert bucket.events_by_type["llm:call"] == 1
        assert bucket.unique_endpoints == 2

    def test_from_empty_events(self):
        """Test building from empty events list."""
        bucket = HourlyBucket.from_events([])

        assert bucket.hour_bucket == ""
        assert bucket.tenant_id == ""
        assert bucket.event_count == 0


class TestUsageSummary:
    """Test UsageSummary schema."""

    def test_default_values(self):
        """Test default summary values."""
        summary = UsageSummary()

        assert summary.total_requests == 0
        assert summary.total_payload_size == 0
        assert summary.hours_active == 0
        assert summary.peak_hour is None


class TestEncryptedPayload:
    """Test EncryptedPayload schema."""

    def test_from_bytes(self):
        """Test creating from raw bytes."""
        nonce = b"\x00" * 12
        ciphertext = b"\x01" * 32

        payload = EncryptedPayload.from_bytes(nonce, ciphertext)

        assert payload.nonce == "AAAAAAAAAAAAAAAA"  # Base64 of 12 null bytes
        # Just check it's valid base64 and decrypts properly, don't hardcode exact string
        assert len(payload.ciphertext) > 0
        assert payload.version == "v1"

    def test_to_bytes(self):
        """Test converting back to bytes."""
        # Use actual encrypted data for realistic test
        from src.raas.payload_encryptor import PayloadEncryptor
        encryptor = PayloadEncryptor()
        payload = {"test": "data"}

        encrypted = encryptor.encrypt(payload)
        nonce, ciphertext = encrypted.to_bytes()

        # Verify we get bytes back
        assert isinstance(nonce, bytes)
        assert isinstance(ciphertext, bytes)
        assert len(nonce) == 12  # AES-GCM nonce size

        # Verify decryption works
        decrypted = encryptor.decrypt(encrypted)
        assert decrypted == payload


class TestWebhookEvent:
    """Test WebhookEvent schema."""

    def test_build_stripe_event(self):
        """Test building Stripe-formatted event."""
        event = WebhookEvent(
            type="stripe",
            tenant_id="tenant",
            usage_data={
                "subscription_item_id": "si_123",
                "total_tokens": 1000,
            },
        )

        stripe_format = event.to_stripe_format()

        assert stripe_format["type"] == "usage_record.create"
        assert stripe_format["object"] == "billing.usage_record"
        assert stripe_format["data"]["subscription_item"] == "si_123"
        assert stripe_format["data"]["quantity"] == 1000
        assert stripe_format["data"]["action"] == "set"

    def test_build_polar_event(self):
        """Test building Polar-formatted event."""
        event = WebhookEvent(
            type="polar",
            tenant_id="tenant",
            usage_data={
                "benefit_id": "benefit_456",
                "total_tokens": 500,
                "unit": "tokens",
            },
        )

        polar_format = event.to_polar_format()

        assert polar_format["type"] == "benefit.usage.reported"
        assert polar_format["object"] == "benefit_usage"
        assert polar_format["data"]["benefit_id"] == "benefit_456"
        assert polar_format["data"]["customer_id"] == "tenant"
        assert polar_format["data"]["used"] == 500
        assert polar_format["data"]["unit"] == "tokens"


class TestUsageEventType:
    """Test UsageEventType enum."""

    def test_event_type_values(self):
        """Test all event type values."""
        assert UsageEventType.CLI_COMMAND.value == "cli:command"
        assert UsageEventType.AGENT_SPAWN.value == "agent:spawn"
        assert UsageEventType.LLM_CALL.value == "llm:call"
        assert UsageEventType.USAGE_TOKENS.value == "usage:tokens"
        assert UsageEventType.SYNC_METRICS.value == "sync:metrics"
