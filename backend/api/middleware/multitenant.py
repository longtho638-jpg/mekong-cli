"""
Multitenant Middleware (Proxy).
============================
This file is now a proxy for the modularized version in ./multitenant_logic/
Please import from backend.api.middleware.multitenant_logic instead.
"""
import warnings

from .multitenant_logic import get_tenant_id, multitenant_middleware, set_tenant_id

# Issue a deprecation warning
warnings.warn(
    "backend.api.middleware.multitenant is deprecated. "
    "Use backend.api.middleware.multitenant_logic instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = ['multitenant_middleware', 'get_tenant_id', 'set_tenant_id']
