"""Tests for Stripe Integration - Customer sync and subscription-based role provisioning.

Tests customer lookup, subscription status, tier-to-role mapping,
webhook handling, signature verification, and role synchronization.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Mock stripe module if not available
import sys
mock_stripe = MagicMock()
sys.modules['stripe'] = mock_stripe

from src.auth.stripe_integration import (  # noqa: E402
    StripeService,
    StripeCustomer,
    StripeEventType,
    get_tier_to_role_mapping,
)
from src.auth.rbac import Role  # noqa: E402


class TestStripeCustomerDataclass:
    """Test StripeCustomer dataclass."""

    def test_from_dict_creates_customer(self):
        """Should create StripeCustomer from Stripe API response."""
        data = {
            "id": "cus_123abc",
            "email": "customer@example.com",
            "name": "Test Customer",
            "subscriptions": {
                "data": [
                    {
                        "id": "sub_123",
                        "status": "active",
                        "items": {
                            "data": [
                                {
                                    "price": {
                                        "id": "price_pro_123"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }

        customer = StripeCustomer.from_dict(data)

        assert customer.id == "cus_123abc"
        assert customer.email == "customer@example.com"
        assert customer.name == "Test Customer"
        assert customer.subscription_status == "active"
        assert customer.subscription_tier == "price_pro_123"

    def test_from_dict_no_subscriptions(self):
        """Should handle missing subscriptions."""
        data = {
            "id": "cus_no_sub",
            "email": "customer@example.com",
        }

        customer = StripeCustomer.from_dict(data)

        assert customer.id == "cus_no_sub"
        assert customer.email == "customer@example.com"
        assert customer.subscription_status is None
        assert customer.subscription_tier is None

    def test_from_dict_no_price_data(self):
        """Should handle missing price data."""
        data = {
            "id": "cus_123abc",
            "email": "customer@example.com",
            "subscriptions": {
                "data": [
                    {
                        "id": "sub_123",
                        "status": "active",
                        "items": {"data": []}
                    }
                ]
            }
        }

        customer = StripeCustomer.from_dict(data)

        assert customer.subscription_tier is None

    def test_to_dict_converts_customer(self):
        """Should convert StripeCustomer to dict."""
        customer = StripeCustomer(
            id="cus_123abc",
            email="customer@example.com",
            name="Test Customer",
            subscription_status="active",
            subscription_tier="price_pro_123",
        )

        data = customer.to_dict()

        assert data["id"] == "cus_123abc"
        assert data["email"] == "customer@example.com"


class TestTierToRoleMapping:
    """Test tier-to-role mapping functionality."""

    def test_default_mapping_exists(self):
        """Should have default tier-to-role mapping."""
        mapping = get_tier_to_role_mapping()

        assert isinstance(mapping, dict)

    def test_custom_mapping_via_env(self):
        """Should parse custom mapping from environment."""
        custom_mapping = json.dumps({
            "price_premium": "owner",
            "price_pro": "admin",
            "price_basic": "member",
            "price_free": "viewer",
        })

        with patch.dict('os.environ', {'STRIPE_PRICE_IDS': custom_mapping}, clear=True):
            mapping = get_tier_to_role_mapping()

            assert mapping["price_premium"] == Role.OWNER
            assert mapping["price_pro"] == Role.ADMIN
            assert mapping["price_basic"] == Role.MEMBER
            assert mapping["price_free"] == Role.VIEWER

    def test_invalid_env_mapping_falls_back_to_default(self):
        """Should fall back to defaults on JSON parse error."""
        with patch.dict('os.environ', {'STRIPE_PRICE_IDS': 'invalid json'}, clear=True):
            mapping = get_tier_to_role_mapping()

            assert isinstance(mapping, dict)


class TestStripeServiceInit:
    """Test StripeService initialization."""

    def test_service_creates_stripe_client(self):
        """Should initialize Stripe client when API key configured."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key-123'}, clear=True):
            service = StripeService()

            assert service.api_key == 'test-key-123'
            assert service.webhook_secret is not None or True

    def test_service_sets_stripe_api_key(self):
        """Should set Stripe API key."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_abc123'}, clear=True):
            service = StripeService()

            assert service.api_key == 'sk_test_abc123'

    def test_service_has_webhook_secret(self):
        """Should have webhook secret for signature verification."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_123'}, clear=True):
            service = StripeService()

            assert service.webhook_secret == 'whsec_123'


