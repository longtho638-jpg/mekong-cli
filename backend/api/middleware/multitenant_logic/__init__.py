"""
Multitenant Middleware Facade.
"""
from fastapi import Request, Response

from .context import get_tenant_id, set_tenant_id
from .resolver import resolve_tenant_id


async def multitenant_middleware(request: Request, call_next):
    tenant_id = resolve_tenant_id(request)
    set_tenant_id(tenant_id)
    response = await call_next(request)
    response.headers["X-Tenant-ID"] = tenant_id
    return response

__all__ = ['multitenant_middleware', 'get_tenant_id', 'set_tenant_id']
