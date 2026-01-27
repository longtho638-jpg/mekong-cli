import time
from typing import Tuple, Optional
import redis.asyncio as redis

class SlidingWindowLimiter:
    """
    Sliding window algorithm: smooth traffic control.

    Example: 1000 requests/hour = ~16.67 requests/minute smoothed.
    Prevents "double dipping" at window boundaries (unlike fixed window).

    Redis data structure: Sorted Set (ZSET)
    Key: rate_limit:{user_id}:{endpoint}
    Members: request_timestamp (score = timestamp)
    """
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> Tuple[bool, int]:
        """
        Check if request is allowed under sliding window.

        Args:
            key: Unique identifier (user_id:endpoint or ip:endpoint)
            limit: Max requests allowed in window
            window_seconds: Time window in seconds

        Returns:
            (allowed: bool, remaining: int)
        """
        now = time.time()
        window_start = now - window_seconds

        pipeline = self.redis.pipeline()

        # Remove old requests outside window
        pipeline.zremrangebyscore(key, 0, window_start)

        # Count requests in current window
        pipeline.zcard(key)

        results = await pipeline.execute()
        current_count = results[1]

        if current_count < limit:
            # Add current request
            # ZADD key score member
            await self.redis.zadd(key, {str(now): now})
            await self.redis.expire(key, window_seconds)
            return True, limit - current_count - 1
        else:
            # Rate limit exceeded
            return False, 0

    async def get_reset_time(self, key: str, window_seconds: int) -> int:
        """
        Get timestamp when rate limit resets (oldest request + window).
        """
        oldest = await self.redis.zrange(key, 0, 0, withscores=True)
        if oldest:
            # oldest is a list of tuples (member, score)
            oldest_timestamp = oldest[0][1]
            return int(oldest_timestamp + window_seconds)
        return int(time.time() + window_seconds)
