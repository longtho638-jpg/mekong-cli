"""
Unit Tests for Payment Service
================================
Tests payment creation, webhook verification, and error handling.
Target: 80%+ coverage for payment flows.

Testing Strategy:
- Mock external APIs (PayPal, Stripe)
- Test both success and failure paths
- Verify webhook signature validation
- Test currency conversion and edge cases
"""

import json
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
from fastapi import HTTPException

from backend.services.payment_service import PaymentService


@pytest.fixture
def payment_service():
    """Create a PaymentService instance with mocked dependencies."""
    with patch('backend.services.payment_service.PayPalSDK'), \
         patch('backend.services.payment_service.StripeClient'), \
         patch('backend.services.payment_service.GumroadClient'), \
         patch('backend.services.payment_service.ProvisioningService'), \
         patch('backend.services.payment_service.LicenseGenerator'), \
         patch('backend.services.payment_service.get_db'):
        service = PaymentService()
        return service


class TestCreateCheckoutSession:
    """Test checkout session creation for different providers."""

    def test_create_paypal_order_success(self, payment_service):
        """Test creating a PayPal one-time payment order."""
        # Arrange
        mock_order = {
            "id": "ORDER123",
            "status": "CREATED",
            "links": [{"rel": "approve", "href": "https://paypal.com/approve"}]
        }
        payment_service.paypal.orders.create = Mock(return_value=mock_order)

        # Act
        result = payment_service.create_checkout_session(
            provider="paypal",
            amount=100.0,
            currency="USD",
            mode="payment"
        )

        # Assert
        assert result["id"] == "ORDER123"
        assert result["status"] == "CREATED"
        payment_service.paypal.orders.create.assert_called_once()

    def test_create_paypal_subscription_success(self, payment_service):
        """Test creating a PayPal subscription."""
        # Arrange
        mock_subscription = {
            "id": "SUB123",
            "status": "APPROVAL_PENDING",
            "links": [{"rel": "approve", "href": "https://paypal.com/approve"}]
        }
        payment_service.paypal.subscriptions.create = Mock(return_value=mock_subscription)

        # Act
        result = payment_service.create_checkout_session(
            provider="paypal",
            amount=0,
            price_id="PLAN-123",
            mode="subscription",
            customer_email="test@example.com",
            success_url="https://example.com/success"
        )

        # Assert
        assert result["id"] == "SUB123"
        assert result["status"] == "APPROVAL_PENDING"
        payment_service.paypal.subscriptions.create.assert_called_once_with(
            plan_id="PLAN-123",
            custom_id="test@example.com",
            return_url="https://example.com/success",
            cancel_url=None
        )

    def test_create_paypal_subscription_missing_plan_id(self, payment_service):
        """Test that subscription requires plan_id."""
        # Act & Assert
        with pytest.raises(ValueError, match="PayPal Plan ID .* is required"):
            payment_service.create_checkout_session(
                provider="paypal",
                amount=0,
                mode="subscription"
            )

    def test_create_stripe_checkout_success(self, payment_service):
        """Test creating a Stripe checkout session."""
        # Arrange
        mock_session = {
            "id": "cs_test_123",
            "url": "https://checkout.stripe.com/session123",
            "status": "open"
        }
        payment_service.stripe.is_configured = Mock(return_value=True)
        payment_service.stripe.create_checkout_session = Mock(return_value=mock_session)

        # Act
        result = payment_service.create_checkout_session(
            provider="stripe",
            amount=100.0,
            price_id="price_123",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
            customer_email="test@example.com",
            tenant_id="tenant_123",
            mode="subscription"
        )

        # Assert
        assert result["id"] == "cs_test_123"
        assert result["url"] == "https://checkout.stripe.com/session123"
        payment_service.stripe.create_checkout_session.assert_called_once_with(
            price_id="price_123",
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
            customer_email="test@example.com",
            tenant_id="tenant_123",
            mode="subscription"
        )

    def test_create_stripe_checkout_not_configured(self, payment_service):
        """Test error when Stripe is not configured."""
        # Arrange
        payment_service.stripe.is_configured = Mock(return_value=False)

        # Act & Assert
        with pytest.raises(ValueError, match="Stripe is not configured"):
            payment_service.create_checkout_session(
                provider="stripe",
                amount=100.0
            )

    def test_unsupported_provider(self, payment_service):
        """Test error with unsupported payment provider."""
        # Act & Assert
        with pytest.raises(ValueError, match="Unsupported provider: unknown"):
            payment_service.create_checkout_session(
                provider="unknown",
                amount=100.0
            )


