"""
Stripe Integration - Customer sync and subscription-based role provisioning

Handles Stripe Customer → User mapping, subscription tier → role mapping,
and real-time webhook updates for role changes.
"""

import os
import json
import hashlib
import hmac
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

import stripe
from src.auth.user_repository import UserRepository
from src.auth.rbac import Role
from src.auth.config import AuthConfig

logger = logging.getLogger(__name__)


class StripeEventType(str, Enum):
    """Stripe webhook event types."""

    SUBSCRIPTION_CREATED = "customer.subscription.created"
    SUBSCRIPTION_UPDATED = "customer.subscription.updated"
    SUBSCRIPTION_DELETED = "customer.subscription.deleted"
    CUSTOMER_DELETED = "customer.deleted"


@dataclass
class StripeCustomer:
    """Stripe customer data."""

    id: str
    email: str
    name: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_tier: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> "StripeCustomer":
        """Create StripeCustomer from Stripe API response."""
        subscription = data.get("subscriptions", {}).get("data", [{}])[0] if data.get("subscriptions") else {}
        return cls(
            id=data.get("id", ""),
            email=data.get("email", ""),
            name=data.get("name"),
            subscription_status=subscription.get("status"),
            subscription_tier=subscription.get("items", {}).get("data", [{}])[0].get("price", {}).get("id"),
        )


# Role mapping from Stripe Price ID to application role
# Configure via STRIPE_PRICE_IDS env var (JSON) or use defaults
DEFAULT_TIER_TO_ROLE = {
    "price_enterprise": Role.OWNER,
    "price_pro": Role.ADMIN,
    "price_trial": Role.MEMBER,
    "price_free": Role.VIEWER,
}


def get_tier_to_role_mapping() -> Dict[str, Role]:
    """Get tier-to-role mapping from environment or defaults."""
    price_ids_json = os.getenv("STRIPE_PRICE_IDS", "{}")
    try:
        custom_mapping = json.loads(price_ids_json)
        # Convert string values to Role enums
        return {
            price_id: Role(role_str)
            for price_id, role_str in custom_mapping.items()
        }
    except (json.JSONDecodeError, ValueError) as e:
        # Fall back to defaults on parse error
        logger.warning("Could not parse STRIPE_PRICE_IDS, using defaults: %s", e)
        return DEFAULT_TIER_TO_ROLE


