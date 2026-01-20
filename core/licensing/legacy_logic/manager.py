import logging
import warnings
from datetime import datetime, timedelta
from typing import Dict, Any

from .models import License, LicenseTier, LicenseStatus

logger = logging.getLogger(__name__)

class LicenseEngine:
    """
    Core engine for license management.
    """
    PRICING = {
        LicenseTier.STARTER: {
            "monthly": 0.0,
            "territories": 1,
            "features": ["Personal use", "1 region"],
        },
        LicenseTier.FRANCHISE: {
            "monthly": 500.0,
            "territories": 3,
            "features": ["3 territories", "Priority support"],
        },
        LicenseTier.ENTERPRISE: {
            "monthly": 2000.0,
            "territories": 100,
            "features": ["Unlimited", "API access"],
        },
    }

    def __init__(self):
        self.licenses: Dict[str, License] = {}

    def generate_license_key(self, tier: LicenseTier) -> str:
        """
        Create a cryptographically unique license string.
        """
        from core.licensing.generator import license_generator

        warnings.warn(
            "LicenseEngine.generate_license_key is deprecated. "
            "Use core.licensing.generator.license_generator instead.",
            DeprecationWarning,
            stacklevel=2
        )

        tier_map = {
            LicenseTier.STARTER: "starter",
            LicenseTier.FRANCHISE: "franchise",
            LicenseTier.ENTERPRISE: "enterprise",
        }

        return license_generator.generate(format='agencyos', tier=tier_map[tier])

    def activate_license(
        self,
        email: str,
        name: str,
        tier: LicenseTier = LicenseTier.FRANCHISE,
        duration_months: int = 12,
    ) -> License:
        """Provision a new license for a partner."""
        if not email or not name:
            raise ValueError("Owner details required")

        key = self.generate_license_key(tier)
        cfg = self.PRICING[tier]

        lic = License(
            key=key,
            tier=tier,
            status=LicenseStatus.ACTIVE,
            owner_email=email,
            owner_name=name,
            territories_allowed=cfg["territories"],
            activated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30 * duration_months),
            monthly_fee=cfg["monthly"],
        )

        self.licenses[key] = lic
        logger.info(f"License activated for {name} ({tier.value})")
        return lic

    def validate_license(self, key: str) -> Dict[str, Any]:
        """Check if a license key is valid and active."""
        if key not in self.licenses:
            logger.warning(f"Invalid license check: {key}")
            return {"valid": False, "error": "License key not found"}

        lic = self.licenses[key]

        if lic.expires_at and datetime.now() > lic.expires_at:
            lic.status = LicenseStatus.EXPIRED
            logger.warning(f"License expired: {key}")
            return {"valid": False, "error": "License expired"}

        if lic.status != LicenseStatus.ACTIVE:
            return {"valid": False, "error": f"License is {lic.status.value}"}

        return {
            "valid": True,
            "tier": lic.tier.value,
            "owner": lic.owner_name,
            "territories": lic.territories_allowed,
        }
