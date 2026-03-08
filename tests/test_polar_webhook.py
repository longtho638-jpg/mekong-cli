"""
Tests for Polar.sh Webhook Handler

Tests cover:
- Signature verification
- Timestamp validation
- Idempotency (duplicate detection)
- Event processing (subscription.created, subscription.cancelled, order.created)
- Credit provisioning
"""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI

from src.api.polar_webhook import (
    router,
    verify_webhook_signature,
    process_subscription_created,
    process_subscription_cancelled,
    process_order_created,
)


# Create test app
app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestSignatureVerification:
    """Test HMAC-SHA256 signature verification."""

    def test_valid_signature(self):
        """Test valid signature returns True."""
        payload = b'{"type": "subscription.created", "id": "test-123"}'
        secret = "test_secret_key"

        # Calculate expected signature
        expected_signature = hmac.new(
            secret.encode(), payload, hashlib.sha256
        ).hexdigest()

        signature = f"sha256={expected_signature}"

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            result = verify_webhook_signature(payload, signature)
            assert result is True

    def test_invalid_signature(self):
        """Test invalid signature returns False."""
        payload = b'{"type": "subscription.created", "id": "test-123"}'
        secret = "test_secret_key"

        signature = "sha256=invalidsignature123456789"

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            result = verify_webhook_signature(payload, signature)
            assert result is False

    def test_missing_sha256_prefix(self):
        """Test signature without sha256= prefix returns False."""
        payload = b'{"type": "subscription.created"}'
        secret = "test_secret"

        # Signature without prefix
        signature = "invalidsignature"

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            result = verify_webhook_signature(payload, signature)
            assert result is False

    def test_no_secret_allows_all(self):
        """Test when no secret is set, all signatures pass (dev mode)."""
        payload = b'{"type": "test"}'

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", None):
            result = verify_webhook_signature(payload, "any_signature")
            assert result is True

    def test_valid_signature_with_fresh_timestamp(self):
        """Test valid signature with fresh timestamp passes."""
        payload = b'{"type": "subscription.created"}'
        secret = "test_secret"

        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        timestamp = int(datetime.now(timezone.utc).timestamp())

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            result = verify_webhook_signature(payload, f"sha256={expected}", timestamp)
            assert result is True

    def test_old_timestamp_rejected(self):
        """Test timestamp older than 5 minutes is rejected."""
        payload = b'{"type": "subscription.created"}'
        secret = "test_secret"

        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        # Timestamp from 10 minutes ago
        old_timestamp = int(datetime.now(timezone.utc).timestamp()) - 600

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            result = verify_webhook_signature(payload, f"sha256={expected}", old_timestamp)
            assert result is False

    def test_future_timestamp_accepted(self):
        """Test future timestamp within tolerance is accepted."""
        payload = b'{"type": "subscription.created"}'
        secret = "test_secret"

        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        # Timestamp 2 minutes in future
        future_timestamp = int(datetime.now(timezone.utc).timestamp()) + 120

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            result = verify_webhook_signature(payload, f"sha256={expected}", future_timestamp)
            assert result is True


class TestWebhookEndpoints:
    """Test webhook HTTP endpoints."""

    def test_webhook_invalid_signature(self):
        """Test webhook rejects invalid signature."""
        payload = {"type": "subscription.created", "id": "test-invalid-sig-123"}

        # Set a secret so signature verification is enforced
        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", "test_secret"):
            response = client.post(
                "/api/v1/polar/webhook",
                json=payload,
                headers={"X-Polar-Signature": "sha256=invalid"}
            )

            assert response.status_code == 401
            assert "Invalid signature" in response.json()["detail"]

    def test_webhook_invalid_content_type(self):
        """Test webhook rejects non-JSON content."""
        response = client.post(
            "/api/v1/polar/webhook",
            content="not json",
            headers={
                "Content-Type": "text/plain",
                "X-Polar-Signature": "sha256=test"
            }
        )

        assert response.status_code == 400
        assert "Invalid content type" in response.json()["detail"]

    def test_webhook_invalid_json(self):
        """Test webhook rejects malformed JSON."""
        secret = "test_secret"

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            signature = hmac.new(secret.encode(), b"not valid json", hashlib.sha256).hexdigest()

            response = client.post(
                "/api/v1/polar/webhook",
                content=b"not valid json",
                headers={
                    "Content-Type": "application/json",
                    "X-Polar-Signature": f"sha256={signature}"
                }
            )

            assert response.status_code == 400
            assert "Invalid JSON" in response.json()["detail"]

    def test_webhook_unhandled_event_type(self):
        """Test webhook ignores unknown event types."""
        secret = "test_secret"
        payload = {"type": "unknown.event.xyz", "id": "unknown-event-test-456"}

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            # httpx sends compact JSON (no spaces), match that format
            payload_bytes = json.dumps(payload, separators=(',', ':')).encode()
            signature = hmac.new(
                secret.encode(), payload_bytes, hashlib.sha256
            ).hexdigest()

            response = client.post(
                "/api/v1/polar/webhook",
                json=payload,
                headers={"X-Polar-Signature": f"sha256={signature}"}
            )

            assert response.status_code == 200
            assert response.json()["status"] == "ignored"

    def test_webhook_idempotency_duplicate_event(self):
        """Test webhook detects duplicate events."""
        secret = "test_secret"
        payload = {"type": "subscription.created", "id": "duplicate-test-123"}

        with patch("src.api.polar_webhook.POLAR_WEBHOOK_SECRET", secret):
            # httpx sends compact JSON (no spaces), match that format
            payload_bytes = json.dumps(payload, separators=(',', ':')).encode()
            signature = hmac.new(
                secret.encode(), payload_bytes, hashlib.sha256
            ).hexdigest()

            # First request should process
            response1 = client.post(
                "/api/v1/polar/webhook",
                json=payload,
                headers={"X-Polar-Signature": f"sha256={signature}"}
            )
            assert response1.status_code == 200

            # Second request should be detected as duplicate
            response2 = client.post(
                "/api/v1/polar/webhook",
                json=payload,
                headers={"X-Polar-Signature": f"sha256={signature}"}
            )
            assert response2.status_code == 200
            assert response2.json()["status"] == "duplicate"


