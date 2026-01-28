import time
from typing import Tuple

import redis.asyncio as redis


class TokenBucketLimiter:
    """
    Token bucket algorithm: allow bursts up to bucket capacity.

    Example: 100 token capacity, refill 10 tokens/second.
    User can burst 100 requests immediately, then 10/sec sustained.

    Redis data structure: Hash
    Key: rate_limit:bucket:{user_id}:{endpoint}
    Fields: tokens (float), last_refill (timestamp)
    """
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.lua_script = self.redis.register_script("""
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refill_rate = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])
            local cost = tonumber(ARGV[4] or 1)

            local tokens_raw = redis.call('HGET', key, 'tokens')
            local last_refill_raw = redis.call('HGET', key, 'last_refill')

            local tokens = capacity
            local last_refill = now

            if tokens_raw then
                tokens = tonumber(tokens_raw)
            end
            if last_refill_raw then
                last_refill = tonumber(last_refill_raw)
            end

            -- Refill
            local elapsed = now - last_refill
            if elapsed > 0 then
                tokens = math.min(capacity, tokens + (elapsed * refill_rate))
                last_refill = now
            end

            if tokens >= cost then
                tokens = tokens - cost
                redis.call('HSET', key, 'tokens', tokens, 'last_refill', last_refill)
                -- Expire after suitable time (e.g. time to full + buffer)
                -- default 1 hour if refill_rate is 0 or low
                redis.call('EXPIRE', key, 3600)
                return {1, tokens}
            else
                return {0, 0}
            end
        """)

    async def check_rate_limit(
        self,
        key: str,
        capacity: int,
        refill_rate: float,  # tokens per second
    ) -> Tuple[bool, int]:
        """
        Check if request is allowed under token bucket.

        Args:
            key: Unique identifier
            capacity: Max tokens in bucket
            refill_rate: Tokens added per second

        Returns:
            (allowed: bool, remaining_tokens: int)
        """
        now = time.time()
        bucket_key = f"rate_limit:bucket:{key}"

        try:
            # keys=[bucket_key], args=[capacity, refill_rate, now, cost=1]
            result = await self.lua_script(keys=[bucket_key], args=[capacity, refill_rate, now, 1])
            allowed = bool(result[0])
            remaining = int(float(result[1])) # Lua returns numbers which might be float for tokens
            return allowed, remaining
        except Exception as e:
            # Propagate error to service wrapper
            raise e


    async def get_reset_time(self, key: str, refill_rate: float) -> int:
        """
        Get timestamp when 1 token will be available.
        """
        bucket_key = f"rate_limit:bucket:{key}"
        tokens_raw = await self.redis.hget(bucket_key, 'tokens')
        tokens = float(tokens_raw) if tokens_raw is not None else 0.0

        if tokens >= 1.0:
            return int(time.time())
        else:
            # Time to refill 1 token
            if refill_rate <= 0:
                return int(time.time() + 3600) # Fallback
            return int(time.time() + (1.0 - tokens) / refill_rate)
