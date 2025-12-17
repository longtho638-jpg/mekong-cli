"""
🎫 License System - Franchise Activation
==========================================

Manage franchise licenses with tier-based access.

Tiers:
- Starter: $0 - Personal use only
- Franchise: $500/month - Up to 3 territories  
- Enterprise: $2000/month - Unlimited territories
"""

import os
import uuid
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum


class LicenseTier(Enum):
    """License tier levels."""
    STARTER = "starter"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"


class LicenseStatus(Enum):
    """License status."""
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    TRIAL = "trial"


@dataclass
class License:
    """A franchise license."""
    key: str
    tier: LicenseTier
    status: LicenseStatus
    owner_email: str
    owner_name: str
    territories_allowed: int
    activated_at: datetime
    expires_at: Optional[datetime]
    monthly_fee: float


class LicenseManager:
    """
    Manage franchise licenses.
    
    Handles activation, validation, and tier management.
    """
    
    def __init__(self):
        self.licenses: Dict[str, License] = {}
        
        # Pricing
        self.pricing = {
            LicenseTier.STARTER: {
                "monthly": 0,
                "territories": 1,
                "features": ["Personal use", "1 region", "Community support"]
            },
            LicenseTier.FRANCHISE: {
                "monthly": 500,
                "territories": 3,
                "features": ["3 territories", "All regions", "Priority support", "White-label"]
            },
            LicenseTier.ENTERPRISE: {
                "monthly": 2000,
                "territories": 100,
                "features": ["Unlimited", "Custom training", "Dedicated support", "API access"]
            }
        }
    
    def generate_license_key(self, tier: LicenseTier) -> str:
        """Generate a unique license key."""
        prefix = {
            LicenseTier.STARTER: "AGOS-ST",
            LicenseTier.FRANCHISE: "AGOS-FR",
            LicenseTier.ENTERPRISE: "AGOS-EN"
        }[tier]
        
        unique_id = uuid.uuid4().hex[:8].upper()
        checksum = hashlib.md5(unique_id.encode()).hexdigest()[:4].upper()
        
        return f"{prefix}-{unique_id}-{checksum}"
    
    def activate_license(
        self,
        email: str,
        name: str,
        tier: LicenseTier = LicenseTier.FRANCHISE,
        duration_months: int = 12
    ) -> License:
        """Activate a new license."""
        key = self.generate_license_key(tier)
        pricing = self.pricing[tier]
        
        license = License(
            key=key,
            tier=tier,
            status=LicenseStatus.ACTIVE,
            owner_email=email,
            owner_name=name,
            territories_allowed=pricing["territories"],
            activated_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=30 * duration_months),
            monthly_fee=pricing["monthly"]
        )
        
        self.licenses[key] = license
        return license
    
    def validate_license(self, key: str) -> Dict[str, Any]:
        """Validate a license key."""
        if key not in self.licenses:
            return {"valid": False, "error": "License key not found"}
        
        license = self.licenses[key]
        
        # Check expiration
        if license.expires_at and datetime.now() > license.expires_at:
            license.status = LicenseStatus.EXPIRED
            return {"valid": False, "error": "License expired"}
        
        # Check status
        if license.status != LicenseStatus.ACTIVE:
            return {"valid": False, "error": f"License is {license.status.value}"}
        
        return {
            "valid": True,
            "tier": license.tier.value,
            "territories": license.territories_allowed,
            "expires": license.expires_at.isoformat() if license.expires_at else None,
            "owner": license.owner_name
        }
    
    def get_license_info(self, key: str) -> Optional[Dict[str, Any]]:
        """Get full license information."""
        if key not in self.licenses:
            return None
        
        license = self.licenses[key]
        pricing = self.pricing[license.tier]
        
        days_remaining = None
        if license.expires_at:
            delta = license.expires_at - datetime.now()
            days_remaining = max(0, delta.days)
        
        return {
            "key": license.key,
            "tier": license.tier.value,
            "status": license.status.value,
            "owner": {
                "name": license.owner_name,
                "email": license.owner_email
            },
            "territories_allowed": license.territories_allowed,
            "monthly_fee": f"${license.monthly_fee:,.0f}",
            "activated_at": license.activated_at.isoformat(),
            "expires_at": license.expires_at.isoformat() if license.expires_at else None,
            "days_remaining": days_remaining,
            "features": pricing["features"]
        }
    
    def format_pricing_table(self) -> str:
        """Format pricing as ASCII table."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🎫 AGENCY OS - FRANCHISE PRICING                         ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for tier in LicenseTier:
            pricing = self.pricing[tier]
            name = tier.value.upper()
            price = f"${pricing['monthly']:,.0f}/mo" if pricing['monthly'] > 0 else "FREE"
            territories = f"{pricing['territories']} territories" if pricing['territories'] < 100 else "Unlimited"
            
            lines.append(f"║  {name:12} | {price:12} | {territories:15} ║")
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    manager = LicenseManager()
    
    print("🎫 Agency OS License System")
    print("=" * 50)
    print()
    
    # Show pricing
    print(manager.format_pricing_table())
    print()
    
    # Activate a license
    license = manager.activate_license(
        email="minh@example.com",
        name="Minh Nguyen",
        tier=LicenseTier.FRANCHISE
    )
    
    print(f"✅ License Activated!")
    print(f"   Key: {license.key}")
    print(f"   Tier: {license.tier.value}")
    print(f"   Territories: {license.territories_allowed}")
    print(f"   Fee: ${license.monthly_fee}/month")
    print()
    
    # Validate
    result = manager.validate_license(license.key)
    print(f"🔍 Validation: {'✅ Valid' if result['valid'] else '❌ Invalid'}")
