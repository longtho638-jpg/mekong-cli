"""
Multitenant Middleware (Proxy).
============================

This file is now a proxy for the modularized version in ./multitenant_logic/
Please import from backend.api.middleware.multitenant_logic instead.
"""
import warnings

from .multitenant_logic import (
    TENANT_STORE,
    MultiTenantMiddleware,
    TenantContext,
    get_current_tenant,
    get_tenant_id,
    set_tenant_id,
    setup_tenant_routes,
)

# Issue a deprecation warning
warnings.warn(
    "backend.api.middleware.multitenant is deprecated. "
    "Use backend.api.middleware.multitenant_logic instead.",
    DeprecationWarning,
    stacklevel=2
)

# Export everything for backward compatibility
__all__ = [
    'MultiTenantMiddleware',
    'setup_tenant_routes',
    'get_current_tenant',
    'get_tenant_id',
    'set_tenant_id',
    'TENANT_STORE',
    'TenantContext'
]
