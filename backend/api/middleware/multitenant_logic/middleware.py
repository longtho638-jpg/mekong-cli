"""
Multitenant Middleware Class.
"""

import logging
from typing import Callable

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from .context import set_tenant_id
from .models import TENANT_STORE
from .resolver import resolve_tenant_id

logger = logging.getLogger(__name__)


class MultiTenantMiddleware(BaseHTTPMiddleware):
    """Multi-tenant middleware for FastAPI."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with tenant context."""
        tenant_id = resolve_tenant_id(request)

        tenant = TENANT_STORE.get(tenant_id) or TENANT_STORE.get("default")

        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")

        if not tenant.is_active:
            raise HTTPException(status_code=403, detail="Tenant account is not active")

        # Set context for the current task
        set_tenant_id(tenant.tenant_id)

        # Inject tenant context into request state for legacy support
        request.state.tenant = tenant

        # Process request
        response = await call_next(request)

        # Add tenant headers
        response.headers["X-Tenant-ID"] = tenant.tenant_id
        response.headers["X-Tenant-Plan"] = tenant.plan

        return response
