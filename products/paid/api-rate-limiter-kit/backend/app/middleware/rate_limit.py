from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.services.rule_service import RuleService
from app.limiter.core import FixedWindowLimiter, SlidingWindowLimiter
from app.limiter.dependency import get_ip_key
import time

class DynamicRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client_func):
        super().__init__(app)
        self.redis_client_func = redis_client_func
        # Cache for limiters to avoid recreating objects
        self.limiters = {}

    async def dispatch(self, request: Request, call_next):
        # Skip check for admin APIs or health check to avoid lockout
        if request.url.path.startswith("/api/v1/admin") or request.url.path == "/health" or request.url.path == "/":
            return await call_next(request)

        redis_client = self.redis_client_func()
        if not redis_client:
             return await call_next(request)

        rule_service = RuleService(redis_client)

        # Find matching rule
        rule = await rule_service.find_matching_rule(request.url.path, request.method)

        if rule:
            # Determine Strategy
            strategy_cls = SlidingWindowLimiter if rule.strategy == "sliding" else FixedWindowLimiter

            # Simple caching of strategy instances
            strat_key = rule.strategy
            if strat_key not in self.limiters:
                self.limiters[strat_key] = strategy_cls(redis_client)

            limiter = self.limiters[strat_key]

            # Identify User
            identifier = get_ip_key(request)
            key = f"middleware:{rule.method}:{rule.path}:{identifier}"

            # Check Limit
            allowed, metadata = await limiter.is_allowed(key, rule.limit, rule.window)

            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests", "metadata": metadata},
                    headers={
                        "Retry-After": str(metadata["retry_after"]),
                        "X-RateLimit-Limit": str(metadata["limit"]),
                        "X-RateLimit-Remaining": str(metadata["remaining"]),
                        "X-RateLimit-Reset": str(metadata["reset"]),
                    }
                )

            # Request Allowed
            response = await call_next(request)

            # Add Headers to Response
            response.headers["X-RateLimit-Limit"] = str(metadata["limit"])
            response.headers["X-RateLimit-Remaining"] = str(metadata["remaining"])
            response.headers["X-RateLimit-Reset"] = str(metadata["reset"])

            return response

        # No rule matched, proceed
        return await call_next(request)
