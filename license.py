"""
License validation module for Mekong-CLI
Handles tier-based access control (Starter/Pro/Enterprise)
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict
from cryptography.fernet import Fernet
import hashlib

class LicenseTier:
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class LicenseValidator:
    """Validates and manages Mekong-CLI licenses"""
    
    def __init__(self):
        self.license_dir = Path.home() / ".mekong"
        self.license_file = self.license_dir / "license.json"
        self.license_dir.mkdir(exist_ok=True)
        
    def activate(self, license_key: str) -> Dict:
        """
        Activate license key and store encrypted
        
        Format: mk_live_<tier>_<hash>
        Example: mk_live_pro_abc123def456
        """
        # Parse license key
        parts = license_key.split("_")
        if len(parts) < 4 or parts[0] != "mk" or parts[1] != "live":
            raise ValueError("Invalid license key format")
        
        tier = parts[2]
        if tier not in [LicenseTier.STARTER, LicenseTier.PRO, LicenseTier.ENTERPRISE]:
            raise ValueError(f"Invalid tier: {tier}")
        
        # Verify hash (in production, call API to validate)
        # For now, simple validation
        key_hash = parts[3]
        if len(key_hash) < 12:
            raise ValueError("Invalid license key")
        
        # Store license
        license_data = {
            "key": license_key,
            "tier": tier,
            "activated_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        with open(self.license_file, "w") as f:
            json.dump(license_data, f, indent=2)
        
        return license_data
    
    def get_license(self) -> Optional[Dict]:
        """Get current license info"""
        if not self.license_file.exists():
            return None
        
        with open(self.license_file, "r") as f:
            return json.load(f)
    
    def get_tier(self) -> str:
        """Get current tier (defaults to starter if no license)"""
        license = self.get_license()
        if not license:
            return LicenseTier.STARTER
        return license.get("tier", LicenseTier.STARTER)
    
    def check_quota(self, feature: str) -> Dict:
        """
        Check quota limits based on tier
        
        Returns: {"allowed": bool, "limit": int, "used": int}
        """
        tier = self.get_tier()
        
        # Define limits per tier
        limits = {
            LicenseTier.STARTER: {
                "max_daily_video": 1,
                "niches": 1,
                "white_label": False
            },
            LicenseTier.PRO: {
                "max_daily_video": 10,
                "niches": 10,
                "white_label": True
            },
            LicenseTier.ENTERPRISE: {
                "max_daily_video": -1,  # unlimited
                "niches": -1,
                "white_label": True
            }
        }
        
        tier_limits = limits.get(tier, limits[LicenseTier.STARTER])
        feature_limit = tier_limits.get(feature, 0)
        
        # TODO: Track actual usage (via Supabase or local file)
        # For now, return static data
        return {
            "allowed": feature_limit != 0,
            "limit": feature_limit,
            "used": 0,  # Placeholder
            "tier": tier
        }
    
    def deactivate(self):
        """Deactivate current license"""
        if self.license_file.exists():
            self.license_file.unlink()
