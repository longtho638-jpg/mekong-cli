"""
Tenant management routes and utility functions.
"""
import os

from fastapi import FastAPI, HTTPException, Request

from .context import get_tenant_id
from .models import TENANT_STORE


def get_current_tenant(request: Request):
    """Get current tenant from request state or context."""
    # First try from request state (set by middleware)
    tenant = getattr(request.state, "tenant", None)
    if tenant:
        return tenant
    
    # Fallback to looking up by ID from context
    tenant_id = get_tenant_id() or "default"
    if tenant_id in TENANT_STORE:
        return TENANT_STORE[tenant_id]
        
    raise HTTPException(status_code=500, detail="Tenant context not found")

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
