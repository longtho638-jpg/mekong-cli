"""
Rate Limit Cache
Specialized cache for rate limiting counters and windows.
Optimized for high-speed increment and expiry operations.
"""

import logging
from typing import Optional, Tuple

import redis.asyncio as redis

from backend.services.cache.metrics import MetricsContext, global_metrics

logger = logging.getLogger(__name__)

class RateLimitCache:
    def __init__(self, redis_client: redis.Redis, prefix: str = "ratelimit"):
        self.redis = redis_client
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    async def increment(self, key: str, amount: int = 1, ttl: int = None) -> int:
        """
        Increment a counter.
        If key doesn't exist, it's created with amount.
        If ttl is provided and key is new, set expiry.
        """
        full_key = self._make_key(key)

        with MetricsContext("set"):
            try:
                # Use pipeline for atomicity if setting TTL
                pipe = self.redis.pipeline()
                pipe.incrby(full_key, amount)
                if ttl:
                    pipe.expire(full_key, ttl)

                results = await pipe.execute()
                val = results[0]

                global_metrics.increment_write()
                return val
            except Exception as e:
                logger.error(f"RateLimit increment error {full_key}: {e}")
                global_metrics.increment_error()
                return 0

    async def get_window_stat(self, key: str) -> int:
        """Get current counter value"""
        full_key = self._make_key(key)
        with MetricsContext("get"):
            try:
                val = await self.redis.get(full_key)
                global_metrics.increment_hit() if val else global_metrics.increment_miss()
                return int(val) if val else 0
            except Exception:
                return 0

    async def sliding_window_add(self, key: str, timestamp: float, ttl: int) -> int:
        """
        Add timestamp to sorted set for sliding window.
        Removes old entries.
        Returns count in current window.
        """
        full_key = self._make_key(key)
        window_start = timestamp - ttl

        with MetricsContext("set"):
            try:
                pipe = self.redis.pipeline()
                # Remove old
                pipe.zremrangebyscore(full_key, 0, window_start)
                # Add new
                pipe.zadd(full_key, {str(timestamp): timestamp})
                # Set TTL on the whole key
                pipe.expire(full_key, ttl)
                # Count
                pipe.zcard(full_key)

                results = await pipe.execute()
                count = results[3]

                global_metrics.increment_write()
                return count
            except Exception as e:
                logger.error(f"RateLimit sliding window error {full_key}: {e}")
                global_metrics.increment_error()
                return 0