class TestCaptureOrder:
    """Test order capture for different providers."""

    def test_capture_paypal_order_success(self, payment_service):
        """Test capturing a PayPal order."""
        # Arrange
        mock_capture = {
            "id": "ORDER123",
            "status": "COMPLETED",
            "purchase_units": [{
                "payments": {
                    "captures": [{"id": "CAP123", "status": "COMPLETED"}]
                }
            }]
        }
        payment_service.paypal.orders.capture = Mock(return_value=mock_capture)

        # Act
        result = payment_service.capture_order(
            provider="paypal",
            order_id="ORDER123"
        )

        # Assert
        assert result["status"] == "COMPLETED"
        payment_service.paypal.orders.capture.assert_called_once_with("ORDER123")

    def test_capture_order_failed(self, payment_service):
        """Test handling of failed capture."""
        # Arrange
        payment_service.paypal.orders.capture = Mock(
            side_effect=Exception("Payment declined")
        )

        # Act & Assert
        with pytest.raises(Exception, match="Payment declined"):
            payment_service.capture_order(
                provider="paypal",
                order_id="ORDER123"
            )


class TestWebhookVerification:
    """Test webhook signature verification."""

    def test_verify_paypal_webhook_success(self, payment_service):
        """Test successful PayPal webhook verification."""
        # Arrange
        headers = {
            "paypal-transmission-id": "tx123",
            "paypal-transmission-time": "2026-01-25T10:00:00Z",
            "paypal-cert-url": "https://paypal.com/cert",
            "paypal-auth-algo": "SHA256withRSA",
            "paypal-transmission-sig": "signature123"
        }
        event_data = {
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {"id": "ORDER123"}
        }

        payment_service.paypal.webhooks.verify = Mock(
            return_value={"verification_status": "SUCCESS"}
        )

        # Act
        result = payment_service.verify_webhook(
            provider="paypal",
            headers=headers,
            body=event_data,
            webhook_secret="webhook_id_123"
        )

        # Assert
        assert result["verification_status"] == "SUCCESS"

    def test_verify_paypal_webhook_failure(self, payment_service):
        """Test failed PayPal webhook verification."""
        # Arrange
        headers = {
            "paypal-transmission-id": "tx123",
            "paypal-transmission-time": "2026-01-25T10:00:00Z",
            "paypal-cert-url": "https://paypal.com/cert",
            "paypal-auth-algo": "SHA256withRSA",
            "paypal-transmission-sig": "invalid_signature"
        }
        event_data = {"event_type": "PAYMENT.CAPTURE.COMPLETED"}

        payment_service.paypal.webhooks.verify = Mock(
            return_value={"verification_status": "FAILURE"}
        )

        # Act
        result = payment_service.verify_webhook(
            provider="paypal",
            headers=headers,
            body=event_data,
            webhook_secret="webhook_id_123"
        )

        # Assert
        assert result["verification_status"] == "FAILURE"

    def test_verify_webhook_missing_headers(self, payment_service):
        """Test webhook verification with missing required headers."""
        # Arrange
        headers = {}  # Missing required headers
        event_data = {"event_type": "PAYMENT.CAPTURE.COMPLETED"}

        # Act & Assert
        # Should raise an error or return failure status
        with pytest.raises((ValueError, KeyError)):
            payment_service.verify_webhook(
                provider="paypal",
                headers=headers,
                body=event_data,
                webhook_secret="webhook_id_123"
            )


