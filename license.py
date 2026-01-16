"""
License validation module for Mekong-CLI.
Handles tier-based access control (Starter/Pro/Enterprise) and local license management.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

class LicenseTier:
    """Enumeration of available license tiers."""
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

    @classmethod
    def all_tiers(cls):
        return [cls.STARTER, cls.PRO, cls.ENTERPRISE]

class LicenseValidator:
    """Validates and manages Mekong-CLI licenses locally."""
    
    def __init__(self, app_name: str = ".mekong"):
        self.license_dir = Path.home() / app_name
        self.license_file = self.license_dir / "license.json"
        self._ensure_license_dir()

    def _ensure_license_dir(self) -> None:
        """Ensure the license directory exists."""
        try:
            self.license_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            # In case of permission errors or other issues
            raise RuntimeError(f"Could not create license directory at {self.license_dir}: {e}")

    def activate(self, license_key: str) -> Dict[str, Any]:
        """
        Activate license key and store it locally.
        
        Supports two formats:
        1. mk_live_<tier>_<hash> (Internal)
        2. AGENCYOS-XXXX-XXXX-XXXX (Customer)
        
        Args:
            license_key: The license string to validate.
            
        Returns:
            Dict containing license details.
            
        Raises:
            ValueError: If the key format or tier is invalid.
        """
        license_key = license_key.strip()
        tier = LicenseTier.STARTER

        # Format 1: AgencyOS Professional Key
        if license_key.startswith("AGENCYOS-"):
            if len(license_key.split("-")) < 4:
                raise ValueError("Invalid AgencyOS key format. Expected 'AGENCYOS-XXXX-XXXX-XXXX'.")
            tier = LicenseTier.PRO
            
        # Format 2: Internal live key
        elif license_key.startswith("mk_live_"):
            parts = license_key.split("_")
            if len(parts) < 4:
                raise ValueError("Invalid internal key format. Expected 'mk_live_<tier>_<hash>'.")
            
            tier = parts[2]
            if tier not in LicenseTier.all_tiers():
                raise ValueError(f"Invalid tier: '{tier}'. Must be one of {LicenseTier.all_tiers()}.")
        
        else:
            raise ValueError("Invalid license key format. Use 'AGENCYOS-XXXX...' or 'mk_live_...'.")
        
        # 3. Create license object
        license_data = {
            "key": license_key,
            "tier": tier,
            "activated_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        # 4. Persist to disk
        try:
            with open(self.license_file, "w", encoding="utf-8") as f:
                json.dump(license_data, f, indent=2)
        except OSError as e:
             raise RuntimeError(f"Failed to save license file: {e}")
        
        return license_data
    
    def get_license(self) -> Optional[Dict[str, Any]]:
        """Retrieve current license info from disk."""
        if not self.license_file.exists():
            return None
        
        try:
            with open(self.license_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return None
    
    def get_tier(self) -> str:
        """Get current tier (defaults to STARTER if no active license)."""
        license_data = self.get_license()
        if not license_data:
            return LicenseTier.STARTER
        return license_data.get("tier", LicenseTier.STARTER)
    
    def check_quota(self, feature: str) -> Dict[str, Any]:
        """
        Check quota limits based on the current tier.
        
        Args:
            feature: The feature key to check (e.g., 'max_daily_video').
            
        Returns: 
            Dict: {"allowed": bool, "limit": int, "used": int, "tier": str}
        """
        tier = self.get_tier()
        
        # Define limits per tier
        # -1 indicates unlimited
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
                "max_daily_video": -1,
                "niches": -1,
                "white_label": True
            }
        }
        
        tier_limits = limits.get(tier, limits[LicenseTier.STARTER])
        feature_limit = tier_limits.get(feature, 0)
        
        # TODO: Implement actual usage tracking via Supabase or local state
        used_amount = 0 
        
        is_allowed = False
        if feature_limit == -1:
            is_allowed = True
        elif feature_limit > 0:
            is_allowed = used_amount < feature_limit

        return {
            "allowed": is_allowed,
            "limit": feature_limit,
            "used": used_amount,
            "tier": tier
        }
    
    def deactivate(self) -> bool:
        """
        Deactivate current license by removing the local file.
        Returns True if successful or file didn't exist, False on error.
        """
        if not self.license_file.exists():
            return True
            
        try:
            self.license_file.unlink()
            return True
        except OSError:
            return False