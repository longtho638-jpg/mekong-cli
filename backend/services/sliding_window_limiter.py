import time
from typing import Optional, Tuple

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
        # Atomically:
        # 1. Remove old entries
        # 2. Count current entries
        # 3. If count < limit, add new entry
        # Returns: [allowed (0/1), remaining_count]
        self.lua_script = self.redis.register_script("""
            local key = KEYS[1]
            local limit = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])
            local unique_id = ARGV[4]

            -- Remove elements older than window
            redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

            -- Count current elements
            local count = redis.call('ZCARD', key)

            if count < limit then
                -- Add new request. Member must be unique to prevent deduplication of requests at same timestamp.
                -- We use 'timestamp:unique_id' as member.
                redis.call('ZADD', key, now, now .. ':' .. unique_id)
                redis.call('EXPIRE', key, window)
                return {1, limit - count - 1}
            else
                return {0, 0}
            end
        """)

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
        import uuid

        unique_id = str(uuid.uuid4())

        # Execute Lua script
        # keys=[key], args=[limit, window, now, unique_id]
        try:
            result = await self.lua_script(keys=[key], args=[limit, window_seconds, now, unique_id])
            allowed = bool(result[0])
            remaining = result[1]
            return allowed, remaining
        except Exception as e:
            # Fallback or error handling
            # If Redis script fails, we might default to blocking or allowing depending on policy.
            # Here we let it bubble up or return False?
            # The service wrapper catches generic exceptions and fails open (allows traffic).
            raise e

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
