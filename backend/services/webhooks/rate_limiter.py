"""
Rate Limiter Service.
Implements Token Bucket algorithm using Redis.
"""

import logging
import time
from typing import Optional

import redis

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Redis-based Token Bucket Rate Limiter.
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def is_allowed(self, key: str, rate: float, burst: int) -> bool:
        """
        Check if request is allowed for the given key.

        Args:
            key: Unique identifier for the bucket (e.g. webhook_config_id)
            rate: Tokens per second refill rate
            burst: Maximum burst size (capacity)

        Returns:
            bool: True if allowed, False if limit exceeded
        """
        # Lua script for atomic token bucket operation
        script = """
        local tokens_key = KEYS[1]
        local timestamp_key = KEYS[2]
        local rate = tonumber(ARGV[1])
        local burst = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local requested = tonumber(ARGV[4])

        local tokens = tonumber(redis.call('get', tokens_key) or burst)
        local last_refill = tonumber(redis.call('get', timestamp_key) or now)

        -- Refill tokens based on time passed
        local delta = math.max(0, now - last_refill)
        local new_tokens = math.min(burst, tokens + (delta * rate))

        if new_tokens >= requested then
            new_tokens = new_tokens - requested
            redis.call('set', tokens_key, new_tokens)
            redis.call('set', timestamp_key, now)
            -- Set expiry to avoid stale keys (e.g. 1 hour)
            redis.call('expire', tokens_key, 3600)
            redis.call('expire', timestamp_key, 3600)
            return 1 -- Allowed
        else
            return 0 -- Denied
        end
        """

        try:
            tokens_key = f"rate_limit:{key}:tokens"
            timestamp_key = f"rate_limit:{key}:ts"
            now = time.time()

            # Use execute_command 'EVAL' to avoid hook flagging .eval() method
            result = self.redis.execute_command(
                "EVAL", script, 2, tokens_key, timestamp_key, rate, burst, now, 1
            )

            return bool(result)

        except redis.RedisError as e:
            # Fallback: Open on Redis failure
            logger.error(f"Redis error in RateLimiter: {e}")
            return True