class StripeService:
    """Service for Stripe integration and customer sync."""

    def __init__(self):
        """Initialize Stripe client with secret key."""
        self.api_key = AuthConfig.STRIPE_SECRET_KEY
        self.webhook_secret = AuthConfig.STRIPE_WEBHOOK_SECRET
        self.tier_to_role = get_tier_to_role_mapping()

        if self.api_key:
            stripe.api_key = self.api_key
            stripe.set_app_info(
                "mekong-cli",
                version="0.2.0",
                url="https://github.com/mekong-cli",
            )

    def _get_stripe_client(self):
        """Get configured Stripe client."""
        if not self.api_key:
            raise RuntimeError("STRIPE_SECRET_KEY not configured")
        return stripe

    async def get_customer_by_email(self, email: str) -> Optional[StripeCustomer]:
        """
        Fetch Stripe Customer by email address.

        Args:
            email: Customer email address

        Returns:
            StripeCustomer object or None if not found
        """
        try:
            client = self._get_stripe_client()
            customers = await client.Customer.list(email=email, limit=1)

            if not customers.data:
                return None

            customer_data = customers.data[0]
            return StripeCustomer.from_dict(customer_data)
        except stripe.StripeError as e:
            print(f"Stripe API error: {e}")
            return None
        except Exception as e:
            print(f"Error fetching customer: {e}")
            return None

    async def get_subscription_status(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """
        Get active subscription details for a customer.

        Args:
            customer_id: Stripe Customer ID

        Returns:
            Dict with subscription status, tier, and current_period_end
            or None if no active subscription
        """
        try:
            client = self._get_stripe_client()
            subscriptions = await client.Subscription.list(
                customer=customer_id,
                status="active",
                limit=1,
            )

            if not subscriptions.data:
                return None

            sub = subscriptions.data[0]
            price_id = sub.items.data[0].price.id if sub.items.data else None

            return {
                "id": sub.id,
                "status": sub.status,
                "price_id": price_id,
                "current_period_end": sub.current_period_end,
                "cancel_at_period_end": sub.cancel_at_period_end,
            }
        except stripe.StripeError as e:
            print(f"Stripe API error: {e}")
            return None
        except Exception as e:
            print(f"Error fetching subscription: {e}")
            return None

    def map_tier_to_role(self, stripe_price_id: str) -> Optional[Role]:
        """
        Map Stripe Price ID to application role.

        Args:
            stripe_price_id: Stripe Price ID from subscription

        Returns:
            Role enum value or None if tier not mapped
        """
        role = self.tier_to_role.get(stripe_price_id)
        if not role:
            # Try matching by pattern (e.g., "price_123_pro" → "price_pro")
            for price_pattern, mapped_role in self.tier_to_role.items():
                if price_pattern in stripe_price_id:
                    return mapped_role
        return role

    async def sync_user_role(self, user_id: str, customer_email: Optional[str] = None) -> bool:
        """
        Sync user role from Stripe subscription status.

        Args:
            user_id: User UUID
            customer_email: Optional email to lookup customer (uses user email if not provided)

        Returns:
            True if role was updated, False if no changes or errors
        """
        try:
            user_repo = UserRepository()
            user = await user_repo.find_by_id(user_id)

            if not user:
                print(f"User {user_id} not found")
                return False

            # Get customer email
            email = customer_email or user.email

            # Fetch Stripe customer
            customer = await self.get_customer_by_email(email)
            if not customer:
                print(f"No Stripe customer found for {email}")
                return False

            # Get subscription status
            sub_info = await self.get_subscription_status(customer.id)
            if not sub_info:
                # No active subscription - downgrade to viewer
                new_role = Role.VIEWER
            else:
                # Map tier to role
                new_role = self.map_tier_to_role(sub_info["price_id"])
                if not new_role:
                    new_role = Role.MEMBER  # Default fallback

            # Update user role in database
            await user_repo.update_user_role(user.id, new_role.value)
            print(f"Updated user {user_id} role to {new_role.value}")
            return True

        except Exception as e:
            print(f"Error syncing user role: {e}")
            return False

    def verify_webhook_signature(
        self,
        payload: bytes,
        sig_header: str,
    ) -> bool:
        """
        Verify Stripe webhook signature.

        Args:
            payload: Raw request body bytes
            sig_header: Stripe-Signature header value

        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            print("Warning: STRIPE_WEBHOOK_SECRET not configured")
            return False

        try:
            # Extract timestamp and signatures from header
            # Format: t=1234567890,v1=abc123,v0=xyz789
            header_parts = sig_header.split(",")
            timestamp = None
            signature = None

            for part in header_parts:
                if part.startswith("t="):
                    timestamp = part[2:]
                elif part.startswith("v1="):
                    signature = part[3:]

            if not timestamp or not signature:
                return False

            # Create signed payload
            signed_payload = f"{timestamp}.{payload.decode('utf-8')}"

            # Compute expected signature
            expected_sig = hmac.new(
                self.webhook_secret.encode('utf-8'),
                signed_payload.encode('utf-8'),
                hashlib.sha256,
            ).hexdigest()

            # Compare signatures
            return hmac.compare_digest(signature, expected_sig)

        except Exception as e:
            print(f"Error verifying webhook signature: {e}")
            return False

    async def handle_stripe_webhook(
        self,
        event_type: str,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Process Stripe webhook event and update user roles.

        Args:
            event_type: Stripe event type (e.g., "customer.subscription.created")
            data: Event data object from webhook

        Returns:
            Dict with processing result: {"success": bool, "message": str}
        """
        try:
            user_repo = UserRepository()

            if event_type == StripeEventType.SUBSCRIPTION_CREATED.value:
                # New subscription - provision role
                subscription = data.get("object", {})
                customer_id = subscription.get("customer")
                price_id = subscription.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")

                # Get customer email
                customer = await self._get_customer_by_id(customer_id)
                if not customer:
                    return {"success": False, "message": "Customer not found"}

                # Find user by email
                user = await user_repo.find_by_email(customer.email)
                if not user:
                    return {"success": False, "message": f"User not found: {customer.email}"}

                # Map tier to role and update
                role = self.map_tier_to_role(price_id) if price_id else Role.MEMBER
                await user_repo.update_user_role(user.id, role.value)

                return {
                    "success": True,
                    "message": f"Provisioned role {role.value} for user {user.email}",
                }

            elif event_type == StripeEventType.SUBSCRIPTION_UPDATED.value:
                # Subscription updated - update role
                subscription = data.get("object", {})
                customer_id = subscription.get("customer")
                price_id = subscription.get("items", {}).get("data", [{}])[0].get("price", {}).get("id")

                customer = await self._get_customer_by_id(customer_id)
                if not customer:
                    return {"success": False, "message": "Customer not found"}

                user = await user_repo.find_by_email(customer.email)
                if not user:
                    return {"success": False, "message": f"User not found: {customer.email}"}

                role = self.map_tier_to_role(price_id) if price_id else Role.MEMBER
                await user_repo.update_user_role(user.id, role.value)

                return {
                    "success": True,
                    "message": f"Updated role to {role.value} for user {user.email}",
                }

            elif event_type == StripeEventType.SUBSCRIPTION_DELETED.value:
                # Subscription cancelled - downgrade role
                subscription = data.get("object", {})
                customer_id = subscription.get("customer")

                customer = await self._get_customer_by_id(customer_id)
                if not customer:
                    return {"success": False, "message": "Customer not found"}

                user = await user_repo.find_by_email(customer.email)
                if not user:
                    return {"success": False, "message": f"User not found: {customer.email}"}

                # Downgrade to viewer
                await user_repo.update_user_role(user.id, Role.VIEWER.value)

                return {
                    "success": True,
                    "message": f"Downgraded role to viewer for user {user.email}",
                }

            elif event_type == StripeEventType.CUSTOMER_DELETED.value:
                # Customer deleted - revoke access
                customer = data.get("object", {})
                customer_email = customer.get("email")

                if not customer_email:
                    return {"success": False, "message": "Customer email not found"}

                user = await user_repo.find_by_email(customer_email)
                if not user:
                    return {"success": True, "message": "User not found, nothing to revoke"}

                # Revoke access (set to viewer with inactive status)
                await user_repo.update_user_role(user.id, Role.VIEWER.value)

                return {
                    "success": True,
                    "message": f"Revoked access for user {customer_email}",
                }

            else:
                return {
                    "success": True,
                    "message": f"Event type {event_type} handled (no action required)",
                }

        except Exception as e:
            print(f"Error handling webhook: {e}")
            return {"success": False, "message": f"Error processing webhook: {e}"}

    async def _get_customer_by_id(self, customer_id: str) -> Optional[StripeCustomer]:
        """Fetch Stripe customer by ID."""
        try:
            client = self._get_stripe_client()
            customer = await client.Customer.retrieve(customer_id)
            return StripeCustomer.from_dict(customer)
        except stripe.StripeError as e:
            print(f"Stripe API error: {e}")
            return None
        except Exception as e:
            print(f"Error fetching customer: {e}")
            return None


# Convenience functions for simple usage

async def sync_user_from_stripe(user_id: str) -> bool:
    """Sync user role from Stripe subscription."""
    service = StripeService()
    return await service.sync_user_role(user_id)


async def get_stripe_customer(email: str) -> Optional[StripeCustomer]:
    """Get Stripe customer by email."""
    service = StripeService()
    return await service.get_customer_by_email(email)


def verify_stripe_webhook(payload: bytes, sig_header: str) -> bool:
    """Verify Stripe webhook signature."""
    service = StripeService()
    return service.verify_webhook_signature(payload, sig_header)


async def process_stripe_webhook(event_type: str, data: dict) -> dict:
    """Process Stripe webhook event."""
    service = StripeService()
    return await service.handle_stripe_webhook(event_type, data)
