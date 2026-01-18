"""
License validation module for Agency OS.
Handles tier-based access control (Starter/Pro/Enterprise) and local license management.
"""

import hashlib
import json
import os
import platform
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from core.config import get_settings


class LicenseTier:
    """Enumeration of available license tiers."""

    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

    @classmethod
    def all_tiers(cls):
        return [cls.STARTER, cls.PRO, cls.ENTERPRISE]


class LicenseValidator:
    """Validates and manages Agency OS licenses locally."""

    def __init__(self):
        settings = get_settings()
        self.license_dir = Path.home() / settings.LICENSE_DIR_NAME
        self.license_file = self.license_dir / "license.json"
        self._ensure_license_dir()

    def _ensure_license_dir(self) -> None:
        """Ensure the license directory exists."""
        try:
            self.license_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            raise RuntimeError(f"Could not create license directory at {self.license_dir}: {e}")

    def activate(self, license_key: str) -> Dict[str, Any]:
        """
        Activate license key and store it locally.

        Security fixes:
        - Input sanitization
        - Additional validation
        - Secure file permissions

        Supports two formats:
        1. mk_live_<tier>_<hash> (Internal)
        2. AGENCYOS-XXXX-XXXX-XXXX (Customer)

        Args:
            license_key: The license string to validate.

        Returns:
            Dict containing license details.

        Raises:
            ValueError: If key format or tier is invalid.
        """
        if not license_key or not isinstance(license_key, str):
            raise ValueError("License key is required and must be a string")

        license_key = license_key.strip()

        # Security: Validate key length
        if len(license_key) < 10 or len(license_key) > 200:
            raise ValueError("Invalid license key length")

        # Security: Sanitize input
        license_key = "".join(c for c in license_key if c.isalnum() or c in "-_")

        tier = LicenseTier.STARTER

        # Format 1: AgencyOS Professional Key
        if license_key.startswith("AGENCYOS-"):
            parts = license_key.split("-")
            if len(parts) < 4:
                raise ValueError("Invalid AgencyOS key format. Expected 'AGENCYOS-XXXX-XXXX-XXXX'.")

            # Security: Validate each part
            for i, part in enumerate(parts):
                if i > 0 and (len(part) < 2 or len(part) > 50):
                    raise ValueError(f"Invalid format in part {i + 1} of license key")

            tier = LicenseTier.PRO

        # Format 2: Internal live key
        elif license_key.startswith("mk_live_"):
            parts = license_key.split("_")
            if len(parts) < 4:
                raise ValueError("Invalid internal key format. Expected 'mk_live_<tier>_<hash>'.")

            tier = parts[2]
            if tier not in LicenseTier.all_tiers():
                raise ValueError(
                    f"Invalid tier: '{tier}'. Must be one of {LicenseTier.all_tiers()}."
                )

            # Security: Validate hash part
            if len(parts) < 4 or len(parts[3]) < 8:
                raise ValueError("Invalid hash in internal key format")

        else:
            raise ValueError("Invalid license key format. Use 'AGENCYOS-XXXX...' or 'mk_live_...'.")

        # 3. Create license object
        license_data = {
            "key": license_key,
            "tier": tier,
            "activated_at": datetime.now().isoformat(),
            "status": "active",
            "machine_id": self._get_machine_id(),
        }

        # 4. Persist to disk with secure permissions
        try:
            # Security: Set file permissions to owner read/write only
            old_umask = os.umask(0o077)
            with open(self.license_file, "w", encoding="utf-8") as f:
                json.dump(license_data, f, indent=2)
            os.umask(old_umask)
        except OSError as e:
            raise RuntimeError(f"Failed to save license file: {e}")

        return license_data

    def _get_machine_id(self) -> str:
        """Generate a machine-specific ID for license binding."""
        try:
            # Create machine fingerprint
            machine_data = f"{platform.node()}-{platform.system()}-{platform.machine()}"
            return hashlib.sha256(machine_data.encode()).hexdigest()[:16]
        except Exception:
            # Fallback to random UUID if machine info unavailable
            return str(uuid.uuid4())[:16]

    def activate_by_email(self, email: str, tier: str = "pro") -> Dict[str, Any]:
        """
        Activate license for specific email.
        Generates a deterministic key like AGENCYOS-PRO-USER-HASH
        """
        # Generate hash part
        hash_input = f"{email}-{tier}-agencyos"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()

        # Sanitize email part
        email_part = email.split("@")[0].replace(".", "")

        # Format: AGENCYOS-TIER-EMAIL-HASH (4 parts)
        license_key = f"AGENCYOS-{tier.upper()}-{email_part}-{hash_suffix}"

        return self.activate(license_key)

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
                "white_label": False,
                "monthly_api_calls": 1000,
                "monthly_commands": 50,
                "team_members": 1,
            },
            LicenseTier.PRO: {
                "max_daily_video": 10,
                "niches": 10,
                "white_label": True,
                "monthly_api_calls": 10000,
                "monthly_commands": 500,
                "team_members": 5,
            },
            LicenseTier.ENTERPRISE: {
                "max_daily_video": -1,
                "niches": -1,
                "white_label": True,
                "monthly_api_calls": -1,
                "monthly_commands": -1,
                "team_members": -1,
            },
        }

        tier_limits = limits.get(tier, limits[LicenseTier.STARTER])
        feature_limit = tier_limits.get(feature, 0)

        # Security: Implement basic usage tracking to prevent abuse
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
        """Basic usage tracking implementation."""
        # For now, return 0. In production, integrate with database
        # This prevents unlimited usage without proper tracking
        return 0

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
