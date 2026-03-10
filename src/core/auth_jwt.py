"""
RaaS Auth JWT - JWT Token Handling

JWT decoding, validation, and tenant extraction.
Note: Edge-side validation only. Full crypto verification happens at gateway.
"""

from __future__ import annotations

import base64
import json
import time
from datetime import datetime, timezone
from typing import Any, Optional

from .auth_types import TenantContext


def decode_jwt(token: str) -> Optional[dict[str, Any]]:
    """
    Decode JWT payload without signature verification.

    Args:
        token: JWT token string

    Returns:
        Decoded payload dictionary or None if invalid

    Note:
        This is for edge-side validation only.
        Full crypto verification happens at gateway.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        # Base64url decode
        payload_b64 = parts[1]

        # Add padding if needed
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += "=" * padding

        payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
        return json.loads(payload_json)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.debug("JWT decode failed: %s", e)
        return None


def validate_jwt_expiry(payload: dict[str, Any]) -> bool:
    """
    Validate JWT expiry timestamp.

    Args:
        payload: Decoded JWT payload

    Returns:
        True if token is not expired, False otherwise
    """
    exp = payload.get("exp")
    if not exp:
        return False
    return exp > time.time()


def extract_tenant_from_jwt(payload: dict[str, Any]) -> TenantContext:
    """
    Extract tenant info from JWT payload.

    Args:
        payload: Decoded JWT payload

    Returns:
        TenantContext extracted from JWT claims

    Note:
        Supabase JWT structure:
        - sub = user UUID
        - app_metadata.tenant_id = tenant identifier
        - app_metadata.role = user role/tier
    """
    tenant_id = (
        payload.get("tenant_id")
        or (payload.get("app_metadata") or {}).get("tenant_id")
        or payload.get("sub")
        or "unknown"
    )

    tier = (
        payload.get("role")
        or (payload.get("app_metadata") or {}).get("role")
        or "free"
    )

    exp = payload.get("exp")

    return TenantContext(
        tenant_id=tenant_id,
        tier=tier,
        role=tier,
        expires_at=datetime.fromtimestamp(exp, tz=timezone.utc) if exp else None,
    )


def validate_jwt_format(token: str) -> tuple[bool, Optional[str], Optional[dict[str, Any]]]:
    """
    Validate JWT format and expiry.

    Args:
        token: JWT token string

    Returns:
        Tuple of (is_valid, error_message, payload)
        - is_valid: True if format and expiry are valid
        - error_message: Error description if invalid, None otherwise
        - payload: Decoded payload if valid, None otherwise
    """
    if "." not in token:
        return False, "Invalid JWT format", None

    payload = decode_jwt(token)
    if not payload:
        return False, "Invalid JWT format", None

    if not validate_jwt_expiry(payload):
        return False, "Token expired", None

    return True, None, payload
