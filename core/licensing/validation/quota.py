"""
Quota and usage tracking for License Validation.
"""
from typing import Any, Dict

from .engine import LicenseValidationEngine
from .models import LicenseTier


class QuotaManager(LicenseValidationEngine):
    def get_tier(self) -> str:
        license_data = self.get_license()
        if not license_data:
            return LicenseTier.STARTER
        return license_data.get("tier", LicenseTier.STARTER)

    def check_quota(self, feature: str) -> Dict[str, Any]:
        tier = self.get_tier()
        limits = {
            LicenseTier.STARTER: {
                "max_daily_video": 1, "niches": 1, "white_label": False,
                "monthly_api_calls": 1000, "monthly_commands": 50, "team_members": 1,
            },
            LicenseTier.PRO: {
                "max_daily_video": 10, "niches": 10, "white_label": True,
                "monthly_api_calls": 10000, "monthly_commands": 500, "team_members": 5,
            },
            LicenseTier.ENTERPRISE: {
                "max_daily_video": -1, "niches": -1, "white_label": True,
                "monthly_api_calls": -1, "monthly_commands": -1, "team_members": -1,
            },
        }

        tier_limits = limits.get(tier, limits[LicenseTier.STARTER])
        feature_limit = tier_limits.get(feature, 0)
        used_amount = self._get_usage(feature)

        is_allowed = False
        if feature_limit == -1:
            is_allowed = True
        elif feature_limit > 0:
            is_allowed = used_amount < feature_limit

        return {
            "allowed": is_allowed,
            "limit": feature_limit,
            "used": used_amount,
            "tier": tier,
        }

    def _get_usage(self, feature: str) -> int:
        return 0 # Placeholder for database integration
