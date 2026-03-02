"""
RaaS API — JWT Bearer auth middleware: extracts and validates tenant identity.

Provides FastAPI dependency `require_tenant` that reads Authorization header,
verifies the Bearer token (mk_ prefix via TenantStore), and returns TenantContext.
Falls back to a lightweight JWT decode path when RAAS_JWT_SECRET is set.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import HTTPException, Request

from src.raas.auth import TenantContext, get_tenant_context


def require_tenant(request: Request) -> TenantContext:
    """FastAPI dependency — validates Bearer token and returns TenantContext.

    Delegates to :func:`src.raas.auth.get_tenant_context` which resolves
    ``mk_``-prefixed API keys via TenantStore (with LRU cache).

    Optionally, if ``RAAS_JWT_SECRET`` is set in the environment, also
    accepts a signed JWT whose ``sub`` claim is used as tenant_id (useful
    for machine-to-machine tokens that don't use ``mk_`` keys).

    Args:
        request: Incoming FastAPI request.

    Returns:
        Populated :class:`TenantContext`.

    Raises:
        HTTPException 401: Missing/invalid Authorization header or unknown key.
        HTTPException 403: Tenant is deactivated.
    """
    auth_header: Optional[str] = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Expected: Bearer <token>",
        )

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Malformed Authorization header. Expected: Bearer <token>",
        )

    token = auth_header.removeprefix("Bearer ").strip()

    # Path 1: mk_-prefixed API key — delegate to existing TenantStore auth
    if token.startswith("mk_"):
        return get_tenant_context(request)

    # Path 2: JWT token — decode when RAAS_JWT_SECRET is configured
    jwt_secret = os.environ.get("RAAS_JWT_SECRET", "")
    if jwt_secret:
        return _verify_jwt_token(token, jwt_secret)

    # No valid auth path matched
    raise HTTPException(
        status_code=401,
        detail="Invalid token format. Use 'mk_<key>' API key or a signed JWT.",
    )


def _verify_jwt_token(token: str, secret: str) -> TenantContext:
    """Decode and verify a HS256 JWT, returning TenantContext from claims.

    Args:
        token: Raw JWT string.
        secret: HMAC secret for signature verification.

    Returns:
        :class:`TenantContext` populated from JWT claims.

    Raises:
        HTTPException 401: Invalid signature, expired token, or missing claims.
    """
    try:
        import base64
        import hashlib
        import hmac
        import json
        import time

        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=401, detail="Malformed JWT structure.")

        header_b64, payload_b64, sig_b64 = parts

        # Verify signature (HS256)
        signing_input = f"{header_b64}.{payload_b64}".encode()
        expected_sig = hmac.new(
            secret.encode(), signing_input, hashlib.sha256
        ).digest()
        # Pad base64url to standard base64
        def _b64_decode(s: str) -> bytes:
            s += "=" * (-len(s) % 4)
            return base64.urlsafe_b64decode(s)

        provided_sig = _b64_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            raise HTTPException(status_code=401, detail="Invalid JWT signature.")

        payload: dict = json.loads(_b64_decode(payload_b64))

        # Check expiry
        exp = payload.get("exp")
        if exp and time.time() > exp:
            raise HTTPException(status_code=401, detail="JWT token has expired.")

        tenant_id: Optional[str] = payload.get("sub") or payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(
                status_code=401, detail="JWT missing 'sub' or 'tenant_id' claim."
            )

        tenant_name: str = payload.get("tenant_name", tenant_id)

        return TenantContext(
            tenant_id=tenant_id,
            tenant_name=tenant_name,
            api_key=token,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=401, detail=f"JWT decode error: {exc}"
        ) from exc


__all__ = ["require_tenant"]
