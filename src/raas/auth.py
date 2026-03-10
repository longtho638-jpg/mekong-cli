"""FastAPI auth middleware for RaaS multi-tenant request isolation."""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from fastapi import HTTPException, Request
from pydantic import BaseModel

from src.raas.tenant import Tenant, TenantStore


# Module-level singleton so the connection pool is shared across requests.
_store = TenantStore()


class TenantContext(BaseModel):
    """Validated tenant identity attached to every authenticated request.

    Attributes:
        tenant_id: UUID4 identifier of the resolved tenant.
        tenant_name: Human-readable label of the tenant.
        api_key: Plaintext ``mk_``-prefixed key that was presented in the request.
    """

    tenant_id: str
    tenant_name: str
    api_key: str


@lru_cache(maxsize=256)
def _cached_lookup(api_key: str) -> Optional[Tenant]:
    """LRU-cached wrapper around :meth:`TenantStore.get_by_api_key`.

    Caching avoids repeated SQLite round-trips for the same active key
    within a process lifetime.  The cache is invalidated automatically when
    the process restarts (e.g. after a deploy or ``deactivate_tenant`` call).

    Args:
        api_key: Plaintext ``mk_``-prefixed key to resolve.

    Returns:
        Matching :class:`Tenant` or ``None`` if not found.
    """
    return _store.get_by_api_key(api_key)


def get_tenant_context(request: Request) -> TenantContext:
    """FastAPI dependency that resolves the caller's tenant from the request.

    Extracts the ``Authorization: Bearer mk_xxx`` header, looks up the
    matching tenant in the :class:`TenantStore` (with LRU cache), and
    returns a :class:`TenantContext` ready for use in route handlers.

    Args:
        request: Incoming FastAPI :class:`~fastapi.Request`.

    Returns:
        Populated :class:`TenantContext` for the authenticated tenant.

    Raises:
        HTTPException 401: Missing or malformed ``Authorization`` header,
            or unknown API key.
        HTTPException 403: Key is valid but the tenant has been deactivated.
    """
    auth_header: Optional[str] = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: Bearer mk_<key>",
        )

    api_key = auth_header.removeprefix("Bearer ").strip()

    if not api_key.startswith("mk_"):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key format. Keys must begin with 'mk_'.",
        )

    try:
        tenant = _cached_lookup(api_key)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Tenant store error: {exc}",
        ) from exc

    if tenant is None:
        raise HTTPException(status_code=401, detail="Unknown API key.")

    if not tenant.is_active:
        raise HTTPException(status_code=403, detail="Tenant account is deactivated.")

    return TenantContext(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        api_key=api_key,
    )
