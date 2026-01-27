"""
Subscription Manager
====================
Handles subscription lifecycle logic: creation, updates, cancellation, status tracking.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime

from backend.core.payments.stripe_client import StripeClient
# Assuming we have a database connection or ORM.
# Using a placeholder for now as I can't see the full DB implementation details in context.
# But existing files use 'core.infrastructure.database.get_db'.

logger = logging.getLogger(__name__)

class SubscriptionManager:
    def __init__(self, db_client=None):
        self.stripe = StripeClient()
        self.db = db_client # Should be passed in or retrieved via get_db()

    def create_subscription_checkout(
        self,
        tenant_id: str,
        plan_id: str, # Internal plan ID or Stripe Price ID
        customer_email: str,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """
        Create a checkout session for a new subscription.
        """
        # Here we could map internal plan_id to Stripe Price ID if needed.
        # For now, assume plan_id IS the Stripe Price ID.

        return self.stripe.create_checkout_session(
            price_id=plan_id,
            tenant_id=tenant_id,
            customer_email=customer_email,
            success_url=success_url,
            cancel_url=cancel_url,
            mode="subscription"
        )

    def cancel_subscription(self, subscription_id: str, provider: str = "stripe") -> Dict[str, Any]:
        """
        Cancel a subscription immediately.
        """
        if provider == "stripe":
            result = self.stripe.cancel_subscription(subscription_id)
            # Database update should happen via webhook handling to ensure consistency,
            # but we can also do optimistic update here.
            return result
        else:
            raise ValueError(f"Provider {provider} not supported for cancellation")

    def get_subscription_status(self, subscription_id: str, provider: str = "stripe") -> Dict[str, Any]:
        """
        Get current status of a subscription.
        """
        if provider == "stripe":
            sub = self.stripe.get_subscription(subscription_id)
            return {
                "id": sub.get("id"),
                "status": sub.get("status"),
                "current_period_end": sub.get("current_period_end"),
                "cancel_at_period_end": sub.get("cancel_at_period_end"),
            }
        else:
            raise ValueError(f"Provider {provider} not supported")
