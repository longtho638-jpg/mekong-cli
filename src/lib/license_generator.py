"""
License Key Generator — ROIaaS Phase 3

Generates and validates license keys with HMAC signature.
Format: raas-[tier]-[uuid]-[signature]

Tiers: free, trial, pro, enterprise

Phase 3: Uses PostgreSQL for revocation checks instead of JSON files.
"""

import hmac
import hashlib
import uuid
import base64
import os
from typing import Optional, Tuple
from datetime import datetime, timedelta

from src.db.repository import get_repository


class LicenseKeyGenerator:
    """Generate and validate signed license keys."""

    def __init__(self, secret_key: Optional[str] = None) -> None:
        """
        Initialize generator with secret key.

        Args:
            secret_key: HMAC secret key. Falls back to LICENSE_SECRET env var.
        """
        self._secret_key = secret_key or os.getenv("LICENSE_SECRET", "dev-secret-key")
        if self._secret_key == "dev-secret-key":
            print("⚠️  WARNING: Using dev secret key. Set LICENSE_SECRET env var in production.")

    def generate_key(self, tier: str, email: str, days: Optional[int] = None) -> str:
        """
        Generate a new license key.

        Args:
            tier: License tier (free, trial, pro, enterprise)
            email: User email for identification
            days: Optional expiry in days (for trial)

        Returns:
            License key: raas-[tier]-[key_id]-[signature]
        """
        if tier not in {"free", "trial", "pro", "enterprise"}:
            raise ValueError(f"Invalid tier: {tier}")

        # Generate unique ID
        key_id = str(uuid.uuid4())[:8]

        # Create payload to sign
        payload = f"{tier}:{email}:{key_id}"
        if days:
            expiry = (datetime.utcnow() + timedelta(days=days)).isoformat()
            payload += f":{expiry}"

        # Sign with HMAC
        signature = self._sign(payload)

        # Format: raas-[tier]-[key_id]-[signature_base64]
        key = f"raas-{tier}-{key_id}-{signature}"
        return key

    def validate_key(self, key: str) -> Tuple[bool, Optional[dict], str]:
        """
        Validate a license key.

        Args:
            key: License key to validate

        Returns:
            Tuple of (is_valid, license_info, error_message)
        """
        # Parse key: raas-[tier]-[key_id]-[signature]
        # Signature may contain dashes, so we split into max 4 parts
        parts = key.split("-", 3)  # Split into max 4 parts
        if len(parts) < 4:
            return False, None, "Invalid format: expected raas-[tier]-[id]-[signature]"

        if parts[0] != "raas":
            return False, None, "Invalid prefix: must start with 'raas-'"

        tier = parts[1]
        if tier not in {"free", "trial", "pro", "enterprise"}:
            return False, None, f"Invalid tier: {tier}"

        key_id = parts[2]
        signature = parts[3]  # Rest of the string is signature

        # Verify signature format (base64url)
        try:
            # Decode and verify signature format
            base64.urlsafe_b64decode(signature + "=" * (4 - len(signature) % 4))
        except Exception:
            return False, None, "Invalid signature format"

        # Check revocation from PostgreSQL
        # Note: This needs async, but validate_key is sync
        # The async validate_license in raas_gate.py handles revocation

        # Build license info
        license_info = {
            "tier": tier,
            "key_id": key_id,
            "is_valid": True,
        }

        return True, license_info, ""

    async def is_revoked(self, key_id: str) -> bool:
        """Check if a key is revoked (async PostgreSQL check)."""
        try:
            repo = get_repository()
            return await repo.is_revoked(key_id)
        except Exception:
            return False

    def _sign(self, payload: str) -> str:
        """Create HMAC signature for payload."""
        signature = hmac.new(
            self._secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).digest()
        return base64.urlsafe_b64encode(signature).decode().rstrip("=")

    def verify_signature(self, key: str, email: str) -> bool:
        """
        Verify key signature with email.

        Args:
            key: License key
            email: User email to verify against

        Returns:
            True if signature matches
        """
        parts = key.split("-", 3)
        if len(parts) < 4:
            return False

        tier = parts[1]
        key_id = parts[2]
        provided_signature = parts[3]

        # Reconstruct payload
        payload = f"{tier}:{email}:{key_id}"
        expected_signature = self._sign(payload)

        return hmac.compare_digest(provided_signature, expected_signature)


# Tier limits configuration
TIER_LIMITS = {
    "free": {"commands_per_day": 10, "max_days": None},
    "trial": {"commands_per_day": 50, "max_days": 7},
    "pro": {"commands_per_day": 1000, "max_days": None},
    "enterprise": {"commands_per_day": -1, "max_days": None},  # -1 = unlimited
}


def get_tier_limits(tier: str) -> dict:
    """Get usage limits for a tier."""
    return TIER_LIMITS.get(tier, TIER_LIMITS["free"])


# Global instance
_generator: Optional[LicenseKeyGenerator] = None


def get_generator() -> LicenseKeyGenerator:
    """Get global generator instance."""
    global _generator
    if _generator is None:
        _generator = LicenseKeyGenerator()
    return _generator


def generate_license(tier: str, email: str, days: Optional[int] = None) -> str:
    """Generate a new license key."""
    return get_generator().generate_key(tier, email, days)


def validate_license(key: str) -> Tuple[bool, Optional[dict], str]:
    """Validate a license key."""
    return get_generator().validate_key(key)


async def check_revocation(key_id: str) -> bool:
    """Check if a key is revoked (async)."""
    return await get_generator().is_revoked(key_id)


__all__ = [
    "LicenseKeyGenerator",
    "get_generator",
    "generate_license",
    "validate_license",
    "get_tier_limits",
    "TIER_LIMITS",
    "check_revocation",
]
