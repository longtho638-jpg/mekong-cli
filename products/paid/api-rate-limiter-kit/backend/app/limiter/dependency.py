from typing import Callable, Optional, Type
from fastapi import Request, Response, HTTPException
from app.main import redis_client
from app.limiter.core import (
    BaseRateLimiter,
    FixedWindowLimiter,
    SlidingWindowLimiter,
    RateLimitExceeded
)

# Identify users by IP address
def get_ip_key(request: Request) -> str:
    if request.client:
        return request.client.host
    return "127.0.0.1"

class RateLimiter:
    def __init__(
        self,
        times: int = 10,
        seconds: int = 60,
        strategy: Type[BaseRateLimiter] = FixedWindowLimiter,
        key_func: Callable[[Request], str] = get_ip_key,
        prefix: str = "limiter"
    ):
        self.times = times
        self.seconds = seconds
        self.strategy_class = strategy
        self.key_func = key_func
        self.prefix = prefix
        self.limiter_instance: Optional[BaseRateLimiter] = None

    async def __call__(self, request: Request, response: Response):
        if not redis_client:
            # If Redis is not connected, fail open (allow request) or raise Error
            # For now, let's fail open but log it
            return

        if not self.limiter_instance:
            self.limiter_instance = self.strategy_class(redis_client)

        identifier = self.key_func(request)
        key = f"{self.prefix}:{identifier}"

        allowed, metadata = await self.limiter_instance.is_allowed(
            key, self.times, self.seconds
        )

        # Set Headers
        response.headers["X-RateLimit-Limit"] = str(metadata["limit"])
        response.headers["X-RateLimit-Remaining"] = str(metadata["remaining"])
        response.headers["X-RateLimit-Reset"] = str(metadata["reset"])

        if not allowed:
            response.headers["Retry-After"] = str(metadata["retry_after"])
            raise HTTPException(
                status_code=429,
                detail="Too Many Requests",
                headers=response.headers
            )
