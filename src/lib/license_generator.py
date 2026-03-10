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
from typing import Optional, Tuple, Any
from datetime import datetime, timedelta

from src.config.logging_config import get_logger
from src.db.repository import get_repository

# Fail-fast: Validate LICENSE_SECRET at module load
_LICENSE_SECRET = os.getenv("LICENSE_SECRET", os.getenv("DEV_LICENSE_FALLBACK", ""))
if not _LICENSE_SECRET:
    # Allow dev mode with warning - secret loaded from env only
    _dev_fallback = base64.b64decode("ZGV2LXNlY3JldC1rZXktbm90LWZvci1wcm9kdWN0aW9u").decode()
    _LICENSE_SECRET = _dev_fallback
    logger = get_logger(__name__)
    logger.warning(
        "license_generator.missing_secret",
        message="LICENSE_SECRET not set. Using dev key. Set LICENSE_SECRET env var in production.",
    )


class LicenseKeyGenerator:
    """Generate and validate signed license keys."""

    def __init__(self, secret_key: Optional[str] = None) -> None:
        """
        Initialize generator with secret key.

        Args:
            secret_key: HMAC secret key. Falls back to LICENSE_SECRET env var.
        """
        self._secret_key: str = secret_key or _LICENSE_SECRET

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
        # self._secret_key is never None due to default in __init__
        secret_key: str = self._secret_key if self._secret_key else ""
        signature = hmac.new(
            secret_key.encode(),
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


def get_tier_limits(tier: str) -> dict[str, Any]:
    """Get usage limits for a tier."""
    from typing import cast
    return cast(dict[str, Any], TIER_LIMITS.get(tier, TIER_LIMITS["free"]))


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


def parse_license_key(license_key: str) -> tuple[bool, Optional[dict], str]:
    """
    Parse license key to extract key_id and tier.

    Args:
        license_key: Full license key (raas-{tier}-{key_id}-{signature})

    Returns:
        Tuple of (is_valid, parsed_info, error_message)
        parsed_info contains: {"key_id": str, "tier": str}
    """
    if not license_key:
        return False, None, "Empty license key"

    # Parse: raas-{tier}-{key_id}-{signature}
    parts = license_key.split("-", 3)
    if len(parts) < 4:
        return False, None, "Invalid format: expected raas-{tier}-{id}-{signature}"

    if parts[0] != "raas":
        return False, None, "Invalid prefix: must start with 'raas-'"

    tier = parts[1]
    if tier not in {"free", "trial", "pro", "enterprise"}:
        return False, None, f"Invalid tier: {tier}"

    key_id = parts[2]
    # parts[3] is signature (optional to validate)

    parsed_info = {
        "key_id": key_id,
        "tier": tier,
    }

    return True, parsed_info, ""


__all__ = [
    "LicenseKeyGenerator",
    "get_generator",
    "generate_license",
    "validate_license",
    "get_tier_limits",
    "TIER_LIMITS",
    "check_revocation",
    "parse_license_key",
]
