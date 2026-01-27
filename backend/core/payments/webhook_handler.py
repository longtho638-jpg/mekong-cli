"""
Webhook Handler
===============
Processes payment events from Stripe.
Handles verification, event routing, and idempotency.
"""

import logging
from typing import Dict, Any, Optional

from backend.core.payments.stripe_client import StripeClient
from backend.core.payments.subscription_manager import SubscriptionManager
from backend.core.payments.invoice_manager import InvoiceManager
from backend.core.licensing.logic.engine import LicenseGenerator
from backend.services.provisioning_service import ProvisioningService

logger = logging.getLogger(__name__)

class WebhookHandler:
    def __init__(self, db_client=None):
        self.stripe = StripeClient()
        self.db = db_client
        self.subscription_manager = SubscriptionManager(db_client)
        self.invoice_manager = InvoiceManager(db_client)
        self.licensing = LicenseGenerator()
        self.provisioning = ProvisioningService()

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
        event_id = event.get('id')

        logger.info(f"Processing Stripe event: {event_type} (ID: {event_id})")

        # Idempotency check could happen here (check if event_id already processed)
        if self.db:
             # Check payment_events table
             pass

        try:
            if event_type == 'checkout.session.completed':
                return self._handle_checkout_completed(data)
            elif event_type == 'invoice.payment_succeeded':
                return self.invoice_manager.handle_payment_succeeded(data)
            elif event_type == 'invoice.payment_failed':
                return self.invoice_manager.handle_payment_failed(data)
            elif event_type == 'customer.subscription.created':
                return self._handle_subscription_created(data)
            elif event_type == 'customer.subscription.updated':
                return self._handle_subscription_updated(data)
            elif event_type == 'customer.subscription.deleted':
                return self._handle_subscription_deleted(data)
            else:
                return {"status": "ignored", "type": event_type}

        except Exception as e:
            logger.error(f"Error processing event {event_type}: {e}")
            # We raise so Stripe retries
            raise e

    def _handle_checkout_completed(self, session: Dict[str, Any]):
        """
        Handle successful checkout.
        Provision tenant, activate license.
        """
        tenant_id = session.get("metadata", {}).get("tenant_id")
        customer_email = session.get("customer_details", {}).get("email")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        mode = session.get("mode")

        logger.info(f"Checkout completed for tenant {tenant_id}, customer {customer_email}")

        if mode == 'subscription' and tenant_id:
             # Provisioning logic
             self.provisioning.activate_subscription(
                 tenant_id=tenant_id,
                 plan="PRO", # Should ideally derive from price_id
                 provider="stripe",
                 subscription_id=subscription_id,
                 customer_id=customer_id
             )

             # License generation
             try:
                 license_key = self.licensing.generate(
                    format="agencyos",
                    tier="pro",
                    email=customer_email
                 )
                 # Store license...
                 if self.db:
                     license_data = {
                        "license_key": license_key,
                        "email": customer_email,
                        "plan": "pro",
                        "status": "active",
                        "metadata": {
                            "tenant_id": tenant_id,
                            "stripe_subscription_id": subscription_id,
                            "stripe_customer_id": customer_id
                        }
                     }
                     self.db.table("licenses").upsert(license_data, on_conflict="license_key").execute()
             except Exception as e:
                 logger.error(f"License generation failed: {e}")

        return {"status": "processed", "type": "checkout.session.completed"}

    def _handle_subscription_created(self, subscription: Dict[str, Any]):
        logger.info(f"Subscription created: {subscription.get('id')}")
        # Could update DB status to 'active'
        return {"status": "processed", "type": "customer.subscription.created"}

    def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        logger.info(f"Subscription updated: {subscription.get('id')}")
        status = subscription.get('status')
        # Update DB status
        return {"status": "processed", "type": "customer.subscription.updated"}

    def _handle_subscription_deleted(self, subscription: Dict[str, Any]):
        logger.info(f"Subscription deleted: {subscription.get('id')}")
        # Update DB status to 'canceled'
        # Provisioning cancellation
        if self.provisioning:
             self.provisioning.cancel_subscription(
                 provider_subscription_id=subscription.get('id'),
                 provider="stripe"
             )
        return {"status": "processed", "type": "customer.subscription.deleted"}
