"""
Unit Tests for PayPal Webhook Handler
======================================
Tests webhook signature verification and event processing.
Critical for security - all webhooks must be verified!

Security Requirements:
- MUST verify signature for all production webhooks
- MUST reject invalid signatures (fail closed)
- MUST handle replay attacks (idempotency)
- MUST log all webhook events for audit
"""

import json
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from backend.api.routers.paypal_webhooks import router
from backend.services.payment_service import PaymentService


@pytest.fixture
def client():
    """Create a FastAPI test client."""
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture
def valid_headers():
    """Valid PayPal webhook headers."""
    return {
        "PAYPAL-TRANSMISSION-ID": "tx-12345",
        "PAYPAL-TRANSMISSION-TIME": "2026-01-25T10:00:00Z",
        "PAYPAL-CERT-URL": "https://api.paypal.com/v1/notifications/certs/CERT-ID",
        "PAYPAL-AUTH-ALGO": "SHA256withRSA",
        "PAYPAL-TRANSMISSION-SIG": "valid-signature-hash"
    }


@pytest.fixture
def payment_completed_event():
    """Sample payment completed webhook event."""
    return {
        "id": "WH-EVENT123",
        "event_version": "1.0",
        "create_time": "2026-01-25T10:00:00Z",
        "resource_type": "capture",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "summary": "Payment completed for ORDER123",
        "resource": {
            "id": "CAP-12345",
            "amount": {
                "currency_code": "USD",
                "value": "100.00"
            },
            "final_capture": True,
            "seller_protection": {
                "status": "ELIGIBLE"
            },
            "custom_id": "tenant_123",
            "invoice_id": "INV-001",
            "create_time": "2026-01-25T10:00:00Z",
            "update_time": "2026-01-25T10:00:05Z",
            "status": "COMPLETED"
        }
    }


@pytest.fixture
def subscription_activated_event():
    """Sample subscription activated webhook event."""
    return {
        "id": "WH-EVENT456",
        "event_version": "1.0",
        "create_time": "2026-01-25T11:00:00Z",
        "resource_type": "subscription",
        "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
        "summary": "Subscription activated for PLAN-123",
        "resource": {
            "id": "I-SUB12345",
            "plan_id": "P-PLAN123",
            "start_time": "2026-01-25T11:00:00Z",
            "quantity": "1",
            "subscriber": {
                "email_address": "customer@example.com",
                "name": {
                    "given_name": "John",
                    "surname": "Doe"
                }
            },
            "billing_info": {
                "next_billing_time": "2026-02-25T11:00:00Z",
                "cycle_executions": [
                    {
                        "tenure_type": "REGULAR",
                        "sequence": 1,
                        "cycles_completed": 0
                    }
                ]
            },
            "custom_id": "tenant_456",
            "status": "ACTIVE"
        }
    }


class TestWebhookSignatureVerification:
    """Test webhook signature verification (CRITICAL for security)."""

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_valid_signature_accepted(self, mock_service, client, valid_headers, payment_completed_event):
        """Test that valid signature is accepted."""
        # Arrange
        mock_service.verify_webhook.return_value = {
            "verification_status": "SUCCESS"
        }
        mock_service.handle_webhook_event.return_value = None

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "processed"
        mock_service.verify_webhook.assert_called_once()
        mock_service.handle_webhook_event.assert_called_once()

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_invalid_signature_rejected(self, mock_service, client, valid_headers, payment_completed_event):
        """Test that invalid signature is rejected (FAIL CLOSED)."""
        # Arrange
        mock_service.verify_webhook.return_value = {
            "verification_status": "FAILURE"
        }

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert
        assert response.status_code == 401
        assert "Invalid signature" in response.json()["detail"]
        mock_service.handle_webhook_event.assert_not_called()

    @patch.dict('os.environ', {}, clear=True)  # No PAYPAL_WEBHOOK_ID
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_missing_webhook_id_dev_mode(self, mock_service, client, valid_headers, payment_completed_event):
        """Test behavior when PAYPAL_WEBHOOK_ID is not set (dev mode)."""
        # Arrange
        mock_service.handle_webhook_event.return_value = None

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert
        # Should still process (dev mode), but log warning
        assert response.status_code == 200
        mock_service.verify_webhook.assert_not_called()

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_missing_signature_header_rejected(self, mock_service, client, payment_completed_event):
        """Test that missing signature header is rejected."""
        # Arrange
        invalid_headers = {
            "PAYPAL-TRANSMISSION-ID": "tx-12345"
            # Missing other required headers
        }

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=invalid_headers
        )

        # Assert
        assert response.status_code == 401

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_verification_exception_rejected(self, mock_service, client, valid_headers, payment_completed_event):
        """Test that verification exceptions are rejected."""
        # Arrange
        mock_service.verify_webhook.side_effect = Exception("Network error")

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert
        assert response.status_code == 401
        assert "Verification error" in response.json()["detail"]


