"""
Stripe Gateway Implementation
=============================
Python implementation of Stripe integration matching the TypeScript version.
"""

import logging
import os
from typing import Any, Dict, List, Optional

try:
    import stripe
except ImportError:
    stripe = None

logger = logging.getLogger(__name__)

class StripeClient:
    """
    Stripe API Client wrapper.
    """

    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        if stripe and self.api_key:
            stripe.api_key = self.api_key
            # Use specific API version if needed, matching TS: '2025-12-15.clover'
            # stripe.api_version = '2025-12-15'
        else:
            logger.warning("Stripe SDK not initialized. Missing STRIPE_SECRET_KEY or stripe package.")

    def is_configured(self) -> bool:
        return bool(stripe and self.api_key)

    def create_checkout_session(
        self,
        price_id: str,
        success_url: str,
        cancel_url: str,
        customer_email: str = None,
        customer_id: str = None,
        tenant_id: str = None,
        mode: str = "subscription"
    ) -> Dict[str, Any]:
        """Create a Stripe Checkout Session."""
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")

        params = {
            "mode": mode,
            "success_url": success_url,
            "cancel_url": cancel_url,
            "line_items": [{"price": price_id, "quantity": 1}],
            "allow_promotion_codes": True,
            "payment_method_types": ["card"],
            "metadata": {"tenantId": tenant_id} if tenant_id else {},
            "subscription_data": {"metadata": {"tenantId": tenant_id}} if mode == "subscription" and tenant_id else None
        }

        if customer_id:
            params["customer"] = customer_id
        elif customer_email:
            params["customer_email"] = customer_email

        try:
            session = stripe.checkout.Session.create(**params)
            return session
        except Exception as e:
            logger.error(f"Stripe Checkout Error: {e}")
            raise

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Retrieve subscription details."""
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        return stripe.Subscription.retrieve(subscription_id)

    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancel a subscription."""
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")
        return stripe.Subscription.delete(subscription_id)

    def construct_event(self, payload: bytes, sig_header: str, webhook_secret: str) -> Dict[str, Any]:
        """Verify and construct webhook event."""
        if not self.is_configured():
            raise RuntimeError("Stripe not configured")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError as e:
            # Invalid payload
            raise e
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            raise e
