"""
Rate Limiting Middleware Facade
"""

import logging

from fastapi import FastAPI
from slowapi.errors import RateLimitExceeded

from .core import DEFAULT_LIMITS, get_tenant_limit, limiter
from .handlers import custom_rate_limit_exceeded_handler
from .middleware import rate_limit, rate_limiter_middleware
from .routes import setup_rate_limit_routes

logger = logging.getLogger(__name__)


def setup_rate_limiting(app: FastAPI):
    """Setup rate limiting for FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)
    app.middleware("http")(rate_limiter_middleware)
    logger.info("Rate limiting configured with tenant-aware limits")


__all__ = [
    "limiter",
    "rate_limit",
    "setup_rate_limiting",
    "setup_rate_limit_routes",
    "get_tenant_limit",
    "DEFAULT_LIMITS",
]
