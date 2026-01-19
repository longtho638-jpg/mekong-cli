"""
Rate Limiting Middleware using SlowAPI
====================================

Implements configurable rate limiting for API endpoints.
Supports tenant-specific limits and different limits by plan.
"""

import logging
import time

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from backend.api.config.settings import settings
from backend.api.utils.endpoint_categorization import (
    categorize_endpoint,
    get_rate_limit_key,
    should_skip_rate_limit,
)

from .multitenant import get_current_tenant

logger = logging.getLogger(__name__)

# Initialize rate limiter with memory backend
limiter = Limiter(key_func=get_remote_address)

# Rate limits by tenant plan - USE CONFIG INSTEAD OF HARDCODED VALUES
# This will be replaced by settings.rate_limits_by_plan


def get_plan_limits():
    """Get rate limits from config (replaces hardcoded PLAN_LIMITS)."""
    return settings.rate_limits_by_plan


# Default limits for unauthenticated requests
DEFAULT_LIMITS = {
    "default": "60/minute",
    "health": "100/minute",
    "docs": "30/minute",
    "webhooks": "20/minute",
}


def get_tenant_limit(request: Request) -> str:
    """
    Get rate limit based on tenant plan.

    REFACTORED: Now uses shared categorization and config-based limits.
    """
    try:
        tenant = get_current_tenant(request)
        plan = tenant.plan

        # Get endpoint category using shared utility
        category = categorize_endpoint(request.url.path, request.method)

        # Skip rate limiting for health/docs
        if should_skip_rate_limit(category):
            return "1000/minute"  # Very high limit = effectively no limit

        # Get rate limit key
        rate_key = get_rate_limit_key(category)

        # Get limits from config
        limits = get_plan_limits().get(plan, get_plan_limits()["free"])
        limit = limits.get(rate_key, limits["default"])

        logger.debug(f"Rate limit for tenant {tenant.tenant_id} ({plan}): {limit}")
        return limit

    except Exception as e:
        # Fallback to default limits
        logger.debug(f"Unable to get tenant limit, using default: {e}")
        category = categorize_endpoint(request.url.path, request.method)

        if should_skip_rate_limit(category):
            return "1000/minute"

        rate_key = get_rate_limit_key(category)
        return DEFAULT_LIMITS.get(rate_key, DEFAULT_LIMITS["default"])


def get_endpoint_category(path: str) -> str:
    """
    DEPRECATED: Use categorize_endpoint from utils instead.

    This function is kept for backward compatibility.
    """
    import warnings
    from backend.api.utils.endpoint_categorization import categorize_endpoint

    warnings.warn(
        "get_endpoint_category is deprecated. Use categorize_endpoint from utils instead.",
        DeprecationWarning,
        stacklevel=2
    )

    category = categorize_endpoint(path)
    # Map enum to string for backward compatibility
    return get_rate_limit_key(category)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom rate limit exceeded response."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Rate limit exceeded: {exc.detail}",
            "retry_after": str(exc.detail),
            "limit_info": {
                "limit": exc.detail.split(" ")[0],
                "window": exc.detail.split(" ")[1],
                "tenant": getattr(request.state, "tenant", {"tenant_id": "unknown"}).tenant_id,
                "timestamp": int(time.time()),
            },
        },
        headers={
            "Retry-After": str(exc.detail),
            "X-RateLimit-Limit": str(exc.detail),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": str(int(time.time()) + 60),
        },
    )


# Rate limit decorators
def rate_limit(limit: str = None):
    """Rate limit decorator that respects tenant plans."""

    def decorator(func):
        def wrapper(*args, **kwargs):
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if request:
                # Use tenant-specific limit if not explicitly set
                target_limit = limit or get_tenant_limit(request)
                return limiter.limit(target_limit)(func)(*args, **kwargs)
            else:
                # Fallback to provided limit or default
                fallback_limit = limit or "60/minute"
                return limiter.limit(fallback_limit)(func)(*args, **kwargs)

        return wrapper

    return decorator


# Tenant-aware rate limits
@limiter.limit("60/minute")  # Base limit, will be overridden by get_tenant_limit
async def rate_limiter_middleware(request: Request, call_next):
    """Rate limiting middleware with tenant awareness."""

    # Get appropriate limit for this request
    tenant_limit = get_tenant_limit(request)

    # Check if rate limit would be exceeded
    # SlowAPI will handle the actual limiting

    response = await call_next(request)

    # Add rate limit headers to response
    response.headers["X-RateLimit-Limit"] = tenant_limit.split("/")[0]
    response.headers["X-RateLimit-Window"] = tenant_limit.split("/")[1]
    response.headers["X-RateLimit-Policy"] = tenant_limit

    tenant_id = getattr(request.state, "tenant", {"tenant_id": "unknown"}).tenant_id
    response.headers["X-RateLimit-Tenant"] = tenant_id

    return response


# Rate limiting configuration
def setup_rate_limiting(app: FastAPI):
    """Setup rate limiting for FastAPI app."""

    # Set custom error handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

    # Add middleware
    app.middleware("http")(rate_limiter_middleware)

    logger.info("Rate limiting configured with tenant-aware limits")


# Rate limit monitoring endpoints
def setup_rate_limit_routes(app: FastAPI):
    """Setup rate limit monitoring routes."""

    @app.get("/api/rate-limits/status")
    @rate_limit("30/minute")
    async def get_rate_limit_status(request: Request):
        """Get current rate limit status."""
        try:
            tenant = get_current_tenant(request)
            plan = tenant.plan

            return {
                "tenant_id": tenant.tenant_id,
                "plan": plan,
                "limits": PLAN_LIMITS.get(plan, PLAN_LIMITS["free"]),
                "current_endpoint": request.url.path,
                "current_category": get_endpoint_category(request.url.path),
                "current_limit": get_tenant_limit(request),
            }
        except Exception as e:
            return {
                "error": "Unable to get rate limit status",
                "detail": str(e),
                "fallback_limits": DEFAULT_LIMITS,
            }

    @app.get("/api/rate-limits/plans")
    async def get_plan_limits():
        """Get rate limits for all plans."""
        return {
            "plans": PLAN_LIMITS,
            "default_limits": DEFAULT_LIMITS,
            "description": "Rate limits per request category and tenant plan",
        }


# Export decorators for direct use
__all__ = ["limiter", "rate_limit", "setup_rate_limiting", "setup_rate_limit_routes"]
