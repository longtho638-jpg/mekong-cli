"""
Test Suite for Stripe Payment Service
======================================
Unit tests for StripeService functionality.
"""

from unittest.mock import MagicMock, patch

import pytest

from backend.services.stripe_service import StripeService


class TestStripeService:
    """Test StripeService methods."""

    @pytest.fixture
    def stripe_service(self):
        """Create StripeService instance with mocked dependencies."""
        with (
            patch("backend.services.stripe_service.get_db") as mock_db,
            patch("backend.services.stripe_service.LicenseGenerator") as mock_license,
        ):
            service = StripeService()
            service.db = mock_db.return_value
            service.licensing = mock_license.return_value

            yield service

    def test_is_configured_returns_true_when_stripe_ready(self, stripe_service):
        """Test is_configured returns True when Stripe is properly configured."""
        with patch.object(stripe_service.client, "is_configured", return_value=True):
            assert stripe_service.is_configured() is True

    def test_is_configured_returns_false_when_stripe_not_ready(self, stripe_service):
        """Test is_configured returns False when Stripe is not configured."""
        with patch.object(stripe_service.client, "is_configured", return_value=False):
            assert stripe_service.is_configured() is False

    def test_create_checkout_session_success(self, stripe_service):
        """Test successful checkout session creation."""
        mock_session = {"id": "cs_test_123", "url": "https://checkout.stripe.com/pay/cs_test_123"}

        with (
            patch.object(stripe_service.client, "is_configured", return_value=True),
            patch.object(
                stripe_service.client, "create_checkout_session", return_value=mock_session
            ),
        ):
            result = stripe_service.create_checkout_session(
                tier="pro",
                customer_email="test@example.com",
                tenant_id="org_123",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel",
            )

            assert result["id"] == "cs_test_123"
            assert result["url"] == "https://checkout.stripe.com/pay/cs_test_123"
            assert result["status"] == "created"

    def test_create_checkout_session_maps_tier_to_price(self, stripe_service):
        """Test checkout session auto-maps tier to default price ID."""
        with (
            patch.object(stripe_service.client, "is_configured", return_value=True),
            patch.object(stripe_service.client, "create_checkout_session") as mock_create,
        ):
            mock_create.return_value = {"id": "cs_test", "url": "https://example.com"}

            stripe_service.create_checkout_session(
                tier="pro",
                customer_email="test@example.com",
                tenant_id="org_123",
                success_url="https://example.com/success",
                cancel_url="https://example.com/cancel",
            )

            # Verify it was called with the correct price_id
            call_args = mock_create.call_args
            assert call_args.kwargs["price_id"] == "price_pro_monthly"

    def test_create_checkout_session_invalid_tier_raises_error(self, stripe_service):
        """Test invalid tier raises ValueError."""
        with patch.object(stripe_service.client, "is_configured", return_value=True):
            with pytest.raises(ValueError, match="Invalid tier"):
                stripe_service.create_checkout_session(
                    tier="invalid_tier",
                    customer_email="test@example.com",
                    tenant_id="org_123",
                    success_url="https://example.com/success",
                    cancel_url="https://example.com/cancel",
                )

    def test_create_checkout_session_not_configured_raises_error(self, stripe_service):
        """Test checkout session creation fails when Stripe not configured."""
        with patch.object(stripe_service.client, "is_configured", return_value=False):
            with pytest.raises(ValueError, match="Stripe is not configured"):
                stripe_service.create_checkout_session(
                    tier="pro",
                    customer_email="test@example.com",
                    tenant_id="org_123",
                    success_url="https://example.com/success",
                    cancel_url="https://example.com/cancel",
                )

    def test_handle_checkout_completed_event(self, stripe_service):
        """Test checkout.session.completed webhook processing."""
        event = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_123",
                    "subscription": "sub_123",
                    "customer": "cus_123",
                    "customer_details": {"email": "test@example.com"},
                    "metadata": {"tenantId": "org_123"},
                }
            },
        }

        with (
            patch.object(stripe_service, "_extract_tier_from_session", return_value="pro"),
            patch.object(stripe_service, "_generate_and_store_license") as mock_generate,
        ):
            result = stripe_service.handle_webhook_event(event)

            assert result["status"] == "success"
            mock_generate.assert_called_once()

    def test_handle_subscription_deleted_event(self, stripe_service):
        """Test customer.subscription.deleted webhook processing."""
        event = {
            "type": "customer.subscription.deleted",
            "data": {"object": {"id": "sub_123", "metadata": {"tenantId": "org_123"}}},
        }

        mock_table = MagicMock()
        stripe_service.db.table.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.eq.return_value = mock_table

        result = stripe_service.handle_webhook_event(event)

        assert result["status"] == "success"
        assert result["message"] == "Subscription cancelled"

    def test_cancel_subscription_success(self, stripe_service):
        """Test successful subscription cancellation."""
        mock_result = {"id": "sub_123", "status": "canceled"}

        with (
            patch.object(stripe_service.client, "is_configured", return_value=True),
            patch.object(stripe_service.client, "cancel_subscription", return_value=mock_result),
        ):
            mock_table = MagicMock()
            stripe_service.db.table.return_value = mock_table
            mock_table.update.return_value = mock_table
            mock_table.eq.return_value = mock_table

            result = stripe_service.cancel_subscription("sub_123")

            assert result["status"] == "canceled"
            stripe_service.db.table.assert_called_with("subscriptions")

    def test_get_subscription_status_success(self, stripe_service):
        """Test successful subscription status retrieval."""
        mock_subscription = {
            "id": "sub_123",
            "status": "active",
            "current_period_end": 1234567890,
            "cancel_at_period_end": False,
            "customer": "cus_123",
            "items": {"data": [{"price": {"id": "price_pro_monthly"}}]},
        }

        with (
            patch.object(stripe_service.client, "is_configured", return_value=True),
            patch.object(stripe_service.client, "get_subscription", return_value=mock_subscription),
        ):
            result = stripe_service.get_subscription_status("sub_123")

            assert result["id"] == "sub_123"
            assert result["status"] == "active"
            assert result["plan"] == "price_pro_monthly"

    def test_map_price_to_tier(self, stripe_service):
        """Test price ID to tier mapping."""
        assert stripe_service.map_price_to_tier("price_pro_monthly") == "pro"
        assert stripe_service.map_price_to_tier("price_enterprise_yearly") == "enterprise"
        assert stripe_service.map_price_to_tier("price_unknown") == "pro"  # Default fallback

    def test_map_tier_to_price(self, stripe_service):
        """Test tier to price ID mapping."""
        assert stripe_service.map_tier_to_price("pro", "monthly") == "price_pro_monthly"
        assert stripe_service.map_tier_to_price("enterprise", "yearly") == "price_enterprise_yearly"

        with pytest.raises(ValueError, match="Invalid tier"):
            stripe_service.map_tier_to_price("invalid", "monthly")

        with pytest.raises(ValueError, match="Invalid billing_cycle"):
            stripe_service.map_tier_to_price("pro", "invalid")

    def test_generate_and_store_license(self, stripe_service):
        """Test license generation and storage."""
        stripe_service.licensing.generate.return_value = "AGENCYOS-PRO-ABC123"

        mock_table = MagicMock()
        stripe_service.db.table.return_value = mock_table
        mock_table.upsert.return_value = mock_table

        stripe_service._generate_and_store_license(
            email="test@example.com",
            tier="pro",
            tenant_id="org_123",
            stripe_subscription_id="sub_123",
        )

        stripe_service.licensing.generate.assert_called_once_with(
            format="agencyos", tier="pro", email="test@example.com"
        )

        stripe_service.db.table.assert_called_with("licenses")
        mock_table.upsert.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
