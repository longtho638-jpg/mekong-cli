"""
Unified Payment Service
=======================
Abstracts payment providers (PayPal, Stripe) into a single interface.
Handles checkout creation, subscription management, and webhook verification.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from typing_extensions import TypedDict, Union

from backend.services.provisioning_service import ProvisioningResponse, ProvisioningService
from core.finance.gateways.gumroad import GumroadClient
from core.finance.gateways.stripe import StripeClient
from core.finance.paypal_sdk import PayPalSDK
from core.infrastructure.database import get_db
from core.licensing.logic.engine import LicenseGenerator

logger = logging.getLogger(__name__)


class CheckoutSessionResponse(TypedDict, total=False):
    """Response from creating a checkout session"""
    id: str
    url: str
    status: str
    error: str


class PaymentService:
    """
    Unified interface for payment operations.
    Supports: 'paypal', 'stripe', 'gumroad'
    """

    def __init__(self):
        self.paypal = PayPalSDK()
        self.stripe = StripeClient()
        self.gumroad = GumroadClient()
        self.provisioning = ProvisioningService()
        self.licensing = LicenseGenerator()
        self.db = get_db()

    def create_checkout_session(
        self,
        provider: str,
        amount: float,
        currency: str = "USD",
        price_id: Optional[str] = None, # Stripe Price ID or PayPal Plan ID
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        customer_email: Optional[str] = None,
        tenant_id: Optional[str] = None,
        mode: str = "subscription"
    ) -> CheckoutSessionResponse:
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
            if mode == "subscription":
                if not price_id:
                    raise ValueError("PayPal Plan ID (price_id) is required for subscriptions")

                return self.paypal.subscriptions.create(
                    plan_id=price_id,
                    custom_id=tenant_id or customer_email,
                    return_url=success_url,
                    cancel_url=cancel_url
                )

            # One-time payment (Order)
            if amount <= 0:
                raise ValueError("Amount must be positive")

            return self.paypal.orders.create(
                amount=amount,
                currency=currency,
                description=f"Payment for {tenant_id or customer_email or 'User'}",
                custom_id=tenant_id or customer_email,
                return_url=success_url,
                cancel_url=cancel_url
            )

        else:
            raise ValueError(f"Unsupported provider: {provider}")

    def verify_webhook(
        self,
        provider: str,
        headers: Dict[str, str],
        body: Union[bytes, str, Dict[str, Any]],
        webhook_secret: Optional[str] = None
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
            if not isinstance(body, dict):
                try:
                    if isinstance(body, bytes):
                        body = json.loads(body.decode())
                    elif isinstance(body, str):
                        body = json.loads(body)
                except Exception:
                    raise ValueError("Invalid PayPal webhook body")

            # Extract headers with case-insensitivity fallback
            transmission_id = headers.get("paypal-transmission-id") or headers.get("PAYPAL-TRANSMISSION-ID")
            transmission_time = headers.get("paypal-transmission-time") or headers.get("PAYPAL-TRANSMISSION-TIME")
            cert_url = headers.get("paypal-cert-url") or headers.get("PAYPAL-CERT-URL")
            auth_algo = headers.get("paypal-auth-algo") or headers.get("PAYPAL-AUTH-ALGO")
            transmission_sig = headers.get("paypal-transmission-sig") or headers.get("PAYPAL-TRANSMISSION-SIG")

            if not all([transmission_id, transmission_time, cert_url, auth_algo, transmission_sig]):
                raise ValueError("Missing required PayPal webhook headers")

            return self.paypal.webhooks.verify_signature(
                transmission_id=transmission_id,
                transmission_time=transmission_time,
                cert_url=cert_url,
                auth_algo=auth_algo,
                transmission_sig=transmission_sig,
                webhook_id=webhook_secret, # For PayPal, the "secret" is the Webhook ID
                webhook_event=body
            )

        elif provider == "gumroad":
            # body is already a dict in gumroad case usually
            return body if isinstance(body, dict) else {}

        raise ValueError(f"Unsupported provider: {provider}")

    def handle_webhook_event(self, provider: str, event: Dict[str, Any]) -> None:
        """
        Route verified event to ProvisioningService and Licensing.
        """
        logger.info(f"Processing {provider} event: {event.get('event_type') or event.get('type')}")

        if provider == "paypal":
            event_type = event.get("event_type")
            resource = event.get("resource", {})

            if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
                sub_id = resource.get("id")
                plan_id = resource.get("plan_id")
                tenant_id = resource.get("custom_id")
                email = resource.get("subscriber", {}).get("email_address")
                
                tier = self._map_paypal_plan_to_tier(plan_id)

                if tenant_id:
                    self.provisioning.activate_subscription(
                        tenant_id=tenant_id,
                        plan=tier,
                        provider="paypal",
                        subscription_id=sub_id
                    )
                    
                    self._generate_and_store_license(
                        email=email,
                        tier=tier,
                        tenant_id=tenant_id,
                        paypal_sub_id=sub_id
                    )

            elif event_type == "PAYMENT.CAPTURE.COMPLETED":
                # Handle one-time purchase
                capture_id = resource.get("id")
                amount = resource.get("amount", {}).get("value")
                currency = resource.get("amount", {}).get("currency_code")
                
                # Extract custom_id (tenant_id) and email
                custom_id = resource.get("custom_id")
                email = resource.get("payer", {}).get("email_address")
                
                logger.info(f"Payment capture completed: {capture_id} for {custom_id}")
                
                if amount and custom_id:
                    self.provisioning.record_payment(
                        tenant_id=custom_id,
                        amount=float(amount),
                        currency=currency or "USD",
                        provider="paypal",
                        transaction_id=capture_id
                    )
                    
                    if email:
                        self._generate_and_store_license(
                            email=email,
                            tier="pro", # Default tier for one-time purchases
                            tenant_id=custom_id
                        )

            elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
                sub_id = resource.get("id")
                self.provisioning.cancel_subscription(
                    provider_subscription_id=sub_id,
                    provider="paypal"
                )

            elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
                sub_id = resource.get("id")
                logger.warning(f"Subscription suspended: {sub_id}")
                # We might want to update status in DB to 'suspended' if supported
                # self.provisioning.update_status(sub_id, "suspended")

            elif event_type == "PAYMENT.CAPTURE.DENIED":
                capture_id = resource.get("id")
                logger.error(f"Payment denied: {capture_id}")

            elif event_type == "CHECKOUT.ORDER.APPROVED":
                order_id = resource.get("id")
                logger.info(f"Order approved by buyer: {order_id}")

        elif provider == "stripe":
            event_type = event.get("type")
            data = event.get("data", {}).get("object", {})

            if event_type == "checkout.session.completed":
                tenant_id = data.get("metadata", {}).get("tenantId")
                sub_id = data.get("subscription")
                customer_id = data.get("customer")
                email = data.get("customer_details", {}).get("email")

                if tenant_id and sub_id:
                     self.provisioning.activate_subscription(
                         tenant_id=tenant_id,
                         plan="PRO",
                         provider="stripe",
                         subscription_id=sub_id,
                         customer_id=customer_id
                     )
                     
                     self._generate_and_store_license(
                         email=email,
                         tier="pro",
                         tenant_id=tenant_id
                     )

            elif event_type == "customer.subscription.deleted":
                sub_id = data.get("id")
                self.provisioning.cancel_subscription(
                    provider_subscription_id=sub_id,
                    provider="stripe"
                )

    def _map_paypal_plan_to_tier(self, plan_id: str) -> str:
        """Map PayPal Plan IDs to internal tiers."""
        mapping = {
            "P-7DA230130F8006938NFYLZDA": "starter",
            "P-95T479827M227991CNFYLZDI": "pro",
            "P-0KK81193UG062012VNFYLZDI": "franchise",
            "P-92J98622GM186390LNFYLZDQ": "enterprise"
        }
        return mapping.get(plan_id, "pro")

    def _generate_and_store_license(
        self, 
        email: str, 
        tier: str, 
        tenant_id: str, 
        paypal_sub_id: str = None,
        format: str = "agencyos"
    ):
        """Generate a license key and store it in Supabase."""
        if not email or not self.db:
            return

        try:
            license_key = self.licensing.generate(
                format=format,
                tier=tier,
                email=email
            )
            
            license_data = {
                "license_key": license_key,
                "email": email,
                "plan": tier,
                "status": "active",
                "metadata": {"tenant_id": tenant_id}
            }
            
            if paypal_sub_id:
                license_data["metadata"]["paypal_subscription_id"] = paypal_sub_id

            # Use upsert to avoid duplicates if webhook retries
            self.db.table("licenses").upsert(license_data, on_conflict="license_key").execute()
            logger.info(f"Generated and stored license {license_key} for {email}")
            
        except Exception as e:
            logger.error(f"Failed to generate/store license: {e}")

    def capture_order(self, provider: str, order_id: str) -> Dict[str, Any]:
        """Capture a payment order."""
        logger.info(f"Capturing {provider} order: {order_id}")
        if provider == "paypal":
            return self.paypal.orders.capture(order_id)
        else:
            raise ValueError(f"Capture not supported for provider: {provider}")

    def get_order(self, provider: str, order_id: str) -> Dict[str, Any]:
        """Get order details."""
        logger.info(f"Retrieving {provider} order: {order_id}")
        if provider == "paypal":
            return self.paypal.orders.get(order_id)
        else:
            raise ValueError(f"Get order not supported for provider: {provider}")

    def cancel_subscription(self, provider: str, subscription_id: str, reason: str = None) -> Dict[str, Any]:
        """Cancel a subscription."""
        if provider == "paypal":
            return self.paypal.subscriptions.cancel(subscription_id, reason or "Canceled by user")
        elif provider == "stripe":
            # Delegate to StripeClient if implemented, or implement directly
            raise NotImplementedError("Stripe cancellation not yet implemented in unified service")
        else:
            raise ValueError(f"Provider {provider} not supported for cancellation")

    def refund_payment(self, provider: str, payment_id: str, amount: float = None) -> Dict[str, Any]:
        """Refund a payment."""
        if provider == "paypal":
            # payment_id is capture_id for PayPal
            return self.paypal.payments.refund_capture(payment_id, amount)
        elif provider == "stripe":
             raise NotImplementedError("Stripe refund not yet implemented in unified service")
        else:
            raise ValueError(f"Provider {provider} not supported for refund")

    def get_subscription(self, provider: str, subscription_id: str) -> Dict[str, Any]:
        """Get subscription details."""
        if provider == "paypal":
            return self.paypal.subscriptions.get(subscription_id)
        elif provider == "stripe":
             raise NotImplementedError("Stripe subscription retrieval not yet implemented in unified service")
        else:
             raise ValueError(f"Provider {provider} not supported for get_subscription")