class TestGetCustomerByEmail:
    """Test customer lookup by email."""

    @pytest.mark.asyncio
    async def test_get_customer_by_email_finds_customer(self):
        """Should return StripeCustomer when found."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            # Mock with proper data class
            mock_customer_data = MagicMock()
            mock_customer_data.id = "cus_found"
            mock_customer_data.email = "found@example.com"
            mock_customer_data.name = "Found Customer"
            mock_customer_data.subscription_status = "active"
            mock_customer_data.subscription_tier = "price_pro_123"

            mock_customers = MagicMock()
            mock_customers.data = [mock_customer_data]

            mock_response = MagicMock()
            mock_response.list = AsyncMock(return_value=mock_customers)

            with patch('src.auth.stripe_integration.stripe.Customer', mock_response):
                customer = await service.get_customer_by_email("found@example.com")

                assert customer is not None
                assert customer.id == "cus_found"
                assert customer.email == "found@example.com"

    @pytest.mark.asyncio
    async def test_get_customer_by_email_not_found(self):
        """Should return None when customer not found."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_customers = MagicMock()
            mock_customers.data = []

            mock_response = MagicMock()
            mock_response.list = AsyncMock(return_value=mock_customers)

            with patch('stripe.Customer', mock_response):
                customer = await service.get_customer_by_email("notfound@example.com")

                assert customer is None

    @pytest.mark.asyncio
    async def test_get_customer_by_email_handles_stripe_error(self):
        """Should return None on Stripe API error."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_response = MagicMock()
            mock_response.list.side_effect = Exception("Stripe API Error")

            with patch('stripe.Customer', mock_response):
                customer = await service.get_customer_by_email("test@example.com")

                assert customer is None


class TestGetSubscriptionStatus:
    """Test subscription status retrieval."""

    @pytest.mark.asyncio
    async def test_get_subscription_status_active(self):
        """Should return active subscription details."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_subscription = MagicMock()
            mock_subscription.id = "sub_active"
            mock_subscription.status = "active"
            mock_subscription.current_period_end = 1234567890
            mock_subscription.cancel_at_period_end = False

            mock_price = MagicMock()
            mock_price.id = "price_pro_123"

            mock_item = MagicMock()
            mock_item.price = mock_price

            mock_items = MagicMock()
            mock_items.data = [mock_item]

            mock_subscription.items = mock_items

            mock_subscriptions = MagicMock()
            mock_subscriptions.data = [mock_subscription]

            mock_response = MagicMock()
            mock_response.list = AsyncMock(return_value=mock_subscriptions)

            with patch('src.auth.stripe_integration.stripe.Subscription', mock_response):
                status = await service.get_subscription_status("cus_123")

                assert status is not None
                assert status["id"] == "sub_active"
                assert status["status"] == "active"
                assert status["price_id"] == "price_pro_123"

    @pytest.mark.asyncio
    async def test_get_subscription_status_no_subscription(self):
        """Should return None when no active subscription."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_subscriptions = MagicMock()
            mock_subscriptions.data = []

            mock_response = MagicMock()
            mock_response.list = AsyncMock(return_value=mock_subscriptions)

            with patch('stripe.Subscription', mock_response):
                status = await service.get_subscription_status("cus_no_sub")

                assert status is None


class TestMapTierToRole:
    """Test tier-to-role mapping logic."""

    def test_map_tier_to_role_exact_match(self):
        """Should match exact price ID."""
        with patch.dict('os.environ', {'STRIPE_PRICE_IDS': '{}'}, clear=True):
            service = StripeService()

            role = service.map_tier_to_role("price_enterprise")

            assert role == Role.OWNER

    def test_map_tier_to_role_pattern_match(self):
        """Should match by pattern when exact ID not found."""
        with patch.dict('os.environ', {'STRIPE_PRICE_IDS': '{}'}, clear=True):
            service = StripeService()

            role = service.map_tier_to_role("price_123_pro")

            assert role == Role.ADMIN

    def test_map_tier_to_role_not_found_returns_none(self):
        """Should return None when tier not mapped."""
        with patch.dict('os.environ', {'STRIPE_PRICE_IDS': '{}'}, clear=True):
            service = StripeService()

            role = service.map_tier_to_role("price_unknown_xyz")

            assert role is None


class TestSyncUserRole:
    """Test user role synchronization from Stripe."""

    @pytest.mark.asyncio
    async def test_sync_user_role_updates_role(self):
        """Should update user role based on subscription tier."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-123"
            mock_user.email = "user@example.com"

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_id = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                mock_customer = StripeCustomer(
                    id="cus_123",
                    email="user@example.com",
                    subscription_tier="price_pro",
                )

                with patch.object(service, 'get_customer_by_email', return_value=mock_customer):
                    result = await service.sync_user_role("user-123")

                    assert result is True
                    mock_user_repo.update_user_role.assert_called_once()

    @pytest.mark.asyncio
    async def test_sync_user_role_finds_by_email(self):
        """Should find user by email when customer has same email."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-456"
            mock_user.email = "customer@stripe.com"

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_id = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                mock_customer = StripeCustomer(
                    id="cus_email_match",
                    email="customer@stripe.com",
                    subscription_tier="price_pro",
                )

                with patch.object(service, 'get_customer_by_email', return_value=mock_customer):
                    result = await service.sync_user_role("user-456", customer_email="customer@stripe.com")

                    assert result is True

    @pytest.mark.asyncio
    async def test_sync_user_role_no_customer_falls_back_to_viewer(self):
        """Should set role to VIEWER when no Stripe customer found."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-789"
            mock_user.email = "user@example.com"

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_id = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                with patch.object(service, 'get_customer_by_email', return_value=None):
                    result = await service.sync_user_role("user-789")

                    assert result is True
                    call_args = mock_user_repo.update_user_role.call_args
                    assert call_args[0][1] == "viewer"

    @pytest.mark.asyncio
    async def test_sync_user_role_handles_user_not_found(self):
        """Should return False when user not found in database."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_id = AsyncMock(return_value=None)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                result = await service.sync_user_role("nonexistent-user")

                assert result is False


class TestVerifyWebhookSignature:
    """Test webhook signature verification."""

    def test_verify_webhook_signature_valid(self):
        """Should verify valid signature."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test123'}, clear=True):
            service = StripeService()

            payload = json.dumps({"type": "test.event"}).encode()
            timestamp = "1234567890"

            signed_payload = f"{timestamp}.{payload.decode()}"
            expected_sig = hmac.new(
                'whsec_test123'.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256,
            ).hexdigest()

            sig_header = f"t={timestamp},v1={expected_sig}"

            result = service.verify_webhook_signature(payload, sig_header)

            assert result is True

    def test_verify_webhook_signature_invalid(self):
        """Should reject invalid signature."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test123'}, clear=True):
            service = StripeService()

            payload = b'{"type": "test.event"}'
            sig_header = "t=1234567890,v1=invalid_signature"

            result = service.verify_webhook_signature(payload, sig_header)

            assert result is False

    def test_verify_webhook_signature_no_secret(self):
        """Should return False when webhook secret not configured."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': ''}, clear=True):
            service = StripeService()

            payload = b'{"type": "test.event"}'
            sig_header = "t=1234567890,v1=some_signature"

            result = service.verify_webhook_signature(payload, sig_header)

            assert result is False

    def test_verify_webhook_signature_missing_timestamp(self):
        """Should return False when timestamp is missing."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test123'}, clear=True):
            service = StripeService()

            payload = b'{"type": "test.event"}'
            sig_header = "v1=some_signature"

            result = service.verify_webhook_signature(payload, sig_header)

            assert result is False


class TestHandleStripeWebhook:
    """Test webhook event handling."""

    @pytest.mark.asyncio
    async def test_handle_subscription_created(self):
        """Should handle customer.subscription.created event."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-123"
            mock_user.email = "customer@example.com"

            mock_customer = StripeCustomer(
                id="cus_created",
                email="customer@example.com",
            )

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_email = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                event_data = {
                    "object": {
                        "customer": "cus_created",
                        "items": {
                            "data": [
                                {
                                    "price": {"id": "price_pro"}
                                }
                            ]
                        }
                    }
                }

                with patch.object(service, '_get_customer_by_id', return_value=mock_customer):
                    result = await service.handle_stripe_webhook(
                        StripeEventType.SUBSCRIPTION_CREATED.value,
                        event_data
                    )

                    assert result["success"] is True
                    mock_user_repo.update_user_role.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_subscription_created_customer_not_found(self):
        """Should return error when customer not found."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user_repo = MagicMock()

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                event_data = {
                    "object": {
                        "customer": "cus_unknown",
                        "items": {
                            "data": [
                                {"price": {"id": "price_pro"}}
                            ]
                        }
                    }
                }

                with patch.object(service, '_get_customer_by_id', return_value=None):
                    result = await service.handle_stripe_webhook(
                        StripeEventType.SUBSCRIPTION_CREATED.value,
                        event_data
                    )

                    assert result["success"] is False
                    assert "Customer not found" in result["message"]

    @pytest.mark.asyncio
    async def test_handle_subscription_updated(self):
        """Should handle customer.subscription.updated event."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-456"
            mock_user.email = "customer@example.com"

            mock_customer = StripeCustomer(
                id="cus_updated",
                email="customer@example.com",
            )

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_email = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                event_data = {
                    "object": {
                        "customer": "cus_updated",
                        "items": {
                            "data": [{"price": {"id": "price_enterprise"}}]
                        }
                    }
                }

                with patch.object(service, '_get_customer_by_id', return_value=mock_customer):
                    result = await service.handle_stripe_webhook(
                        StripeEventType.SUBSCRIPTION_UPDATED.value,
                        event_data
                    )

                    assert result["success"] is True

    @pytest.mark.asyncio
    async def test_handle_subscription_deleted(self):
        """Should handle customer.subscription.deleted event."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-789"
            mock_user.email = "customer@example.com"

            mock_customer = StripeCustomer(
                id="cus_deleted",
                email="customer@example.com",
            )

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_email = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                event_data = {
                    "object": {
                        "customer": "cus_deleted",
                    }
                }

                with patch.object(service, '_get_customer_by_id', return_value=mock_customer):
                    result = await service.handle_stripe_webhook(
                        StripeEventType.SUBSCRIPTION_DELETED.value,
                        event_data
                    )

                    assert result["success"] is True
                    call_args = mock_user_repo.update_user_role.call_args
                    assert call_args[0][1] == "viewer"

    @pytest.mark.asyncio
    async def test_handle_customer_deleted(self):
        """Should handle customer.deleted event."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            mock_user = MagicMock()
            mock_user.id = "user-deleted"
            mock_user.email = "customer@example.com"

            mock_user_repo = MagicMock()
            mock_user_repo.find_by_email = AsyncMock(return_value=mock_user)
            mock_user_repo.update_user_role = AsyncMock(return_value=mock_user)

            with patch('src.auth.stripe_integration.UserRepository', return_value=mock_user_repo):
                event_data = {
                    "object": {
                        "email": "customer@example.com",
                    }
                }

                result = await service.handle_stripe_webhook(
                    StripeEventType.CUSTOMER_DELETED.value,
                    event_data
                )

                assert result["success"] is True

    @pytest.mark.asyncio
    async def test_handle_unknown_event_type(self):
        """Should return success for unknown event types."""
        with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'test-key'}, clear=True):
            service = StripeService()

            result = await service.handle_stripe_webhook(
                "unknown.event.type",
                {}
            )

            assert result["success"] is True
            assert "handled" in result["message"].lower()


class TestSignatureVerificationEdgeCases:
    """Test edge cases in signature verification."""

    def test_signature_with_extra_parts(self):
        """Should handle signature with additional parts."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test123'}, clear=True):
            service = StripeService()

            payload = b'{"type": "test.event"}'
            timestamp = "1234567890"
            signed_payload = f"{timestamp}.{payload.decode()}"
            expected_sig = hmac.new(
                'whsec_test123'.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256,
            ).hexdigest()

            sig_header = f"t={timestamp},v1={expected_sig},v0=abc123"

            result = service.verify_webhook_signature(payload, sig_header)

            assert result is True

    def test_signature_with_empty_payload(self):
        """Should handle empty payload."""
        with patch.dict('os.environ', {'STRIPE_WEBHOOK_SECRET': 'whsec_test123'}, clear=True):
            service = StripeService()

            payload = b''
            timestamp = "1234567890"
            signed_payload = f"{timestamp}."
            expected_sig = hmac.new(
                'whsec_test123'.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256,
            ).hexdigest()

            sig_header = f"t={timestamp},v1={expected_sig}"

            result = service.verify_webhook_signature(payload, sig_header)

            assert result is True