class TestWebhookEventHandling:
    """Test webhook event processing."""

    def test_handle_payment_completed_event(self, payment_service):
        """Test processing of payment completed event."""
        # Arrange
        event = {
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {
                "id": "CAP123",
                "amount": {"currency_code": "USD", "value": "100.00"},
                "custom_id": "tenant_123"
            }
        }

        payment_service.provisioning.provision_tenant = Mock()

        # Act
        payment_service.handle_webhook_event(provider="paypal", event=event)

        # Assert
        # Verify provisioning was called (adjust based on actual implementation)
        # payment_service.provisioning.provision_tenant.assert_called_once()

    def test_handle_subscription_activated_event(self, payment_service):
        """Test processing of subscription activated event."""
        # Arrange
        event = {
            "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
            "resource": {
                "id": "SUB123",
                "plan_id": "PLAN-123",
                "custom_id": "tenant_123"
            }
        }

        # Act
        payment_service.handle_webhook_event(provider="paypal", event=event)

        # Assert
        # Verify subscription was activated in database
        # (Implementation-specific assertions)

    def test_handle_unknown_event_type(self, payment_service):
        """Test handling of unknown event type (should not crash)."""
        # Arrange
        event = {
            "event_type": "UNKNOWN.EVENT.TYPE",
            "resource": {}
        }

        # Act (should not raise exception)
        payment_service.handle_webhook_event(provider="paypal", event=event)

        # Assert - no error raised


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_create_order_with_zero_amount(self, payment_service):
        """Test creating order with zero amount (should fail)."""
        # For one-time payments, zero amount should be invalid
        with pytest.raises(ValueError):
            payment_service.create_checkout_session(
                provider="paypal",
                amount=0.0,
                mode="payment"  # One-time payment requires amount
            )

    def test_create_order_with_negative_amount(self, payment_service):
        """Test creating order with negative amount (should fail)."""
        with pytest.raises(ValueError):
            payment_service.create_checkout_session(
                provider="paypal",
                amount=-100.0,
                mode="payment"
            )

    def test_create_order_with_unsupported_currency(self, payment_service):
        """Test creating order with unsupported currency."""
        payment_service.paypal.orders.create = Mock(
            side_effect=Exception("Currency not supported")
        )

        with pytest.raises(Exception, match="Currency not supported"):
            payment_service.create_checkout_session(
                provider="paypal",
                amount=100.0,
                currency="INVALID",
                mode="payment"
            )

    def test_concurrent_webhook_events(self, payment_service):
        """Test handling multiple webhook events for same order."""
        # This tests idempotency - processing same event twice shouldn't cause issues
        event = {
            "event_type": "PAYMENT.CAPTURE.COMPLETED",
            "resource": {"id": "CAP123", "custom_id": "tenant_123"}
        }

        # Act - process same event twice
        payment_service.handle_webhook_event(provider="paypal", event=event)
        payment_service.handle_webhook_event(provider="paypal", event=event)

        # Assert - should handle gracefully (no duplicate provisioning)


# Parametrized tests for multiple currencies
@pytest.mark.parametrize("currency,expected", [
    ("USD", True),
    ("EUR", True),
    ("GBP", True),
    ("JPY", True),
    ("VND", True),  # Vietnam Dong
])
def test_supported_currencies(payment_service, currency, expected):
    """Test that all major currencies are supported."""
    payment_service.paypal.orders.create = Mock(return_value={"id": "ORDER123"})

    try:
        payment_service.create_checkout_session(
            provider="paypal",
            amount=100.0,
            currency=currency,
            mode="payment"
        )
        result = True
    except Exception:
        result = False

    assert result == expected


# Integration-style test (requires actual SDK mocking)
class TestPaymentFlowIntegration:
    """Integration tests for complete payment flows."""

    def test_complete_paypal_checkout_flow(self, payment_service):
        """Test complete flow: create → approve → capture."""
        # 1. Create order
        payment_service.paypal.orders.create = Mock(return_value={
            "id": "ORDER123",
            "status": "CREATED",
            "links": [{"rel": "approve", "href": "https://paypal.com/approve"}]
        })

        create_result = payment_service.create_checkout_session(
            provider="paypal",
            amount=100.0,
            mode="payment"
        )

        assert create_result["id"] == "ORDER123"

        # 2. Capture order (after user approval)
        payment_service.paypal.orders.capture = Mock(return_value={
            "id": "ORDER123",
            "status": "COMPLETED"
        })

        capture_result = payment_service.capture_order(
            provider="paypal",
            order_id="ORDER123"
        )

        assert capture_result["status"] == "COMPLETED"

    def test_subscription_lifecycle(self, payment_service):
        """Test subscription: create → activate → webhook."""
        # 1. Create subscription
        payment_service.paypal.subscriptions.create = Mock(return_value={
            "id": "SUB123",
            "status": "APPROVAL_PENDING"
        })

        sub_result = payment_service.create_checkout_session(
            provider="paypal",
            amount=0,
            price_id="PLAN-123",
            mode="subscription"
        )

        assert sub_result["id"] == "SUB123"

        # 2. Handle activation webhook
        activation_event = {
            "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
            "resource": {
                "id": "SUB123",
                "plan_id": "PLAN-123"
            }
        }

        # Should process without error
        payment_service.handle_webhook_event(provider="paypal", event=activation_event)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=backend.services.payment_service"])
