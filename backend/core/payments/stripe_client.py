"""
Stripe Client Wrapper
=====================
Wrapper around the official Stripe Python SDK.
Handles configuration, session creation, and API interactions.
"""

import os
import logging
from typing import Optional, Dict, Any, List
import stripe

logger = logging.getLogger(__name__)

class StripeClient:
    """
    Wrapper for Stripe API interactions.
    """

    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.publishable_key = os.getenv("STRIPE_PUBLISHABLE_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        if self.api_key:
            stripe.api_key = self.api_key
        else:
            logger.warning("STRIPE_SECRET_KEY not set. Stripe integration will not work.")

    def is_configured(self) -> bool:
        """Check if Stripe is properly configured."""
        return bool(self.api_key and self.publishable_key)

    def create_checkout_session(
        self,
        price_id: Optional[str] = None,
        success_url: str = "",
        cancel_url: str = "",
        customer_email: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription",
        amount: Optional[float] = None,
        currency: str = "usd",
        line_items: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout Session.

        Args:
            price_id: The ID of the price object to checkout (for subscriptions or single products).
            success_url: Redirect URL after successful payment.
            cancel_url: Redirect URL after cancelled payment.
            customer_email: Pre-fill customer email.
            tenant_id: Internal tenant ID to attach as metadata.
            mode: 'subscription' or 'payment'.
            amount: Amount in dollars (if price_id is not provided, for 'payment' mode).
            currency: Currency code (if amount is provided).
            line_items: List of line items (overrides price_id/amount logic if provided).

        Returns:
            Dict containing session details (id, url).
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
            # Create ad-hoc price data
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

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=final_line_items,
                mode=mode,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                metadata=metadata,
                # subscription_data only valid for subscription mode
                subscription_data={'metadata': metadata} if mode == 'subscription' else None,
            )
            return {
                "id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error: {e}")
            raise RuntimeError(f"Stripe checkout creation failed: {str(e)}")

    def construct_event(self, payload: bytes, sig_header: str, webhook_secret: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify webhook signature and construct event.
        """
        secret = webhook_secret or self.webhook_secret
        if not secret:
            raise ValueError("Webhook secret not configured")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, secret
            )
            return event
        except ValueError as e:
            # Invalid payload
            raise ValueError(f"Invalid payload: {str(e)}")
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            raise ValueError(f"Invalid signature: {str(e)}")

    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancel a subscription."""
        try:
            return stripe.Subscription.delete(subscription_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription {subscription_id}: {e}")
            raise RuntimeError(f"Cancellation failed: {str(e)}")

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Retrieve subscription details."""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            raise RuntimeError(f"Retrieval failed: {str(e)}")

    def list_products(self, active_only: bool = True) -> List[Dict[str, Any]]:
        """List available products."""
        try:
            return stripe.Product.list(active=active_only).data
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list products: {e}")
            raise RuntimeError(f"List products failed: {str(e)}")
