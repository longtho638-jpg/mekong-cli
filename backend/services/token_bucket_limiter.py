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

        # Get current tokens and last refill time
        pipeline = self.redis.pipeline()
        pipeline.hget(bucket_key, 'tokens')
        pipeline.hget(bucket_key, 'last_refill')
        results = await pipeline.execute()

        tokens_raw = results[0]
        last_refill_raw = results[1]

        tokens = float(tokens_raw) if tokens_raw is not None else float(capacity)
        last_refill = float(last_refill_raw) if last_refill_raw is not None else now

        # Refill tokens based on time elapsed
        elapsed = now - last_refill
        # Calculate new tokens, capped at capacity
        tokens = min(float(capacity), tokens + elapsed * refill_rate)

        if tokens >= 1.0:
            # Consume 1 token
            tokens -= 1.0

            pipeline = self.redis.pipeline()
            pipeline.hset(bucket_key, 'tokens', tokens)
            pipeline.hset(bucket_key, 'last_refill', now)
            # Expire after bucket would be full + buffer
            # Time to full = (capacity - tokens) / refill_rate
            # But let's just use a safe margin like capacity / refill_rate * 2
            expire_seconds = int((capacity / refill_rate) * 2) if refill_rate > 0 else 3600
            pipeline.expire(bucket_key, max(60, expire_seconds))
            await pipeline.execute()

            return True, int(tokens)
        else:
            # No tokens available
            return False, 0

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
