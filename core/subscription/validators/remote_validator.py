"""
☁️ Remote Validator - Cloud Validation
=====================================

Validates subscriptions using Supabase/remote database.
Primary validation method for cloud/web applications.
"""

import logging
from typing import Dict, Optional

try:
    from core.infrastructure.database import get_db
except ImportError:
    try:
        from core.config import get_settings
        from core.infrastructure.database import get_db
    except ImportError:

        def get_db():
            return None

        def get_settings():
            return None


from ..models.subscription import Subscription, SubscriptionTier
from .base_validator import BaseValidator

logger = logging.getLogger(__name__)


class RemoteValidator(BaseValidator):
    """Remote database validator for cloud/web usage."""

    def __init__(self):
        self.db = get_db()

    def get_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get subscription from Supabase."""
        if not self.db:
            return None

        try:
            response = (
                self.db.from_("subscriptions").select("*").eq("user_id", user_id).single().execute()
            )

            if response.data:
                data = response.data
                return Subscription(
                    user_id=user_id,
                    tier=SubscriptionTier.from_str(data.get("tier", "starter")),
                    status=data.get("status", "active"),
                    agency_id=data.get("agency_id", user_id),
                    source="supabase",
                )
        except Exception as e:
            logger.debug(f"Could not fetch subscription from DB for {user_id}: {e}")

        return None

    def validate_license(self, license_key: str, email: Optional[str] = None) -> Dict:
        """Validate license key using remote database."""
        if not self.db:
            return {"valid": False, "reason": "No database connection."}

        try:
            query = self.db.from_("licenses").select("*").eq("license_key", license_key)

            if email:
                query = query.eq("email", email)

            response = query.execute()

            if response.data:
                data = response.data[0]
                if data.get("status") == "active":
                    return {
                        "valid": True,
                        "tier": SubscriptionTier.from_str(data.get("plan", "starter")),
                        "data": data,
                        "source": "remote",
                    }
                else:
                    return {
                        "valid": False,
                        "reason": f"License status: {data.get('status')}",
                    }
        except Exception as e:
            logger.error(f"Remote license validation failed: {e}")

        return {"valid": False, "reason": "License not found."}

    def check_tier_access(self, tier: SubscriptionTier, feature: str) -> bool:
        """Check tier feature access using remote logic."""
        # Remote validation follows same logic as local
        feature_requirements = {
            "api_access": [
                SubscriptionTier.PRO,
                SubscriptionTier.FRANCHISE,
                SubscriptionTier.ENTERPRISE,
            ],
            "white_label": [SubscriptionTier.FRANCHISE, SubscriptionTier.ENTERPRISE],
            "priority_support": [
                SubscriptionTier.PRO,
                SubscriptionTier.FRANCHISE,
                SubscriptionTier.ENTERPRISE,
            ],
        }

        return tier in feature_requirements.get(feature, [SubscriptionTier.FREE])

    def update_subscription(self, user_id: str, updates: Dict) -> bool:
        """Update subscription in remote database."""
        if not self.db:
            return False

        try:
            self.db.from_("subscriptions").update(updates).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to update subscription: {e}")
            return False
