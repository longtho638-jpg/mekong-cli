"""
License Key Validation

Validates BizPlan Generator license keys and returns tier information.
"""

import hashlib
from typing import Optional, Tuple

# Valid license key prefixes and their tiers
# Format: PREFIX-CHECKSUM (e.g., BP-PRO-ABC123)
LICENSE_PREFIXES = {
    "BP-FREE": "free",
    "BP-STARTER": "starter",
    "BP-PRO": "pro",
    "BP-FRANCHISE": "franchise",
    "BP-ENTERPRISE": "enterprise",
}


def validate_license_key(key: Optional[str]) -> Tuple[bool, str, str]:
    """
    Validate a license key and return tier information.

    Args:
        key: License key string (e.g., "BP-PRO-ABC123") or None for free tier.

    Returns:
        Tuple of (is_valid, tier, message)
        - is_valid: True if key is valid or None (free tier)
        - tier: The license tier (free, starter, pro, franchise, enterprise)
        - message: Human-readable message about the validation result
    """
    # No key = free tier (always valid)
    if key is None or key.strip() == "":
        return True, "free", "Using free tier (template-based generation only)"

    key = key.strip().upper()

    # Check for valid prefix
    tier = None
    for prefix, tier_name in LICENSE_PREFIXES.items():
        if key.startswith(prefix):
            tier = tier_name
            break

    if tier is None:
        return False, "free", f"Invalid license key format. Expected format: BP-TIER-XXXXXXXX"

    # For MVP, we just validate the prefix
    # In production, you'd validate the checksum against a database or signing key
    if tier == "free":
        return True, "free", "Using free tier (template-based generation only)"

    return True, tier, f"✓ Valid {tier.upper()} license activated"


def get_tier_from_key(key: Optional[str]) -> str:
    """
    Get the tier from a license key without full validation.

    Args:
        key: License key string or None

    Returns:
        The tier name (defaults to 'free' if invalid)
    """
    is_valid, tier, _ = validate_license_key(key)
    return tier
