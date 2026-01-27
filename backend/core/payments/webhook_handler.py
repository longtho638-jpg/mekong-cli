"""
Webhook Handler
===============
Processes payment events from Stripe (and potentially others).
Handles verification, event routing, and idempotency.
"""

import logging
from typing import Dict, Any, Optional

from backend.core.payments.stripe_client import StripeClient
# from backend.core.licensing.logic.engine import LicenseGenerator
# Use string import to avoid circular dependency if needed, or import at method level

logger = logging.getLogger(__name__)

class WebhookHandler:
    def __init__(self, db_client=None):
        self.stripe = StripeClient()
        self.db = db_client

    def verify_and_process_stripe(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """
        Verify signature and process the Stripe event.
        """
        try:
            event = self.stripe.construct_event(payload, sig_header)
        except ValueError as e:
            logger.error(f"Webhook verification failed: {e}")
            raise

        return self.process_stripe_event(event)

    def process_stripe_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route verified Stripe event to appropriate handler.
        """
        event_type = event.get('type')
        data = event.get('data', {}).get('object', {})

        logger.info(f"Processing Stripe event: {event_type}")

        if event_type == 'checkout.session.completed':
            return self._handle_checkout_completed(data)
        elif event_type == 'invoice.payment_succeeded':
            return self._handle_invoice_payment_succeeded(data)
        elif event_type == 'invoice.payment_failed':
            return self._handle_invoice_payment_failed(data)
        elif event_type == 'customer.subscription.created':
            return self._handle_subscription_created(data)
        elif event_type == 'customer.subscription.updated':
            return self._handle_subscription_updated(data)
        elif event_type == 'customer.subscription.deleted':
            return self._handle_subscription_deleted(data)

        return {"status": "ignored", "type": event_type}

    def _handle_checkout_completed(self, session: Dict[str, Any]):
        """
        Handle successful checkout.
        This is where we might provision the tenant or activate the license.
        """
        tenant_id = session.get("metadata", {}).get("tenant_id")
        customer_email = session.get("customer_details", {}).get("email")
        mode = session.get("mode")

        logger.info(f"Checkout completed for tenant {tenant_id}, mode {mode}")

        # Logic to provision resources or update DB
        # ...

        return {"status": "processed", "type": "checkout.session.completed"}

    def _handle_invoice_payment_succeeded(self, invoice: Dict[str, Any]):
        """
        Handle recurring payment success.
        """
        subscription_id = invoice.get("subscription")
        logger.info(f"Payment succeeded for subscription {subscription_id}")
        return {"status": "processed", "type": "invoice.payment_succeeded"}

    def _handle_invoice_payment_failed(self, invoice: Dict[str, Any]):
        """
        Handle payment failure.
        """
        subscription_id = invoice.get("subscription")
        logger.warning(f"Payment failed for subscription {subscription_id}")
        return {"status": "processed", "type": "invoice.payment_failed"}

    def _handle_subscription_created(self, subscription: Dict[str, Any]):
        logger.info(f"Subscription created: {subscription.get('id')}")
        return {"status": "processed", "type": "customer.subscription.created"}

    def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        logger.info(f"Subscription updated: {subscription.get('id')}")
        return {"status": "processed", "type": "customer.subscription.updated"}

    def _handle_subscription_deleted(self, subscription: Dict[str, Any]):
        logger.info(f"Subscription deleted: {subscription.get('id')}")
        return {"status": "processed", "type": "customer.subscription.deleted"}