class TestWebhookEventProcessing:
    """Test webhook event processing logic."""

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_payment_completed_processing(self, mock_service, client, valid_headers, payment_completed_event):
        """Test processing of PAYMENT.CAPTURE.COMPLETED event."""
        # Arrange
        mock_service.verify_webhook.return_value = {"verification_status": "SUCCESS"}
        mock_service.handle_webhook_event.return_value = None

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["event"] == "PAYMENT.CAPTURE.COMPLETED"

        # Verify event was passed to handler
        call_args = mock_service.handle_webhook_event.call_args
        assert call_args[1]["provider"] == "paypal"
        assert call_args[1]["event"]["event_type"] == "PAYMENT.CAPTURE.COMPLETED"

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_subscription_activated_processing(self, mock_service, client, valid_headers, subscription_activated_event):
        """Test processing of BILLING.SUBSCRIPTION.ACTIVATED event."""
        # Arrange
        mock_service.verify_webhook.return_value = {"verification_status": "SUCCESS"}
        mock_service.handle_webhook_event.return_value = None

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=subscription_activated_event,
            headers=valid_headers
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["event"] == "BILLING.SUBSCRIPTION.ACTIVATED"

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_processing_error_returns_200(self, mock_service, client, valid_headers, payment_completed_event):
        """Test that processing errors return 200 (to prevent retries)."""
        # Arrange
        mock_service.verify_webhook.return_value = {"verification_status": "SUCCESS"}
        mock_service.handle_webhook_event.side_effect = Exception("Database error")

        # Act
        response = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert
        # Should return 200 to acknowledge receipt (prevents infinite retries)
        assert response.status_code == 200
        assert response.json()["status"] == "error"
        assert "Database error" in response.json()["message"]

    def test_invalid_json_rejected(self, client, valid_headers):
        """Test that invalid JSON is rejected."""
        # Act
        response = client.post(
            "/webhooks/paypal/",
            data="invalid json",
            headers=valid_headers
        )

        # Assert
        assert response.status_code == 400


class TestWebhookIdempotency:
    """Test that duplicate webhook events are handled correctly."""

    @patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
    @patch('backend.api.routers.paypal_webhooks.payment_service')
    def test_duplicate_event_idempotent(self, mock_service, client, valid_headers, payment_completed_event):
        """Test that processing same event twice is idempotent."""
        # Arrange
        mock_service.verify_webhook.return_value = {"verification_status": "SUCCESS"}
        mock_service.handle_webhook_event.return_value = None

        # Act - send same event twice
        response1 = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )
        response2 = client.post(
            "/webhooks/paypal/",
            json=payment_completed_event,
            headers=valid_headers
        )

        # Assert - both should succeed
        assert response1.status_code == 200
        assert response2.status_code == 200

        # Should be called twice (actual deduplication in payment_service)
        assert mock_service.handle_webhook_event.call_count == 2


class TestWebhookStatusEndpoint:
    """Test webhook status endpoint."""

    def test_webhook_status(self, client):
        """Test /webhooks/paypal/status endpoint."""
        # Act
        response = client.get("/webhooks/paypal/status")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "webhook_url" in data
        assert "status" in data


# Parametrized tests for different event types
@pytest.mark.parametrize("event_type", [
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.CAPTURE.DENIED",
    "PAYMENT.CAPTURE.REFUNDED",
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.CANCELLED",
    "BILLING.SUBSCRIPTION.SUSPENDED",
    "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
])
@patch.dict('os.environ', {'PAYPAL_WEBHOOK_ID': 'webhook_id_123'})
@patch('backend.api.routers.paypal_webhooks.payment_service')
def test_various_event_types(mock_service, client, valid_headers, event_type):
    """Test handling of various PayPal event types."""
    # Arrange
    event = {
        "id": "WH-TEST",
        "event_type": event_type,
        "resource": {"id": "RES-123"}
    }
    mock_service.verify_webhook.return_value = {"verification_status": "SUCCESS"}
    mock_service.handle_webhook_event.return_value = None

    # Act
    response = client.post(
        "/webhooks/paypal/",
        json=event,
        headers=valid_headers
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["event"] == event_type


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=backend.api.routers.paypal_webhooks"])
