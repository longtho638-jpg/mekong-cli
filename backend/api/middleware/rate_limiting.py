"""
Rate Limiting Middleware using SlowAPI
====================================

Implements configurable rate limiting for API endpoints.
Supports tenant-specific limits and different limits by plan.
"""

import logging
import time
from typing import TYPE_CHECKING

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

if TYPE_CHECKING:
    from fastapi import FastAPI

from .multitenant import get_current_tenant

logger = logging.getLogger(__name__)

# Initialize rate limiter with memory backend
limiter = Limiter(key_func=get_remote_address)

# Rate limits by tenant plan
PLAN_LIMITS = {
    "free": {
        "default": "100/minute",
        "api": "50/minute",
        "webhooks": "10/minute",
        "code": "20/minute",
    },
    "pro": {
        "default": "500/minute",
        "api": "200/minute",
        "webhooks": "50/minute",
        "code": "100/minute",
    },
    "enterprise": {
        "default": "1000/minute",
        "api": "500/minute",
        "webhooks": "100/minute",
        "code": "200/minute",
    },
}

# Default limits for unauthenticated requests
DEFAULT_LIMITS = {
    "default": "60/minute",
    "health": "100/minute",
    "docs": "30/minute",
    "webhooks": "20/minute",
}


def get_tenant_limit(request: Request) -> str:
    """Get rate limit based on tenant plan."""
    try:
        tenant = get_current_tenant(request)
        plan = tenant.plan

        # Get endpoint category from request path
        path = request.url.path
        category = get_endpoint_category(path)

        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        limit = limits.get(category, limits["default"])

        logger.debug(f"Rate limit for tenant {tenant.tenant_id} ({plan}): {limit}")
        return limit

    except Exception as e:
        # Fallback to default limits
        logger.debug(f"Unable to get tenant limit, using default: {e}")
        path = request.url.path
        category = get_endpoint_category(path)
        return DEFAULT_LIMITS.get(category, DEFAULT_LIMITS["default"])


def get_endpoint_category(path: str) -> str:
    """Categorize endpoint for rate limiting."""
    if "/health" in path or "/metrics" in path:
        return "health"
    elif "/docs" in path or "/openapi" in path:
        return "docs"
    elif "/webhooks" in path:
        return "webhooks"
    elif "/code" in path or "/api" in path:
        return "api"
    else:
        return "default"


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
