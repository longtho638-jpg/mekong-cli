"""
Rate Limiting Middleware (Proxy)
===============================

This file is now a proxy for the modularized version in ./rate_limit/
Please import from backend.api.middleware.rate_limit instead.
"""
import warnings

from .rate_limit import limiter, rate_limit, setup_rate_limit_routes, setup_rate_limiting

# Issue a deprecation warning
warnings.warn(
    "backend.api.middleware.rate_limiting is deprecated. "
    "Use backend.api.middleware.rate_limit instead.",
    DeprecationWarning,
    stacklevel=2
)

# Export for backward compatibility
__all__ = ["limiter", "rate_limit", "setup_rate_limiting", "setup_rate_limit_routes"]
