"""
🏗️ Provisioning Service
=======================
Centralized logic for managing subscription lifecycles and provisioning resources.
Syncs state between the unified `subscriptions` table and legacy `organizations` table.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any

from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)

class ProvisioningService:
    """
    Handles business logic for:
    - Activating/Cancelling subscriptions
    - Syncing status between billing tables
    - Enforcing plan limits
    """

    def __init__(self):
        self.db = get_db()
        if not self.db:
            logger.warning("ProvisioningService initialized without DB connection")

    def activate_subscription(
        self,
        tenant_id: str,
        plan: str,
        provider: str,
        subscription_id: str,
        customer_id: str = None,
        period_end: datetime = None
    ) -> Dict[str, Any]:
        """
        Activates a subscription for a tenant.
        Upserts into `subscriptions` and syncs to `organizations`.
        """
        logger.info(f"Provisioning {plan} for tenant {tenant_id} via {provider}")

        if not self.db:
            return {"error": "Database unavailable"}

        # 1. Upsert into subscriptions table (The Source of Truth)
        sub_data = {
            "tenant_id": tenant_id,
            "plan": plan.upper(),
            "status": "active",
            "currency": "USD",
            "updated_at": datetime.now().isoformat()
        }

        if provider == "stripe":
            sub_data["stripe_subscription_id"] = subscription_id
            sub_data["stripe_customer_id"] = customer_id
        elif provider == "paypal":
            sub_data["paypal_subscription_id"] = subscription_id

        # Calculate default period end if not provided
        if not period_end:
            period_end = datetime.now() + timedelta(days=30)

        sub_data["current_period_end"] = period_end.isoformat()

        # Execute Upsert on subscriptions
        try:
            # Check if subscription exists
            existing = self.db.table("subscriptions").select("*").eq("tenant_id", tenant_id).execute()

            if existing.data:
                self.db.table("subscriptions").update(sub_data).eq("tenant_id", tenant_id).execute()
            else:
                self.db.table("subscriptions").insert(sub_data).execute()

        except Exception as e:
            logger.error(f"Failed to update subscriptions table: {e}")
            # Continue to sync organizations for backward compat

        # 2. Sync legacy organizations table
        org_data = {
            "plan": plan.lower(), # legacy uses lowercase
            "updated_at": datetime.now().isoformat()
        }

        if provider == "paypal":
            org_data["paypal_subscription_id"] = subscription_id
            org_data["subscription_status"] = "active"

        try:
            self.db.table("organizations").update(org_data).eq("id", tenant_id).execute()
            logger.info(f"Synced organization {tenant_id} to plan {plan}")
        except Exception as e:
            logger.error(f"Failed to sync organizations table: {e}")
            return {"error": f"Provisioning failed: {e}"}

        return {"success": True, "tenant_id": tenant_id, "plan": plan}

    def cancel_subscription(self, provider_subscription_id: str, provider: str) -> Dict[str, Any]:
        """
        Downgrades a tenant to FREE upon cancellation.
        """
        logger.info(f"Cancelling subscription {provider_subscription_id} ({provider})")

        if not self.db:
            return {"error": "Database unavailable"}

        # Find tenant by subscription ID
        tenant_id = None

        try:
            if provider == "stripe":
                result = self.db.table("subscriptions").select("tenant_id").eq("stripe_subscription_id", provider_subscription_id).execute()
            elif provider == "paypal":
                # First try unified subscriptions table
                result = self.db.table("subscriptions").select("tenant_id").eq("paypal_subscription_id", provider_subscription_id).execute()

                # Fallback to legacy organizations if not found
                if not result.data:
                    logger.info(f"Subscription {provider_subscription_id} not found in subscriptions, checking legacy organizations")
                    result = self.db.table("organizations").select("id").eq("paypal_subscription_id", provider_subscription_id).execute()
                    if result.data:
                        result.data[0]['tenant_id'] = result.data[0]['id']

            if not result.data:
                logger.warning(f"Subscription {provider_subscription_id} not found")
                return {"error": "Subscription not found"}

            tenant_id = result.data[0]['tenant_id']

        except Exception as e:
            logger.error(f"Lookup failed: {e}")
            return {"error": str(e)}

        # Perform Downgrade
        return self.activate_subscription(
            tenant_id=tenant_id,
            plan="FREE",
            provider=provider,
            subscription_id="",
            period_end=datetime.now()
        )

    def record_payment(
        self,
        tenant_id: str,
        amount: float,
        currency: str,
        provider: str,
        transaction_id: str,
        invoice_id: str = None
    ) -> Dict[str, Any]:
        """
        Records a payment in the `payments` table and updates `last_payment_at` in organizations.
        """
        logger.info(f"Recording {amount} {currency} payment for tenant {tenant_id} via {provider}")

        if not self.db:
            return {"error": "Database unavailable"}

        payment_data = {
            "tenant_id": tenant_id,
            "amount": amount,
            "currency": currency,
            "status": "succeeded",
            "paid_at": datetime.now().isoformat(),
            "payment_method": provider
        }

        if provider == "stripe":
            payment_data["stripe_payment_intent_id"] = transaction_id
        elif provider == "paypal":
            payment_data["paypal_capture_id"] = transaction_id
            # If we have an order ID in metadata or passed separately, we could add it here

        try:
            self.db.table("payments").insert(payment_data).execute()

            # Update legacy org for compatibility
            self.db.table("organizations").update({
                "last_payment_at": datetime.now().isoformat(),
                "last_payment_amount": amount
            }).eq("id", tenant_id).execute()

            return {"success": True}
        except Exception as e:
            logger.error(f"Failed to record payment: {e}")
            return {"error": str(e)}
