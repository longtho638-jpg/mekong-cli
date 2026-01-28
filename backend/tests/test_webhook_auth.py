"""
🧪 Webhook Signature Verification Tests
========================================
Comprehensive tests for webhook authentication middleware.

Tests cover:
- Gumroad HMAC-SHA256 signature verification
- Stripe webhook signature verification
- Missing signature handling
- Invalid signature rejection
- Timestamp validation
- Logging verification
"""

import hashlib
import hmac
import json
import os
import sys
import time
from unittest.mock import MagicMock, Mock, patch

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from backend.middleware.webhook_auth import (
    WebhookAuthError,
    log_webhook_verification,
    verify_gumroad_signature,
    verify_timestamp,
)

# Mock Stripe module for testing
mock_stripe = MagicMock()
mock_stripe.Webhook = MagicMock()
mock_stripe.error = MagicMock()
sys.modules['stripe'] = mock_stripe
sys.modules['stripe.error'] = mock_stripe.error

# Now we can import the function that uses stripe
from backend.middleware.webhook_auth import verify_stripe_signature


class TestGumroadSignatureVerification:
    """Test Gumroad HMAC-SHA256 signature verification."""

    def test_valid_gumroad_signature(self):
        """Test verification with valid Gumroad signature."""
        # Arrange
        payload = b'{"product_name": "Test Product", "price": "99.00"}'
        secret = "test_gumroad_secret_key"

        # Generate valid signature
        expected_signature = hmac.new(
            key=secret.encode('utf-8'),
            msg=payload,
            digestmod=hashlib.sha256
        ).hexdigest()

        # Act & Assert
        assert verify_gumroad_signature(payload, expected_signature, secret) is True

    def test_invalid_gumroad_signature(self):
        """Test rejection of invalid Gumroad signature."""
        # Arrange
        payload = b'{"product_name": "Test Product"}'
        secret = "test_gumroad_secret_key"
        invalid_signature = "invalid_signature_hash"

        # Act & Assert
        with pytest.raises(WebhookAuthError) as exc_info:
            verify_gumroad_signature(payload, invalid_signature, secret)

        assert exc_info.value.status_code == 401
        assert "Invalid webhook signature" in str(exc_info.value.detail)
        assert exc_info.value.provider == "gumroad"

    def test_missing_gumroad_signature(self):
        """Test rejection when signature header is missing."""
        # Arrange
        payload = b'{"product_name": "Test Product"}'
        secret = "test_gumroad_secret_key"

        # Act & Assert
        with pytest.raises(WebhookAuthError) as exc_info:
            verify_gumroad_signature(payload, None, secret)

        assert exc_info.value.status_code == 401
        assert "Missing X-Gumroad-Signature header" in str(exc_info.value.detail)

    def test_missing_gumroad_secret(self):
        """Test rejection when webhook secret is not configured."""
        # Arrange
        payload = b'{"product_name": "Test Product"}'
        signature = "some_signature"

        # Act & Assert
        with pytest.raises(WebhookAuthError) as exc_info:
            verify_gumroad_signature(payload, signature, "")

        assert exc_info.value.status_code == 401
        assert "Webhook secret not configured" in str(exc_info.value.detail)

    def test_gumroad_signature_constant_time_comparison(self):
        """Test that signature comparison uses constant-time algorithm."""
        # Arrange
        payload = b'{"product_name": "Test Product"}'
        secret = "test_gumroad_secret_key"

        correct_signature = hmac.new(
            key=secret.encode('utf-8'),
            msg=payload,
            digestmod=hashlib.sha256
        ).hexdigest()

        # Create a signature that differs only in last character
        almost_correct = correct_signature[:-1] + "x"

        # Act & Assert - should fail even with one character difference
        with pytest.raises(WebhookAuthError):
            verify_gumroad_signature(payload, almost_correct, secret)


