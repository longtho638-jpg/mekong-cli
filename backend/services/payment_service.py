"""
Unified Payment Service
=======================
Abstracts payment providers (PayPal, Stripe) into a single interface.
Handles checkout creation, subscription management, and webhook verification.
"""

import logging
from typing import Dict, Any, Optional, Union

from core.finance.paypal_sdk import PayPalSDK
from core.finance.gateways.stripe import StripeClient
from backend.services.provisioning_service import ProvisioningService

logger = logging.getLogger(__name__)

class PaymentService:
    """
    Unified interface for payment operations.
    Supports: 'paypal', 'stripe'
    """

    def __init__(self):
        self.paypal = PayPalSDK()
        self.stripe = StripeClient()
        self.provisioning = ProvisioningService()

    def create_checkout_session(
        self,
        provider: str,
        amount: float,
        currency: str = "USD",
        price_id: str = None, # Stripe Price ID or PayPal Plan ID
        success_url: str = None,
        cancel_url: str = None,
        customer_email: str = None,
        tenant_id: str = None,
        mode: str = "subscription"
    ) -> Dict[str, Any]:
        """
        Initiate a checkout session.
        """
        logger.info(f"Creating {provider} checkout for tenant {tenant_id}")

        if provider == "stripe":
            if not self.stripe.is_configured():
                raise ValueError("Stripe is not configured")

            return self.stripe.create_checkout_session(
                price_id=price_id,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                tenant_id=tenant_id,
                mode=mode
            )

        elif provider == "paypal":
            # For PayPal, we typically create an Order
            # Note: PayPal 'subscription' flow is often client-side JS initiated for Smart Buttons,
            # but we can create an order for one-time or setup token for subscriptions.
            # Here we wrap the Order creation for simplicity in this unification.

            # If it's a subscription, we might return the Plan ID for the frontend to use
            if mode == "subscription":
                return {
                    "provider": "paypal",
                    "flow": "subscription",
                    "plan_id": price_id,
                    "mode": mode
                }

            # One-time payment
            return self.paypal.orders.create(
                amount=amount,
                currency=currency,
                description=f"Payment for tenant {tenant_id}"
            )

        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def verify_webhook(
        self,
        provider: str,
        headers: Dict[str, str],
        body: Union[bytes, str, Dict],
        webhook_secret: str = None
    ) -> Dict[str, Any]:
        """
        Verify webhook authenticity.
        """
        if provider == "stripe":
            return self.stripe.construct_event(
                payload=body,
                sig_header=headers.get("stripe-signature"),
                webhook_secret=webhook_secret
            )

        elif provider == "paypal":
            # PayPal verification requires a specific set of headers and the full body dict
            # We assume 'body' passed here is the parsed JSON dict for PayPal SDK verify_signature
            # OR raw bytes if we parse it inside. The SDK currently takes dict.

            # Ensure we have the headers
            if not isinstance(body, dict):
                # If body is bytes/str, we should ideally verify against that,
                # but the current Python SDK implementation takes a dict event.
                # This is a known divergence in Python SDKs.
                import json
                try:
                    if isinstance(body, bytes):
                        body = json.loads(body.decode())
                    elif isinstance(body, str):
                        body = json.loads(body)
                except:
                    raise ValueError("Invalid PayPal webhook body")

            return self.paypal.webhooks.verify_signature(
                transmission_id=headers.get("paypal-transmission-id") or headers.get("PAYPAL-TRANSMISSION-ID"),
                transmission_time=headers.get("paypal-transmission-time") or headers.get("PAYPAL-TRANSMISSION-TIME"),
                cert_url=headers.get("paypal-cert-url") or headers.get("PAYPAL-CERT-URL"),
                auth_algo=headers.get("paypal-auth-algo") or headers.get("PAYPAL-AUTH-ALGO"),
                transmission_sig=headers.get("paypal-transmission-sig") or headers.get("PAYPAL-TRANSMISSION-SIG"),
                webhook_id=webhook_secret, # For PayPal, the "secret" is the Webhook ID
                webhook_event=body
            )

        raise ValueError(f"Unsupported provider: {provider}")

    def handle_webhook_event(self, provider: str, event: Dict[str, Any]):
        """
        Route verified event to ProvisioningService.
        """
        logger.info(f"Processing {provider} event: {event.get('type') or event.get('event_type')}")

        if provider == "paypal":
            event_type = event.get("event_type")
            resource = event.get("resource", {})

            if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
                sub_id = resource.get("id")
                plan_id = resource.get("plan_id")
                # Need to map PayPal Plan ID to internal plan name (e.g., PRO, ENTERPRISE)
                # This mapping should ideally be in config/DB.
                plan_name = "PRO" # Defaulting for now

                # We need to find the tenant_id. Usually stored in 'custom_id' or we search by sub_id
                # If custom_id is not set, we might need to rely on the email match or previous context
                tenant_id = resource.get("custom_id")

                if tenant_id:
                    self.provisioning.activate_subscription(
                        tenant_id=tenant_id,
                        plan=plan_name,
                        provider="paypal",
                        subscription_id=sub_id
                    )

            elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
                sub_id = resource.get("id")
                self.provisioning.cancel_subscription(
                    provider_subscription_id=sub_id,
                    provider="paypal"
                )

        elif provider == "stripe":
            event_type = event.get("type")
            data = event.get("data", {}).get("object", {})

            if event_type == "checkout.session.completed":
                # Initial subscription setup
                tenant_id = data.get("metadata", {}).get("tenantId")
                sub_id = data.get("subscription")
                customer_id = data.get("customer")

                if tenant_id and sub_id:
                     # Retrieve sub details to get the plan
                     sub = self.stripe.get_subscription(sub_id)
                     # Map price ID to plan
                     # For now, we activate as PRO if successful
                     self.provisioning.activate_subscription(
                         tenant_id=tenant_id,
                         plan="PRO",
                         provider="stripe",
                         subscription_id=sub_id,
                         customer_id=customer_id
                     )

            elif event_type == "customer.subscription.deleted":
                sub_id = data.get("id")
                self.provisioning.cancel_subscription(
                    provider_subscription_id=sub_id,
                    provider="stripe"
                )

    def capture_order(self, provider: str, order_id: str) -> Dict[str, Any]:
        """
        Capture a payment order (PayPal).
        """
        if provider == "paypal":
            return self.paypal.orders.capture(order_id)
        else:
            raise ValueError(f"Capture not supported for provider: {provider}")

    def get_order(self, provider: str, order_id: str) -> Dict[str, Any]:
        """
        Get order details.
        """
        if provider == "paypal":
            return self.paypal.orders.get(order_id)
        else:
            raise ValueError(f"Get order not supported for provider: {provider}")
