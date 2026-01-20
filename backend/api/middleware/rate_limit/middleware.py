"""
Rate limiting middleware and decorators.
"""
from fastapi import Request

from .core import get_tenant_limit, limiter


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
                target_limit = limit or get_tenant_limit(request)
                return limiter.limit(target_limit)(func)(*args, **kwargs)
            else:
                fallback_limit = limit or "60/minute"
                return limiter.limit(fallback_limit)(func)(*args, **kwargs)
        return wrapper
    return decorator

@limiter.limit("60/minute")
async def rate_limiter_middleware(request: Request, call_next):
    """Rate limiting middleware with tenant awareness."""
    tenant_limit = get_tenant_limit(request)
    response = await call_next(request)

    response.headers["X-RateLimit-Limit"] = tenant_limit.split("/")[0]
    response.headers["X-RateLimit-Window"] = tenant_limit.split("/")[1]
    response.headers["X-RateLimit-Policy"] = tenant_limit

    tenant_id = getattr(request.state, "tenant", {"tenant_id": "unknown"}).tenant_id
    response.headers["X-RateLimit-Tenant"] = tenant_id

    return response
