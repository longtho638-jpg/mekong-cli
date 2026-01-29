from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.fixed_window_limiter import FixedWindowLimiter
from backend.services.rate_limiter_service import RateLimiterService
from backend.services.sliding_window_limiter import SlidingWindowLimiter
from backend.services.token_bucket_limiter import TokenBucketLimiter


@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    # scan_iter must be a MagicMock (not AsyncMock) because it is not awaited
    mock.scan_iter = MagicMock()

    # Mock pipeline
    pipeline = AsyncMock()
    pipeline.execute = AsyncMock(return_value=[1, 1])  # Default success
    mock.pipeline.return_value = pipeline
    return mock


@pytest.fixture
def service(mock_redis):
    return RateLimiterService(redis_client=mock_redis)


@pytest.mark.asyncio
async def test_sliding_window_allow(service, mock_redis):
    # Mock SlidingWindowLimiter behavior internally or just mock redis commands
    # Sliding window uses: zremrangebyscore, zadd, zcard, expire

    # We'll mock the internal limiters for service test,
    # OR test logic if we implement limiters here.
    # Since RateLimiterService delegates, we can mock the delegates
    # or test integration with mocked redis.

    # Let's mock the delegates to test the service routing logic
    service.sliding_window.check_rate_limit = AsyncMock(return_value=(True, 9))

    allowed, remaining = await service.check_sliding_window("test:key", 10, 60)

    assert allowed is True
    assert remaining == 9
    service.sliding_window.check_rate_limit.assert_called_with("test:key", 10, 60)


@pytest.mark.asyncio
async def test_token_bucket_allow(service):
    service.token_bucket.check_rate_limit = AsyncMock(return_value=(True, 5))

    allowed, remaining = await service.check_token_bucket("test:bucket", 10, 1.0)

    assert allowed is True
    assert remaining == 5
    service.token_bucket.check_rate_limit.assert_called_with("test:bucket", 10, 1.0)


@pytest.mark.asyncio
async def test_fixed_window_allow(service):
    service.fixed_window.check_rate_limit = AsyncMock(return_value=(True, 1))

    allowed, remaining = await service.check_fixed_window("test:fixed", 10, 60)

    assert allowed is True
    assert remaining == 1
    service.fixed_window.check_rate_limit.assert_called_with("test:fixed", 10, 60)


@pytest.mark.asyncio
async def test_get_reset_time_sliding(service):
    service.sliding_window.get_reset_time = AsyncMock(return_value=1234567890)

    reset = await service.get_reset_time("key", "sliding_window", 60)
    assert reset == 1234567890


class AsyncIterator:
    def __init__(self, items):
        self.items = items
        self.idx = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.idx >= len(self.items):
            raise StopAsyncIteration
        item = self.items[self.idx]
        self.idx += 1
        return item


@pytest.mark.asyncio
async def test_reset(service, mock_redis):
    # Mock scan_iter to return an async iterator
    mock_redis.scan_iter.side_effect = lambda match: AsyncIterator(["rate_limit:fixed:key:1"])

    await service.reset("key")

    assert mock_redis.delete.call_count >= 2
