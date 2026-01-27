"""
Subscription Manager
====================
Handles subscription lifecycle logic: creation, updates, cancellation, status tracking.
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from backend.core.payments.stripe_client import StripeClient

logger = logging.getLogger(__name__)

class SubscriptionManager:
    """
    Manages subscription business logic using StripeClient.
    """

    def __init__(self, db_client=None):
        self.stripe = StripeClient()
        self.db = db_client # Should be passed in or retrieved via get_db()

        # Internal Plan to Stripe Price ID mapping
        # In a real app, this might come from DB or config
        self.plan_mapping = {
            "solo": self.stripe.price_solo,
            "team": self.stripe.price_team,
            "enterprise": self.stripe.price_enterprise
        }

    def _get_stripe_price_id(self, plan_id: str) -> str:
        """Resolve internal plan ID to Stripe Price ID."""
        if plan_id.startswith("price_"):
            return plan_id

        price_id = self.plan_mapping.get(plan_id) or self.stripe.price_solo
        if not price_id:
             logger.warning(f"No Stripe price found for plan {plan_id}, falling back to passed ID if valid or error.")
             # If mapping fails and it doesn't look like a price ID, this might fail downstream
             return plan_id
        return price_id

    def create_subscription_checkout(
        self,
        tenant_id: str,
        plan_id: str,
        customer_email: str,
        success_url: str,
        cancel_url: str,
        trial_days: int = None
    ) -> Dict[str, Any]:
        """
        Create a checkout session for a new subscription.
        """
        price_id = self._get_stripe_price_id(plan_id)

        # Check if customer already exists for this tenant/email in our DB
        # For now, we rely on Stripe's duplicate handling or pass existing customer_id if we had it
        customer_id = None
        if self.db:
            # logic to look up customer_id by tenant_id
            pass

        return self.stripe.create_checkout_session(
            price_id=price_id,
            tenant_id=tenant_id,
            customer_email=customer_email,
            customer_id=customer_id,
            success_url=success_url,
            cancel_url=cancel_url,
            mode="subscription",
            trial_days=trial_days
        )

    def change_subscription_plan(self, subscription_id: str, new_plan_id: str) -> Dict[str, Any]:
        """
        Upgrade or downgrade a subscription.
        """
        new_price_id = self._get_stripe_price_id(new_plan_id)
        logger.info(f"Changing subscription {subscription_id} to plan {new_plan_id} ({new_price_id})")

        result = self.stripe.update_subscription(subscription_id, new_price_id)

        # Here we would update our local DB to reflect the pending change
        # self.db.table('subscriptions').update(...).eq('stripe_subscription_id', subscription_id).execute()

        return result

    def cancel_subscription(self, subscription_id: str, immediately: bool = False) -> Dict[str, Any]:
        """
        Cancel a subscription.
        """
        logger.info(f"Cancelling subscription {subscription_id}, immediately={immediately}")
        result = self.stripe.cancel_subscription(subscription_id, at_period_end=not immediately)
        return result

    def get_subscription_details(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get current status of a subscription from Stripe.
        """
        sub = self.stripe.get_subscription(subscription_id)
        return {
            "id": sub.get("id"),
            "status": sub.get("status"),
            "current_period_end": datetime.fromtimestamp(sub.get("current_period_end")),
            "cancel_at_period_end": sub.get("cancel_at_period_end"),
            "plan_amount": sub['plan']['amount'] / 100 if sub.get('plan') else 0,
            "currency": sub['plan']['currency'] if sub.get('plan') else 'usd',
            "customer": sub.get("customer")
        }

    def create_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        """Generate a link to the self-serve billing portal."""
        return self.stripe.create_portal_session(customer_id, return_url)
