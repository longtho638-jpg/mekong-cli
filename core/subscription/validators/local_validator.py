"""
☁️ Local Validator - Local License Validation
=============================================

Validates subscriptions using local license files.
Primary validation method for CLI offline usage.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

from ..models.subscription import Subscription, SubscriptionTier
from .base_validator import BaseValidator

logger = logging.getLogger(__name__)


class LocalValidator(BaseValidator):
    """Local license file validator for offline CLI usage."""

    def __init__(self, local_app_dir: str = ".mekong"):
        self.local_license_path = Path.home() / local_app_dir / "license.json"

    def get_subscription(self, user_id: str) -> Optional[Subscription]:
        """Get subscription from local license file."""
        if not self.local_license_path.exists():
            return None

        try:
            with open(self.local_license_path, "r", encoding="utf-8") as f:
                local_data = json.load(f)

            return Subscription(
                user_id=user_id,
                tier=SubscriptionTier.from_str(local_data.get("tier", "starter")),
                status=local_data.get("status", "active"),
                license_key=local_data.get("key"),
                agency_id=local_data.get("agency_id"),
                source="local_file",
            )
        except Exception as e:
            logger.warning(f"Could not read local license: {e}")
            return None

    def validate_license(self, license_key: str, email: Optional[str] = None) -> Dict:
        """Validate license key using local patterns."""
        license_key = license_key.strip()

        # Quick Local Pattern Match
        if license_key.startswith("AGENCYOS-"):
            return {"valid": True, "tier": SubscriptionTier.PRO, "source": "local_pattern"}
        elif license_key.startswith("mk_live_"):
            parts = license_key.split("_")
            if len(parts) >= 3:
                tier = SubscriptionTier.from_str(parts[2])
                return {"valid": True, "tier": tier, "source": "local_pattern"}

        return {"valid": False, "reason": "Invalid license key format."}

    def check_tier_access(self, tier: SubscriptionTier, feature: str) -> bool:
        """Check tier feature access using local logic."""
        # Simple feature mapping for local validation
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

    def save_license(self, license_data: Dict) -> bool:
        """Save license data to local file."""
        try:
            self.local_license_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.local_license_path, "w", encoding="utf-8") as f:
                json.dump(license_data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to save license: {e}")
            return False
