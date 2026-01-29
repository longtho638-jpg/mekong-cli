"""
Multitenant Middleware Facade.
"""

from .context import get_tenant_id, set_tenant_id
from .middleware import MultiTenantMiddleware
from .models import TENANT_STORE, TenantContext
from .resolver import resolve_tenant_id
from .router import get_current_tenant, setup_tenant_routes

__all__ = [
    "MultiTenantMiddleware",
    "get_tenant_id",
    "set_tenant_id",
    "get_current_tenant",
    "setup_tenant_routes",
    "TENANT_STORE",
    "TenantContext",
    "resolve_tenant_id",
]
