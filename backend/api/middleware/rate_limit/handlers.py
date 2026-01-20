"""
Rate limit exceeded exception handlers.
"""
import time

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded


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
