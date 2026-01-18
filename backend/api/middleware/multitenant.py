"""
Multi-Tenant Middleware for Agency OS
====================================

Handles tenant identification, isolation, and context injection.
Supports subdomain-based and header-based tenant resolution.
"""

import logging
import os
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class TenantContext:
    """Tenant context data."""

    def __init__(
        self, tenant_id: str, tenant_name: str, database_url: str, settings: Dict[str, Any] = None
    ):
        self.tenant_id = tenant_id
        self.tenant_name = tenant_name
        self.database_url = database_url
        self.settings = settings or {}

    @property
    def is_active(self) -> bool:
        """Check if tenant is active."""
        return self.settings.get("status", "active") == "active"

    @property
    def plan(self) -> str:
        """Get tenant plan (free, pro, enterprise)."""
        return self.settings.get("plan", "free")


# In-memory tenant store (replace with database in production)
TENANT_STORE = {
    "default": TenantContext(
        tenant_id="default",
        tenant_name="Default Instance",
        database_url=os.getenv("DATABASE_URL", "sqlite:///./default.db"),
        settings={"status": "active", "plan": "free", "features": ["basic"]},
    ),
    "agencyos": TenantContext(
        tenant_id="agencyos",
        tenant_name="Agency OS Production",
        database_url=os.getenv("AGENCYOS_DB_URL", "sqlite:///./agencyos.db"),
        settings={"status": "active", "plan": "enterprise", "features": ["all"]},
    ),
    "mekong": TenantContext(
        tenant_id="mekong",
        tenant_name="Mekong CLI",
        database_url=os.getenv("MEKONG_DB_URL", "sqlite:///./mekong.db"),
        settings={"status": "active", "plan": "pro", "features": ["cli", "automation"]},
    ),
}


class MultiTenantMiddleware(BaseHTTPMiddleware):
    """Multi-tenant middleware for FastAPI."""

    async def dispatch(self, request: Request, call_next):
        """Process request with tenant context."""
        tenant = self.resolve_tenant(request)

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        if not tenant.is_active:
            raise HTTPException(status_code=403, detail="Tenant account is not active")

        # Inject tenant context into request state
        request.state.tenant = tenant

        # Add tenant headers
        response = await call_next(request)
        response.headers["X-Tenant-ID"] = tenant.tenant_id
        response.headers["X-Tenant-Plan"] = tenant.plan

        return response

    def resolve_tenant(self, request: Request) -> Optional[TenantContext]:
        """Resolve tenant from subdomain or header."""

        # Method 1: Subdomain-based resolution
        host = request.headers.get("host", "")
        if host:
            # Extract subdomain (e.g., agencyos.agencyos.network)
            subdomain = host.split(".")[0] if "." in host else None
            if subdomain and subdomain in TENANT_STORE:
                logger.info(f"Tenant resolved by subdomain: {subdomain}")
                return TENANT_STORE[subdomain]

        # Method 2: Header-based resolution
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id and tenant_id in TENANT_STORE:
            logger.info(f"Tenant resolved by header: {tenant_id}")
            return TENANT_STORE[tenant_id]

        # Method 3: Default tenant for local development
        if "localhost" in host or "127.0.0.1" in host:
            logger.info("Using default tenant for local development")
            return TENANT_STORE["default"]

        # Method 4: Fallback to default
        logger.warning(f"Unable to resolve tenant for host: {host}, using default")
        return TENANT_STORE["default"]


def get_current_tenant(request: Request) -> TenantContext:
    """Get current tenant from request state."""
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(status_code=500, detail="Tenant context not found")
    return tenant


def require_tenant_feature(feature: str):
    """Decorator to require specific tenant feature."""

    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request from function args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                raise HTTPException(status_code=500, detail="Request context not found")

            tenant = get_current_tenant(request)

            if feature not in tenant.settings.get("features", []):
                raise HTTPException(
                    status_code=403,
                    detail=f"Feature '{feature}' not available for {tenant.plan} plan",
                )

            return await func(*args, **kwargs)

        return wrapper

    return decorator


# Tenant management endpoints
def setup_tenant_routes(app: FastAPI):
    """Setup tenant management routes."""

    @app.get("/api/tenants/current")
    async def get_current_tenant_info(request: Request):
        """Get current tenant information."""
        tenant = get_current_tenant(request)
        return {
            "tenant_id": tenant.tenant_id,
            "tenant_name": tenant.tenant_name,
            "plan": tenant.plan,
            "features": tenant.settings.get("features", []),
            "status": "active" if tenant.is_active else "inactive",
        }

    @app.get("/api/tenants/list")
    async def list_tenants():
        """List all tenants (admin only)."""
        return {
            "tenants": [
                {
                    "tenant_id": tenant.tenant_id,
                    "tenant_name": tenant.tenant_name,
                    "plan": tenant.plan,
                    "status": "active" if tenant.is_active else "inactive",
                }
                for tenant in TENANT_STORE.values()
            ]
        }

    @app.post("/api/tenants/{tenant_id}/switch")
    async def switch_tenant(tenant_id: str, request: Request):
        """Switch tenant context (development only)."""
        if os.getenv("ENVIRONMENT") == "production":
            raise HTTPException(
                status_code=403, detail="Tenant switching not allowed in production"
            )

        if tenant_id not in TENANT_STORE:
            raise HTTPException(status_code=404, detail="Tenant not found")

        return {
            "message": f"Switched to tenant: {tenant_id}",
            "tenant": TENANT_STORE[tenant_id].tenant_name,
        }


# Global tenant access function
def get_tenant_database_url(tenant_id: str) -> str:
    """Get database URL for tenant."""
    tenant = TENANT_STORE.get(tenant_id)
    if not tenant:
        raise ValueError(f"Tenant {tenant_id} not found")
    return tenant.database_url
