"""
Stripe Payment Service
=======================
High-level service for Stripe payment integration with AgencyOS.
Handles checkout sessions, webhook events, subscription management, and license tier mapping.
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from core.finance.gateways.stripe import StripeClient
from core.infrastructure.database import get_db
from core.licensing.logic.engine import LicenseGenerator

logger = logging.getLogger(__name__)


class StripeService:
    """
    Business logic layer for Stripe payment operations.

    Features:
    - Create checkout sessions for subscriptions
    - Handle webhook events (payment.succeeded, subscription.updated, etc.)
    - Map Stripe product/price IDs to license tiers
    - Cancel subscriptions
    - Get subscription status
    """

    # Stripe Price ID to License Tier Mapping
    PRICE_TO_TIER_MAP = {
        "price_starter_monthly": "starter",
        "price_starter_yearly": "starter",
        "price_pro_monthly": "pro",
        "price_pro_yearly": "pro",
        "price_franchise_monthly": "franchise",
        "price_franchise_yearly": "franchise",
        "price_enterprise_monthly": "enterprise",
        "price_enterprise_yearly": "enterprise",
    }

    # Reverse mapping: Tier to default monthly price ID
    TIER_TO_PRICE_MAP = {
        "starter": "price_starter_monthly",
        "pro": "price_pro_monthly",
        "franchise": "price_franchise_monthly",
        "enterprise": "price_enterprise_monthly",
    }

    def __init__(self):
        """Initialize Stripe service with client and dependencies."""
        self.client = StripeClient()
        self.licensing = LicenseGenerator()
        self.db = get_db()

    def is_configured(self) -> bool:
        """Check if Stripe is properly configured."""
        return self.client.is_configured()

    def create_checkout_session(
        self,
        tier: str,
        customer_email: str,
        tenant_id: str,
        success_url: str,
        cancel_url: str,
        price_id: Optional[str] = None,
        mode: str = "subscription"
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout Session for subscription purchase.

        Args:
            tier: License tier (starter, pro, franchise, enterprise)
            customer_email: Customer email address
            tenant_id: Internal tenant/organization identifier
            success_url: Redirect URL on successful payment
            cancel_url: Redirect URL on cancellation
            price_id: Optional Stripe Price ID (defaults to tier's monthly price)
            mode: Checkout mode ('subscription' or 'payment')

        Returns:
            Dict containing session id and url

        Raises:
            ValueError: If tier is invalid or Stripe not configured
            RuntimeError: If Stripe API call fails
        """
        if not self.is_configured():
            raise ValueError("Stripe is not configured. Check STRIPE_SECRET_KEY.")

        # Auto-map tier to price_id if not provided
        if not price_id:
            price_id = self.TIER_TO_PRICE_MAP.get(tier.lower())
            if not price_id:
                raise ValueError(f"Invalid tier: {tier}. Must be one of {list(self.TIER_TO_PRICE_MAP.keys())}")

        logger.info(f"Creating Stripe checkout for tier={tier}, tenant={tenant_id}, price={price_id}")

        try:
            session = self.client.create_checkout_session(
                price_id=price_id,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                tenant_id=tenant_id,
                mode=mode
            )

            return {
                "id": session["id"],
                "url": session["url"],
                "status": "created"
            }

        except Exception as e:
            logger.error(f"Failed to create Stripe checkout session: {e}")
            raise RuntimeError(f"Stripe checkout creation failed: {str(e)}")

    def handle_webhook_event(self, event: Dict[str, Any]) -> Dict[str, str]:
        """
        Process verified Stripe webhook events.

        Supported Events:
        - checkout.session.completed: Successful payment
        - customer.subscription.created: New subscription
        - customer.subscription.updated: Subscription modified
        - customer.subscription.deleted: Subscription cancelled
        - invoice.payment_succeeded: Recurring payment successful
        - invoice.payment_failed: Payment failed

        Args:
            event: Verified Stripe event object

        Returns:
            Dict with status and message
        """
        event_type = event.get("type")
        data = event.get("data", {}).get("object", {})

        logger.info(f"Processing Stripe webhook: {event_type}")

        try:
            if event_type == "checkout.session.completed":
                return self._handle_checkout_completed(data)

            elif event_type == "customer.subscription.created":
                return self._handle_subscription_created(data)

            elif event_type == "customer.subscription.updated":
                return self._handle_subscription_updated(data)

            elif event_type == "customer.subscription.deleted":
                return self._handle_subscription_deleted(data)

            elif event_type == "invoice.payment_succeeded":
                return self._handle_payment_succeeded(data)

            elif event_type == "invoice.payment_failed":
                return self._handle_payment_failed(data)

            else:
                logger.warning(f"Unhandled Stripe event type: {event_type}")
                return {"status": "ignored", "message": f"Event type {event_type} not handled"}

        except Exception as e:
            logger.error(f"Error processing Stripe webhook {event_type}: {e}")
            return {"status": "error", "message": str(e)}

    def _handle_checkout_completed(self, session: Dict[str, Any]) -> Dict[str, str]:
        """Handle successful checkout session completion."""
        tenant_id = session.get("metadata", {}).get("tenantId")
        subscription_id = session.get("subscription")
        customer_id = session.get("customer")
        customer_email = session.get("customer_details", {}).get("email")

        if not tenant_id:
            logger.warning("Checkout session missing tenantId metadata")
            return {"status": "skipped", "message": "Missing tenantId"}

        # Determine tier from subscription line items
        tier = self._extract_tier_from_session(session)

        # Generate and store license key
        if customer_email and tier:
            self._generate_and_store_license(
                email=customer_email,
                tier=tier,
                tenant_id=tenant_id,
                stripe_subscription_id=subscription_id,
                stripe_customer_id=customer_id
            )

        logger.info(f"Checkout completed: tenant={tenant_id}, subscription={subscription_id}")
        return {"status": "success", "message": "Checkout processed"}

    def _handle_subscription_created(self, subscription: Dict[str, Any]) -> Dict[str, str]:
        """Handle new subscription creation."""
        sub_id = subscription.get("id")
        customer_id = subscription.get("customer")
        tenant_id = subscription.get("metadata", {}).get("tenantId")
        status = subscription.get("status")

        logger.info(f"Subscription created: {sub_id}, status={status}, tenant={tenant_id}")

        # Store subscription record in database
        if self.db and tenant_id:
            try:
                self.db.table("subscriptions").upsert({
                    "tenant_id": tenant_id,
                    "provider": "stripe",
                    "subscription_id": sub_id,
                    "customer_id": customer_id,
                    "status": status,
                    "created_at": datetime.utcnow().isoformat()
                }, on_conflict="subscription_id").execute()
            except Exception as e:
                logger.error(f"Failed to store subscription: {e}")

        return {"status": "success", "message": "Subscription created"}

    def _handle_subscription_updated(self, subscription: Dict[str, Any]) -> Dict[str, str]:
        """Handle subscription updates (plan changes, status changes)."""
        sub_id = subscription.get("id")
        status = subscription.get("status")
        tenant_id = subscription.get("metadata", {}).get("tenantId")

        logger.info(f"Subscription updated: {sub_id}, new status={status}")

        # Update subscription status in database
        if self.db and sub_id:
            try:
                self.db.table("subscriptions").update({
                    "status": status,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("subscription_id", sub_id).execute()
            except Exception as e:
                logger.error(f"Failed to update subscription: {e}")

        return {"status": "success", "message": "Subscription updated"}

    def _handle_subscription_deleted(self, subscription: Dict[str, Any]) -> Dict[str, str]:
        """Handle subscription cancellation."""
        sub_id = subscription.get("id")
        tenant_id = subscription.get("metadata", {}).get("tenantId")

        logger.info(f"Subscription cancelled: {sub_id}, tenant={tenant_id}")

        # Update subscription status to cancelled
        if self.db and sub_id:
            try:
                self.db.table("subscriptions").update({
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow().isoformat()
                }).eq("subscription_id", sub_id).execute()

                # Optionally deactivate license
                if tenant_id:
                    self.db.table("licenses").update({
                        "status": "inactive"
                    }).eq("metadata->>tenant_id", tenant_id).execute()

            except Exception as e:
                logger.error(f"Failed to cancel subscription: {e}")

        return {"status": "success", "message": "Subscription cancelled"}

    def _handle_payment_succeeded(self, invoice: Dict[str, Any]) -> Dict[str, str]:
        """Handle successful recurring payment."""
        sub_id = invoice.get("subscription")
        amount_paid = invoice.get("amount_paid", 0) / 100  # Convert cents to dollars
        currency = invoice.get("currency", "usd").upper()

        logger.info(f"Payment succeeded: subscription={sub_id}, amount={amount_paid} {currency}")

        # Record payment in database
        if self.db and sub_id:
            try:
                self.db.table("payments").insert({
                    "subscription_id": sub_id,
                    "provider": "stripe",
                    "amount": amount_paid,
                    "currency": currency,
                    "status": "succeeded",
                    "paid_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception as e:
                logger.error(f"Failed to record payment: {e}")

        return {"status": "success", "message": "Payment recorded"}

    def _handle_payment_failed(self, invoice: Dict[str, Any]) -> Dict[str, str]:
        """Handle failed payment attempt."""
        sub_id = invoice.get("subscription")
        amount_due = invoice.get("amount_due", 0) / 100
        currency = invoice.get("currency", "usd").upper()

        logger.warning(f"Payment failed: subscription={sub_id}, amount={amount_due} {currency}")

        # Optionally suspend subscription or send notification
        # This is where you'd trigger email notifications to customer

        return {"status": "acknowledged", "message": "Payment failure logged"}

    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Cancel a Stripe subscription.

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Cancelled subscription object

        Raises:
            RuntimeError: If cancellation fails
        """
        if not self.is_configured():
            raise ValueError("Stripe is not configured")

        try:
            logger.info(f"Cancelling Stripe subscription: {subscription_id}")
            result = self.client.cancel_subscription(subscription_id)

            # Update local database
            if self.db:
                self.db.table("subscriptions").update({
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow().isoformat()
                }).eq("subscription_id", subscription_id).execute()

            return result

        except Exception as e:
            logger.error(f"Failed to cancel subscription {subscription_id}: {e}")
            raise RuntimeError(f"Subscription cancellation failed: {str(e)}")

    def get_subscription_status(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get current subscription status from Stripe.

        Args:
            subscription_id: Stripe subscription ID

        Returns:
            Dict with subscription details (status, current_period_end, etc.)

        Raises:
            RuntimeError: If retrieval fails
        """
        if not self.is_configured():
            raise ValueError("Stripe is not configured")

        try:
            subscription = self.client.get_subscription(subscription_id)

            return {
                "id": subscription["id"],
                "status": subscription["status"],
                "current_period_end": subscription["current_period_end"],
                "cancel_at_period_end": subscription["cancel_at_period_end"],
                "customer": subscription["customer"],
                "plan": subscription["items"]["data"][0]["price"]["id"] if subscription.get("items") else None
            }

        except Exception as e:
            logger.error(f"Failed to retrieve subscription {subscription_id}: {e}")
            raise RuntimeError(f"Subscription retrieval failed: {str(e)}")

    def _extract_tier_from_session(self, session: Dict[str, Any]) -> Optional[str]:
        """Extract license tier from checkout session line items."""
        try:
            # Get price_id from line_items or metadata
            line_items = session.get("line_items", {}).get("data", [])
            if line_items:
                price_id = line_items[0].get("price", {}).get("id")
                if price_id:
                    return self.PRICE_TO_TIER_MAP.get(price_id, "pro")
        except Exception as e:
            logger.warning(f"Failed to extract tier from session: {e}")

        return "pro"  # Default fallback

    def _generate_and_store_license(
        self,
        email: str,
        tier: str,
        tenant_id: str,
        stripe_subscription_id: Optional[str] = None,
        stripe_customer_id: Optional[str] = None,
        format: str = "agencyos"
    ) -> None:
        """
        Generate license key and store in database.

        Args:
            email: Customer email
            tier: License tier (starter, pro, franchise, enterprise)
            tenant_id: Internal tenant identifier
            stripe_subscription_id: Stripe subscription ID
            stripe_customer_id: Stripe customer ID
            format: License key format (default: agencyos)
        """
        if not email or not self.db:
            logger.warning("Skipping license generation: missing email or database")
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
                "metadata": {
                    "tenant_id": tenant_id,
                    "provider": "stripe"
                },
                "created_at": datetime.utcnow().isoformat()
            }

            if stripe_subscription_id:
                license_data["metadata"]["stripe_subscription_id"] = stripe_subscription_id

            if stripe_customer_id:
                license_data["metadata"]["stripe_customer_id"] = stripe_customer_id

            # Upsert to avoid duplicates on webhook retries
            self.db.table("licenses").upsert(
                license_data,
                on_conflict="license_key"
            ).execute()

            logger.info(f"Generated and stored license {license_key} for {email} (tier: {tier})")

        except Exception as e:
            logger.error(f"Failed to generate/store license: {e}")

    def map_price_to_tier(self, price_id: str) -> str:
        """
        Map Stripe Price ID to internal license tier.

        Args:
            price_id: Stripe Price ID

        Returns:
            License tier name (starter, pro, franchise, enterprise)
        """
        return self.PRICE_TO_TIER_MAP.get(price_id, "pro")

    def map_tier_to_price(self, tier: str, billing_cycle: str = "monthly") -> str:
        """
        Map license tier to Stripe Price ID.

        Args:
            tier: License tier (starter, pro, franchise, enterprise)
            billing_cycle: 'monthly' or 'yearly'

        Returns:
            Stripe Price ID

        Raises:
            ValueError: If tier or billing_cycle is invalid
        """
        tier_lower = tier.lower()
        cycle_suffix = billing_cycle.lower()

        if tier_lower not in self.TIER_TO_PRICE_MAP:
            raise ValueError(f"Invalid tier: {tier}")

        if cycle_suffix not in ["monthly", "yearly"]:
            raise ValueError(f"Invalid billing_cycle: {billing_cycle}")

        price_id = f"price_{tier_lower}_{cycle_suffix}"

        if price_id not in self.PRICE_TO_TIER_MAP:
            logger.warning(f"Price ID {price_id} not in mapping, using monthly default")
            return self.TIER_TO_PRICE_MAP[tier_lower]

        return price_id
