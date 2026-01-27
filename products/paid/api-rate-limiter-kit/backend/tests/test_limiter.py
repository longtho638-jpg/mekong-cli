import pytest
import time
import asyncio
from app.limiter.core import FixedWindowLimiter, SlidingWindowLimiter, TokenBucketLimiter

@pytest.mark.asyncio
async def test_fixed_window_limiter(redis_client):
    limiter = FixedWindowLimiter(redis_client)
    key = "test:fixed"
    limit = 5
    window = 1

    # Should allow 5 requests
    for _ in range(limit):
        allowed, meta = await limiter.is_allowed(key, limit, window)
        assert allowed is True
        assert meta["remaining"] >= 0

    # Should block the 6th
    allowed, meta = await limiter.is_allowed(key, limit, window)
    assert allowed is False
    assert meta["remaining"] == 0
    assert meta["retry_after"] > 0

    # Wait for window to expire
    await asyncio.sleep(1.1)

    # Should allow again
    allowed, meta = await limiter.is_allowed(key, limit, window)
    assert allowed is True

@pytest.mark.asyncio
async def test_sliding_window_limiter(redis_client):
    limiter = SlidingWindowLimiter(redis_client)
    key = "test:sliding"
    limit = 5
    window = 2

    # Allow 5
    for _ in range(limit):
        allowed, meta = await limiter.is_allowed(key, limit, window)
        assert allowed is True

    # Block
    allowed, meta = await limiter.is_allowed(key, limit, window)
    assert allowed is False

@pytest.mark.asyncio
async def test_token_bucket_limiter(redis_client):
    limiter = TokenBucketLimiter(redis_client)
    key = "test:bucket"
    limit = 5
    window = 1 # Rate = 5 tokens/sec

    # Allow initial burst (capacity = limit = 5)
    for _ in range(limit):
        allowed, meta = await limiter.is_allowed(key, limit, window)
        assert allowed is True

    # Block immediately after burst
    allowed, meta = await limiter.is_allowed(key, limit, window)
    assert allowed is False

    # Wait for partial refill (0.2s should give 1 token if rate is 5/s)
    await asyncio.sleep(0.3)

    # Should allow 1
    allowed, meta = await limiter.is_allowed(key, limit, window)
    assert allowed is True
