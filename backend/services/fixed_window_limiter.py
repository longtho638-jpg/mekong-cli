import time
from typing import Tuple
import redis.asyncio as redis

class FixedWindowLimiter:
    """
    Fixed window algorithm: simple counter per time window.

    Example: 1000 requests/hour, window resets every hour on the hour.

    Weakness: Allows up to 2x limit at window boundary (999 at 10:59, 1000 at 11:01).
    Strength: Very efficient (single INCR operation).

    Redis data structure: String (counter)
    Key: rate_limit:fixed:{user_id}:{endpoint}:{window_timestamp}
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
        Check if request is allowed under fixed window.
        """
        now = int(time.time())
        window_start = (now // window_seconds) * window_seconds
        window_key = f"rate_limit:fixed:{key}:{window_start}"

        current_count = await self.redis.incr(window_key)
        if current_count == 1:
            await self.redis.expire(window_key, window_seconds)

        if current_count <= limit:
            return True, limit - current_count
        else:
            return False, 0

    async def get_reset_time(self, key: str, window_seconds: int) -> int:
        """
        Get timestamp when window resets.
        """
        now = int(time.time())
        window_start = (now // window_seconds) * window_seconds
        return window_start + window_seconds
