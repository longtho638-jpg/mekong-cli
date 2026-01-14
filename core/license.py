"""
🎫 License System - Franchise Activation
==========================================

Manage franchise licenses with tier-based access.

Tiers:
- Starter: $0 - Personal use only
- Franchise: $500/month - Up to 3 territories  
- Enterprise: $2000/month - Unlimited territories
"""

import hashlib
import uuid
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LicenseTier(Enum):
    """Franchise partnership levels."""
    STARTER = "starter"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"


class LicenseStatus(Enum):
    """Lifecycle status of a license."""
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    TRIAL = "trial"


@dataclass
class License:
    """A digital license entity record."""
    key: str
    tier: LicenseTier
    status: LicenseStatus
    owner_email: str
    owner_name: str
    territories_allowed: int
    activated_at: datetime
    expires_at: Optional[datetime]
    monthly_fee: float

    def __post_init__(self):
        if self.monthly_fee < 0:
            raise ValueError("Fee cannot be negative")


class LicenseManager:
    """
    License Management System.
    
    Generates, validates, and manages lifecycle of agency franchise licenses.
    """
    
    PRICING = {
        LicenseTier.STARTER: {"monthly": 0.0, "territories": 1, "features": ["Personal use", "1 region"]},
        LicenseTier.FRANCHISE: {"monthly": 500.0, "territories": 3, "features": ["3 territories", "Priority support"]},
        LicenseTier.ENTERPRISE: {"monthly": 2000.0, "territories": 100, "features": ["Unlimited", "API access"]}
    }
    
    def __init__(self):
        self.licenses: Dict[str, License] = {}
        logger.info("License Manager initialized.")
    
    def generate_license_key(self, tier: LicenseTier) -> str:
        """Create a cryptographically unique license string."""
        prefix = {
            LicenseTier.STARTER: "AGOS-ST",
            LicenseTier.FRANCHISE: "AGOS-FR",
            LicenseTier.ENTERPRISE: "AGOS-EN"
        }[tier]
        
        uid = uuid.uuid4().hex[:8].upper()
        chk = hashlib.md5(uid.encode()).hexdigest()[:4].upper()
        return f"{prefix}-{uid}-{chk}"
    
    def activate_license(
        self,
        email: str,
        name: str,
        tier: LicenseTier = LicenseTier.FRANCHISE,
        duration_months: int = 12
    ) -> License:
        """Provision a new license for a partner."""
        if not email or not name:
            raise ValueError("Owner details required")

        key = self.generate_license_key(tier)
        cfg = self.PRICING[tier]
        
        lic = License(
            key=key, tier=tier, status=LicenseStatus.ACTIVE,
            owner_email=email, owner_name=name,
            territories_allowed=cfg["territories"],
            activated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30 * duration_months),
            monthly_fee=cfg["monthly"]
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
            "territories": lic.territories_allowed
        }
    
    def format_pricing_table(self) -> str:
        """Render the pricing options table."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🎫 AGENCY OS - FRANCHISE PRICING                         ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for tier in LicenseTier:
            p = self.PRICING[tier]
            cost = "FREE" if p["monthly"] == 0 else f"${p['monthly']:,.0f}/mo"
            terr = f"{p['territories']} terr" if p['territories'] < 99 else "Unlimited"
            lines.append(f"║  {tier.value.upper():<12} │ {cost:<10} │ {terr:<15} ║")
            
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎫 Initializing License System...")
    print("=" * 60)
    
    try:
        mgr = LicenseManager()
        lic = mgr.activate_license("partner@agency.com", "Partner One", LicenseTier.FRANCHISE)
        
        print("\n" + mgr.format_pricing_table())
        print(f"\n✅ Active License: {lic.key}")
        
    except Exception as e:
        logger.error(f"License Error: {e}")
