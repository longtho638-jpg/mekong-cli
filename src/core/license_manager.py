"""
License Manager — Local License Storage & Validation

Features:
- Store validated license from RaaS Gateway
- Encrypt sensitive data at rest
- Check license validity and expiry
- Get license tier and features
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List

from src.auth.secure_storage import get_secure_storage


@dataclass
class LicenseData:
    """License data structure."""

    license_key: str
    tenant_id: str
    tier: str
    features: List[str] = field(default_factory=list)
    rate_limit: int = 60  # requests per minute
    max_payload_size: int = 1048576  # 1MB
    retention_days: int = 30
    expires_at: Optional[str] = None
    activated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_validated: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def is_expired(self) -> bool:
        """Check if license is expired."""
        if not self.expires_at:
            return False
        try:
            expiry = datetime.fromisoformat(self.expires_at.replace("Z", "+00:00"))
            return datetime.now(timezone.utc) >= expiry
        except ValueError:
            return False

    @property
    def days_until_expiry(self) -> Optional[int]:
        """Get days until license expires."""
        if not self.expires_at:
            return None
        try:
            expiry = datetime.fromisoformat(self.expires_at.replace("Z", "+00:00"))
            delta = expiry - datetime.now(timezone.utc)
            return max(0, delta.days)
        except ValueError:
            return None

    @property
    def is_premium(self) -> bool:
        """Check if license is premium tier."""
        return self.tier.lower() in ("pro", "enterprise", "unlimited")

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> LicenseData:
        """Deserialize from dictionary."""
        return cls(
            license_key=data.get("license_key", ""),
            tenant_id=data.get("tenant_id", ""),
            tier=data.get("tier", "free"),
            features=data.get("features", []),
            rate_limit=data.get("rate_limit", 60),
            max_payload_size=data.get("max_payload_size", 1048576),
            retention_days=data.get("retention_days", 30),
            expires_at=data.get("expires_at"),
            activated_at=data.get("activated_at", datetime.now(timezone.utc).isoformat()),
            last_validated=data.get("last_validated", datetime.now(timezone.utc).isoformat()),
        )


class LicenseManager:
    """
    Manager for local license storage and validation.

    Stores license at ~/.mekong/license.json
    """

    LICENSE_FILE = "license.json"

    def __init__(self, config_dir: Optional[Path] = None):
        self.config_dir = config_dir or Path.home() / ".mekong"
        self.license_path = self.config_dir / self.LICENSE_FILE
        self._cache: Optional[LicenseData] = None
        self._storage = get_secure_storage()

    def _ensure_config_dir(self) -> None:
        """Ensure config directory exists."""
        self.config_dir.mkdir(parents=True, exist_ok=True)

    def save_license(self, license_data: LicenseData) -> bool:
        """
        Save license to secure storage.

        Args:
            license_data: Validated license data

        Returns:
            True if save successful
        """
        try:
            self._ensure_config_dir()

            # Encrypt sensitive data
            data = license_data.to_dict()

            # Encrypt license key
            if license_data.license_key:
                encrypted_key = self._storage.encrypt(license_data.license_key)
                data["license_key"] = encrypted_key

            # Save to file
            with open(self.license_path, "w") as f:
                json.dump(data, f, indent=2)

            # Update cache
            self._cache = license_data

            return True

        except Exception:
            return False

    def get_license(self) -> Optional[LicenseData]:
        """
        Get current license data.

        Returns:
            LicenseData if exists, None otherwise
        """
        # Return cached if available
        if self._cache:
            return self._cache

        # Load from file
        if not self.license_path.exists():
            return None

        try:
            with open(self.license_path, "r") as f:
                data = json.load(f)

            # Decrypt license key
            encrypted_key = data.get("license_key", "")
            try:
                decrypted_key = self._storage.decrypt(encrypted_key)
            except Exception:
                # Fallback: use as-is (might not be encrypted in old format)
                decrypted_key = encrypted_key

            data["license_key"] = decrypted_key
            self._cache = LicenseData.from_dict(data)
            return self._cache

        except Exception:
            return None

    def is_valid(self) -> bool:
        """
        Check if license is valid.

        Returns:
            True if license exists and not expired
        """
        license_data = self.get_license()
        if not license_data:
            return False
        if license_data.is_expired:
            return False
        return True

    def get_tier(self) -> str:
        """
        Get license tier.

        Returns:
            Tier name (free, pro, enterprise, unlimited)
        """
        license_data = self.get_license()
        if not license_data:
            return "free"
        return license_data.tier.lower()

    def get_features(self) -> List[str]:
        """
        Get enabled features for license.

        Returns:
            List of feature names
        """
        license_data = self.get_license()
        if not license_data:
            return []
        return license_data.features

    def has_feature(self, feature: str) -> bool:
        """
        Check if feature is enabled.

        Args:
            feature: Feature name to check

        Returns:
            True if feature is enabled
        """
        features = self.get_features()
        if not features:
            # Default features for all tiers
            default_features = ["cli:basic", "cli:cook"]
            return feature in default_features
        return feature in features

    def get_rate_limit(self) -> int:
        """
        Get rate limit for license.

        Returns:
            Rate limit in requests per minute
        """
        license_data = self.get_license()
        if not license_data:
            return 60  # Default free tier limit
        return license_data.rate_limit

    def clear_license(self) -> bool:
        """
        Clear stored license.

        Returns:
            True if clear successful
        """
        try:
            if self.license_path.exists():
                self.license_path.unlink()
            self._cache = None
            return True
        except Exception:
            return False

    def update_validation_timestamp(self) -> bool:
        """
        Update last validated timestamp.

        Returns:
            True if update successful
        """
        license_data = self.get_license()
        if not license_data:
            return False

        license_data.last_validated = datetime.now(timezone.utc).isoformat()
        return self.save_license(license_data)


# Global instance
_license_manager: Optional[LicenseManager] = None


def get_license_manager() -> LicenseManager:
    """Get global license manager instance."""
    global _license_manager
    if _license_manager is None:
        _license_manager = LicenseManager()
    return _license_manager


def get_license_tier() -> str:
    """Get current license tier."""
    return get_license_manager().get_tier()


def is_license_valid() -> bool:
    """Check if license is valid."""
    return get_license_manager().is_valid()


def has_feature(feature: str) -> bool:
    """Check if feature is enabled."""
    return get_license_manager().has_feature(feature)