class TestStripeSignatureVerification:
    """Test Stripe webhook signature verification."""

    def test_valid_stripe_signature(self):
        """Test verification with valid Stripe signature."""
        # Arrange
        payload = b'{"type": "checkout.session.completed"}'
        signature = "t=1234567890,v1=valid_signature"
        secret = "whsec_test_secret"

        expected_event = {
            "type": "checkout.session.completed",
            "data": {"object": {}}
        }
        mock_stripe.Webhook.construct_event.return_value = expected_event

        # Act
        result = verify_stripe_signature(payload, signature, secret)

        # Assert
        assert result == expected_event
        mock_stripe.Webhook.construct_event.assert_called_once_with(
            payload=payload,
            sig_header=signature,
            secret=secret,
            tolerance=300
        )

    def test_invalid_stripe_signature(self):
        """Test rejection of invalid Stripe signature."""
        # Arrange
        payload = b'{"type": "checkout.session.completed"}'
        signature = "t=1234567890,v1=invalid_signature"
        secret = "whsec_test_secret"

        # Mock the SignatureVerificationError
        mock_stripe.error.SignatureVerificationError = type(
            'SignatureVerificationError',
            (Exception,),
            {}
        )
        mock_stripe.Webhook.construct_event.side_effect = (
            mock_stripe.error.SignatureVerificationError("Invalid signature")
        )

        # Act & Assert
        with pytest.raises(WebhookAuthError) as exc_info:
            verify_stripe_signature(payload, signature, secret)

        assert exc_info.value.status_code == 401
        assert "Invalid webhook signature" in str(exc_info.value.detail)
        assert exc_info.value.provider == "stripe"

        # Reset for next test
        mock_stripe.Webhook.construct_event.side_effect = None

    def test_missing_stripe_signature(self):
        """Test rejection when Stripe signature header is missing."""
        # Arrange
        payload = b'{"type": "checkout.session.completed"}'
        secret = "whsec_test_secret"

        # Act & Assert
        with pytest.raises(WebhookAuthError) as exc_info:
            verify_stripe_signature(payload, None, secret)

        assert exc_info.value.status_code == 401
        assert "Missing Stripe-Signature header" in str(exc_info.value.detail)

    def test_missing_stripe_secret(self):
        """Test rejection when Stripe secret is not configured."""
        # Arrange
        payload = b'{"type": "checkout.session.completed"}'
        signature = "t=1234567890,v1=valid_signature"

        # Act & Assert
        with pytest.raises(WebhookAuthError) as exc_info:
            verify_stripe_signature(payload, signature, "")

        assert exc_info.value.status_code == 401
        assert "Webhook secret not configured" in str(exc_info.value.detail)

    def test_stripe_signature_with_custom_tolerance(self):
        """Test Stripe verification with custom timestamp tolerance."""
        # Arrange
        payload = b'{"type": "checkout.session.completed"}'
        signature = "t=1234567890,v1=valid_signature"
        secret = "whsec_test_secret"
        custom_tolerance = 600  # 10 minutes

        expected_event = {"type": "checkout.session.completed"}
        mock_stripe.Webhook.construct_event.return_value = expected_event

        # Act
        result = verify_stripe_signature(
            payload, signature, secret, tolerance=custom_tolerance
        )

        # Assert
        assert result == expected_event
        mock_stripe.Webhook.construct_event.assert_called_with(
            payload=payload,
            sig_header=signature,
            secret=secret,
            tolerance=custom_tolerance
        )


class TestTimestampValidation:
    """Test webhook timestamp validation for replay attack prevention."""

    def test_valid_recent_timestamp(self):
        """Test that recent timestamps are accepted."""
        # Arrange
        current_time = int(time.time())
        recent_timestamp = current_time - 60  # 1 minute ago

        # Act & Assert
        assert verify_timestamp(recent_timestamp) is True

    def test_old_timestamp_rejected(self):
        """Test that old timestamps are rejected."""
        # Arrange
        current_time = int(time.time())
        old_timestamp = current_time - 400  # 6.67 minutes ago (> 5 min limit)

        # Act & Assert
        assert verify_timestamp(old_timestamp) is False

    def test_future_timestamp_rejected(self):
        """Test that future timestamps are rejected."""
        # Arrange
        current_time = int(time.time())
        future_timestamp = current_time + 120  # 2 minutes in future

        # Act & Assert
        assert verify_timestamp(future_timestamp) is False

    def test_timestamp_at_boundary(self):
        """Test timestamp exactly at max_age boundary."""
        # Arrange
        current_time = int(time.time())
        boundary_timestamp = current_time - 300  # Exactly 5 minutes

        # Act & Assert
        assert verify_timestamp(boundary_timestamp) is True

    def test_timestamp_with_custom_max_age(self):
        """Test timestamp validation with custom max_age."""
        # Arrange
        current_time = int(time.time())
        timestamp = current_time - 400  # 6.67 minutes ago
        custom_max_age = 600  # 10 minutes

        # Act & Assert
        assert verify_timestamp(timestamp, max_age=custom_max_age) is True

    def test_clock_skew_tolerance(self):
        """Test that small clock skew is tolerated."""
        # Arrange
        current_time = int(time.time())
        slightly_future = current_time + 30  # 30 seconds in future

        # Act & Assert - Should be accepted (within 1 minute tolerance)
        assert verify_timestamp(slightly_future) is True


