import redis.asyncio as redis
from typing import Tuple, Dict, List, Optional
import os
import time

from backend.services.sliding_window_limiter import SlidingWindowLimiter
from backend.services.token_bucket_limiter import TokenBucketLimiter
from backend.services.fixed_window_limiter import FixedWindowLimiter
from backend.core.infrastructure.redis import redis_client as default_redis_client

class RateLimiterService:
    """
    Service facade for different rate limiting algorithms.
    """
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        # Use provided client or default global client
        # Note: In a real app we might inject this dependency
        # For now we assume a redis_client is available or we create one
        if redis_client:
            self.redis = redis_client
        else:
            # Fallback to creating a client if global one not available/ready
            # Or use the one from infrastructure if it's imported
            self.redis = default_redis_client or redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

        self.sliding_window = SlidingWindowLimiter(self.redis)
        self.token_bucket = TokenBucketLimiter(self.redis)
        self.fixed_window = FixedWindowLimiter(self.redis)

    async def check_sliding_window(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
        return await self.sliding_window.check_rate_limit(key, limit, window_seconds)

    async def check_token_bucket(self, key: str, capacity: int, refill_rate: float) -> Tuple[bool, int]:
        return await self.token_bucket.check_rate_limit(key, capacity, refill_rate)

    async def check_fixed_window(self, key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
        return await self.fixed_window.check_rate_limit(key, limit, window_seconds)

    async def get_reset_time(self, key: str, algorithm: str, window_seconds: int = 3600, refill_rate: float = 1.0) -> int:
        """
        Get reset time based on algorithm.
        """
        if algorithm == 'token_bucket':
            return await self.token_bucket.get_reset_time(key, refill_rate)
        elif algorithm == 'fixed_window':
            return await self.fixed_window.get_reset_time(key, window_seconds)
        else:
            return await self.sliding_window.get_reset_time(key, window_seconds)

    async def get_status(self, key: str) -> Dict:
        """
        Get current status for debugging/admin.
        Note: This is an estimation/snapshot.
        """
        # We try to guess what kind of limiter it is by checking keys
        # Or we return raw data for all potential keys

        # Check Sliding Window (ZSET)
        zcard = await self.redis.zcard(key)

        # Check Token Bucket (HASH)
        bucket_key = f"rate_limit:bucket:{key}"
        bucket_data = await self.redis.hgetall(bucket_key)

        # Check Fixed Window keys (would need to know window to check exact key)
        # We can scan for them
        fixed_pattern = f"rate_limit:fixed:{key}:*"
        fixed_keys = await self.redis.keys(fixed_pattern)

        return {
            "key": key,
            "sliding_window_count": zcard,
            "token_bucket": bucket_data,
            "fixed_window_keys_count": len(fixed_keys)
        }

    async def reset(self, key: str):
        """
        Reset limits for a key.
        """
        # Delete sliding window key
        await self.redis.delete(key)

        # Delete token bucket key
        await self.redis.delete(f"rate_limit:bucket:{key}")

        # Delete fixed window keys
        # Ideally we shouldn't use keys() in prod, but for admin reset specific user it might be okay
        # Or we just calculate the current window key
        # Better: use SCAN
        async for k in self.redis.scan_iter(match=f"rate_limit:fixed:{key}:*"):
            await self.redis.delete(k)

    async def get_top_limited_users(self, limit: int = 10) -> List[Dict]:
        """
        This would require tracking violations in a sorted set.
        For now returning placeholder.
        """
        # Implementation depends on if we are logging violations to Redis
        return []
