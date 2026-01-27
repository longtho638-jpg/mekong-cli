"""
Stripe Client Wrapper
=====================
Wrapper around the official Stripe Python SDK for production use.
Handles configuration, session creation, customer management, and API interactions.
"""

import os
import logging
from typing import Optional, Dict, Any, List, Union
import stripe

logger = logging.getLogger(__name__)

class StripeClient:
    """
    Production-ready Wrapper for Stripe API interactions.
    """

    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.publishable_key = os.getenv("STRIPE_PUBLISHABLE_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        # Prices configuration
        self.price_solo = os.getenv("STRIPE_PRICE_SOLO")
        self.price_team = os.getenv("STRIPE_PRICE_TEAM")
        self.price_enterprise = os.getenv("STRIPE_PRICE_ENTERPRISE")

        if self.api_key:
            stripe.api_key = self.api_key
            # Set API version to ensure stability
            stripe.api_version = "2023-10-16"
        else:
            logger.warning("STRIPE_SECRET_KEY not set. Stripe integration will not work.")

    def is_configured(self) -> bool:
        """Check if Stripe is properly configured."""
        return bool(self.api_key and self.publishable_key)

    def create_customer(self, email: str, name: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new Stripe customer."""
        try:
            return stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create customer: {e}")
            raise RuntimeError(f"Customer creation failed: {str(e)}")

    def get_customer_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find a customer by email."""
        try:
            customers = stripe.Customer.list(email=email, limit=1)
            if customers and len(customers.data) > 0:
                return customers.data[0]
            return None
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get customer: {e}")
            raise RuntimeError(f"Customer retrieval failed: {str(e)}")

    def create_checkout_session(
        self,
        price_id: Optional[str] = None,
        success_url: str = "",
        cancel_url: str = "",
        customer_email: Optional[str] = None,
        customer_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription",
        amount: Optional[float] = None,
        currency: str = "usd",
        line_items: Optional[List[Dict[str, Any]]] = None,
        trial_days: Optional[int] = None,
        allow_promotion_codes: bool = True
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout Session.
        """
        if not self.is_configured():
            raise ValueError("Stripe is not configured")

        # Build line items
        final_line_items = []
        if line_items:
            final_line_items = line_items
        elif price_id:
            final_line_items = [{
                'price': price_id,
                'quantity': 1,
            }]
        elif amount:
            final_line_items = [{
                'price_data': {
                    'currency': currency,
                    'product_data': {
                        'name': 'One-time Payment',
                    },
                    'unit_amount': int(amount * 100), # Convert to cents
                },
                'quantity': 1,
            }]
        else:
            raise ValueError("Either price_id, amount, or line_items must be provided")

        metadata = {}
        if tenant_id:
            metadata['tenant_id'] = tenant_id

        session_params = {
            "payment_method_types": ['card'],
            "line_items": final_line_items,
            "mode": mode,
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": metadata,
            "allow_promotion_codes": allow_promotion_codes,
        }

        if customer_id:
            session_params["customer"] = customer_id
        elif customer_email:
            session_params["customer_email"] = customer_email

        if mode == 'subscription':
            subscription_data = {'metadata': metadata}
            if trial_days:
                subscription_data['trial_period_days'] = trial_days
            session_params['subscription_data'] = subscription_data

        try:
            session = stripe.checkout.Session.create(**session_params)
            return {
                "id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error: {e}")
            raise RuntimeError(f"Stripe checkout creation failed: {str(e)}")

    def create_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        """Create a billing portal session for the customer."""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return {"url": session.url}
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create portal session: {e}")
            raise RuntimeError(f"Portal session creation failed: {str(e)}")

    def construct_event(self, payload: bytes, sig_header: str, webhook_secret: Optional[str] = None) -> Dict[str, Any]:
        """Verify webhook signature and construct event."""
        secret = webhook_secret or self.webhook_secret
        if not secret:
            raise ValueError("Webhook secret not configured")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, secret
            )
            return event
        except ValueError as e:
            raise ValueError(f"Invalid payload: {str(e)}")
        except stripe.error.SignatureVerificationError as e:
            raise ValueError(f"Invalid signature: {str(e)}")

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Retrieve subscription details."""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            raise RuntimeError(f"Retrieval failed: {str(e)}")

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = False) -> Dict[str, Any]:
        """Cancel a subscription."""
        try:
            if at_period_end:
                return stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                return stripe.Subscription.delete(subscription_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription {subscription_id}: {e}")
            raise RuntimeError(f"Cancellation failed: {str(e)}")

    def update_subscription(self, subscription_id: str, new_price_id: str) -> Dict[str, Any]:
        """Upgrade or downgrade subscription to a new price."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            item_id = subscription['items']['data'][0].id

            return stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': item_id,
                    'price': new_price_id,
                }],
                proration_behavior='create_prorations',
            )
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription {subscription_id}: {e}")
            raise RuntimeError(f"Update failed: {str(e)}")

    def list_invoices(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """List invoices for a customer."""
        try:
            return stripe.Invoice.list(customer=customer_id, limit=limit).data
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list invoices: {e}")
            raise RuntimeError(f"List invoices failed: {str(e)}")

    def retrieve_payment_method(self, payment_method_id: str) -> Dict[str, Any]:
        """Retrieve a payment method."""
        try:
            return stripe.PaymentMethod.retrieve(payment_method_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve payment method: {e}")
            raise RuntimeError(f"Retrieve payment method failed: {str(e)}")

    def list_payment_methods(self, customer_id: str, type: str = 'card') -> List[Dict[str, Any]]:
        """List payment methods for a customer."""
        try:
            return stripe.PaymentMethod.list(
                customer=customer_id,
                type=type,
            ).data
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list payment methods: {e}")
            raise RuntimeError(f"List payment methods failed: {str(e)}")