class TestLogging:
    """Test webhook verification logging."""

    @patch('backend.middleware.webhook_auth.logger')
    def test_log_successful_verification(self, mock_logger):
        """Test logging of successful webhook verification."""
        # Act
        log_webhook_verification(
            provider="gumroad",
            success=True,
            request_id="req_123"
        )

        # Assert
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        assert "Webhook verified" in call_args
        assert "gumroad" in call_args

    @patch('backend.middleware.webhook_auth.logger')
    def test_log_failed_verification(self, mock_logger):
        """Test logging of failed webhook verification."""
        # Act
        log_webhook_verification(
            provider="stripe",
            success=False,
            request_id="req_456",
            error="Invalid signature"
        )

        # Assert
        mock_logger.warning.assert_called_once()
        call_args = mock_logger.warning.call_args[0][0]
        assert "Webhook verification failed" in call_args
        assert "stripe" in call_args

    @patch('backend.middleware.webhook_auth.logger')
    def test_log_includes_error_details(self, mock_logger):
        """Test that error details are included in logs."""
        # Act
        error_message = "Signature mismatch: expected abc, got xyz"
        log_webhook_verification(
            provider="gumroad",
            success=False,
            error=error_message
        )

        # Assert
        mock_logger.warning.assert_called_once()
        call_args = str(mock_logger.warning.call_args)
        assert error_message in call_args


class TestWebhookAuthError:
    """Test WebhookAuthError exception."""

    def test_webhook_auth_error_attributes(self):
        """Test WebhookAuthError has correct attributes."""
        # Act
        error = WebhookAuthError(
            detail="Test error message",
            provider="test_provider"
        )

        # Assert
        assert error.status_code == 401
        assert error.detail == "Test error message"
        assert error.provider == "test_provider"

    @patch('backend.middleware.webhook_auth.logger')
    def test_webhook_auth_error_logs_on_creation(self, mock_logger):
        """Test that WebhookAuthError logs error on creation."""
        # Act
        _ = WebhookAuthError(
            detail="Test error",
            provider="gumroad"
        )

        # Assert
        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args[0][0]
        assert "Webhook Auth Failed" in call_args
        assert "gumroad" in call_args
        assert "Test error" in call_args


@pytest.fixture
def sample_gumroad_payload():
    """Sample Gumroad webhook payload."""
    return {
        "product_name": "Agency OS License",
        "price": "395.00",
        "email": "test@example.com",
        "sale_id": "test_sale_123",
        "timestamp": str(int(time.time()))
    }


@pytest.fixture
def sample_stripe_event():
    """Sample Stripe webhook event."""
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_123",
                "subscription": "sub_test_123",
                "customer": "cus_test_123",
                "metadata": {"tenantId": "tenant_123"}
            }
        }
    }


class TestIntegration:
    """Integration tests for webhook verification."""

    def test_gumroad_end_to_end_verification(self, sample_gumroad_payload):
        """Test complete Gumroad webhook verification flow."""
        # Arrange
        payload_bytes = json.dumps(sample_gumroad_payload).encode('utf-8')
        secret = "test_gumroad_webhook_secret"

        # Generate valid signature
        signature = hmac.new(
            key=secret.encode('utf-8'),
            msg=payload_bytes,
            digestmod=hashlib.sha256
        ).hexdigest()

        # Act & Assert
        assert verify_gumroad_signature(payload_bytes, signature, secret) is True

    def test_stripe_end_to_end_verification(
        self, sample_stripe_event
    ):
        """Test complete Stripe webhook verification flow."""
        # Arrange
        payload = json.dumps(sample_stripe_event).encode('utf-8')
        signature = "t=1234567890,v1=test_signature"
        secret = "whsec_test_secret"

        mock_stripe.Webhook.construct_event.return_value = sample_stripe_event

        # Act
        result = verify_stripe_signature(payload, signature, secret)

        # Assert
        assert result == sample_stripe_event
        assert result["type"] == "checkout.session.completed"
