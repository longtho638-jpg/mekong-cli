from abc import ABC, abstractmethod
from typing import Tuple, Dict, Any
import time
import uuid
import redis.asyncio as redis
from app.limiter.scripts import FIXED_WINDOW_SCRIPT, SLIDING_WINDOW_SCRIPT

class RateLimitExceeded(Exception):
    def __init__(self, headers: Dict[str, str]):
        self.headers = headers

class BaseRateLimiter(ABC):
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    @abstractmethod
    async def is_allowed(
        self, key: str, limit: int, window: int
    ) -> Tuple[bool, Dict[str, Any]]:
        pass

class FixedWindowLimiter(BaseRateLimiter):
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
        self.script = self.redis.register_script(FIXED_WINDOW_SCRIPT)

    async def is_allowed(
        self, key: str, limit: int, window: int
    ) -> Tuple[bool, Dict[str, Any]]:
        # Run Lua script
        # Returns: {allowed (1/0), current_count, ttl}
        result = await self.script(keys=[key], args=[window, limit])

        allowed = bool(result[0])
        current_count = result[1]
        ttl = result[2]

        metadata = {
            "limit": limit,
            "remaining": max(0, limit - current_count),
            "reset": int(time.time() + (ttl if ttl > 0 else 0)),
            "retry_after": ttl if ttl > 0 else 0
        }

        return allowed, metadata

class SlidingWindowLimiter(BaseRateLimiter):
    def __init__(self, redis_client: redis.Redis):
        super().__init__(redis_client)
        self.script = self.redis.register_script(SLIDING_WINDOW_SCRIPT)

    async def is_allowed(
        self, key: str, limit: int, window: int
    ) -> Tuple[bool, Dict[str, Any]]:
        now = time.time()
        member = f"{now}:{uuid.uuid4()}"

        # Returns: {allowed (1/0), current_count, ttl}
        result = await self.script(keys=[key], args=[now, window, limit, member])

        allowed = bool(result[0])
        current_count = result[1]
        ttl = result[2]

        metadata = {
            "limit": limit,
            "remaining": max(0, limit - current_count),
            "reset": int(now + (ttl if ttl > 0 else 0)),
            "retry_after": ttl if ttl > 0 else 0
        }

        return allowed, metadata