class TestSubscriptionCreated:
    """Test subscription.created event processing."""

    def test_process_subscription_pro_tier(self):
        """Test subscription creates pro tier license by default."""
        event_data = {
            "subscription": {
                "id": "sub_123",
                "customer": {"email": "test@example.com", "id": "cust_123"},
                "product": {"name": "Pro Plan"},
            }
        }

        result = process_subscription_created(event_data)

        assert result["status"] == "success"
        assert result["tier"] == "pro"
        assert result["email"] == "test@example.com"
        assert "license_key" in result

    def test_process_subscription_enterprise_tier(self):
        """Test subscription with enterprise product creates enterprise tier."""
        event_data = {
            "subscription": {
                "id": "sub_123",
                "customer": {"email": "enterprise@corp.com", "id": "cust_123"},
                "product": {"name": "Enterprise Plan"},
            }
        }

        result = process_subscription_created(event_data)

        assert result["status"] == "success"
        assert result["tier"] == "enterprise"

    def test_process_subscription_trial_tier(self):
        """Test subscription with trial product creates trial tier."""
        event_data = {
            "subscription": {
                "id": "sub_123",
                "customer": {"email": "trial@example.com", "id": "cust_123"},
                "product": {"name": "Trial Plan"},
            }
        }

        result = process_subscription_created(event_data)

        assert result["status"] == "success"
        assert result["tier"] == "trial"

    def test_process_subscription_free_tier(self):
        """Test subscription with free product creates free tier."""
        event_data = {
            "subscription": {
                "id": "sub_123",
                "customer": {"email": "free@example.com", "id": "cust_123"},
                "product": {"name": "Free Plan"},
            }
        }

        result = process_subscription_created(event_data)

        assert result["status"] == "success"
        assert result["tier"] == "free"


class TestSubscriptionCancelled:
    """Test subscription.cancelled event processing."""

    def test_process_cancellation_revokes_license(self):
        """Test cancellation revokes the associated license."""
        # First create a subscription
        create_event = {
            "subscription": {
                "id": "sub_to_cancel",
                "customer": {"email": "cancel@example.com", "id": "cust_123"},
                "product": {"name": "Pro Plan"},
            }
        }

        create_result = process_subscription_created(create_event)
        assert create_result["license_key"]  # verify key was created

        # Now cancel it
        cancel_event = {
            "subscription": {
                "id": "sub_to_cancel",
            }
        }

        cancel_result = process_subscription_cancelled(cancel_event)

        assert cancel_result["status"] == "success"
        assert cancel_result["revoked"] is True

    def test_process_cancellation_unknown_subscription(self):
        """Test cancellation of unknown subscription returns success."""
        cancel_event = {
            "subscription": {
                "id": "nonexistent_sub",
            }
        }

        cancel_result = process_subscription_cancelled(cancel_event)

        assert cancel_result["status"] == "success"
        assert cancel_result["revoked"] is True


class TestOrderCreated:
    """Test order.created event processing."""

    def test_process_order_creates_trial_license(self):
        """Test order creates 30-day trial license."""
        event_data = {
            "order": {
                "id": "order_123",
                "customer": {"email": "buyer@example.com"},
            }
        }

        result = process_order_created(event_data)

        assert result["status"] == "success"
        assert result["tier"] == "trial"
        assert result["email"] == "buyer@example.com"
        assert "license_key" in result


class TestHealthEndpoint:
    """Test webhook health check endpoint."""

    def test_health_check(self):
        """Test health endpoint returns status."""
        response = client.get("/api/v1/polar/test")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "secret_configured" in data
        assert "timestamp_tolerance" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
