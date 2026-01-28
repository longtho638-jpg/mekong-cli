from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from backend.services.cache import cache_factory
from backend.services.cache.invalidation import CacheInvalidator
from backend.services.cache.query_cache import QueryCache


@pytest.mark.asyncio
async def test_full_cache_lifecycle():
    # Clear factory state
    cache_factory._instances.clear()

    # 1. Setup Mock Redis
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None # Cache miss initially
    mock_redis.delete.return_value = 1

    # Setup Pipeline for invalidation
    pipeline = MagicMock()
    pipeline.sadd = MagicMock()
    pipeline.expire = MagicMock()
    pipeline.execute = AsyncMock()
    mock_redis.pipeline.return_value = pipeline

    # Patch the CLASS attribute
    with patch.object(cache_factory.__class__, '_redis_client', mock_redis):

        # 2. Get Services
        query_cache = await cache_factory.get_query_cache()
        invalidator = await cache_factory.get_invalidator()



        # 3. Simulate Query Cache Miss & Set
        async def db_fetch():
            return {"user": "john_doe", "id": 123}

        result = await query_cache.cached_query(
            "user:123",
            db_fetch,
            tags=["user:123"]
        )

        assert result["user"] == "john_doe"
        # Verify it tried to get from cache
        mock_redis.get.assert_called()
        # Verify it set to cache
        mock_redis.set.assert_called()

        # 4. Simulate Tag Invalidation
        # Mock smembers to return our key
        mock_redis.smembers.return_value = [b"query:user:123"]

        await invalidator.invalidate_tags(["user:123"])

        # Verify delete called
        assert mock_redis.delete.call_count >= 1

@pytest.mark.asyncio
async def test_metrics_tracking():
    # Clear factory state
    cache_factory._instances.clear()

    # Reset metrics
    metrics = cache_factory.get_metrics()
    metrics.reset()

    # Perform operation
    mock_redis = AsyncMock()
    mock_redis.get.return_value = b'{"val": 1}'

    with patch.object(cache_factory.__class__, '_redis_client', mock_redis):
        query_cache = await cache_factory.get_query_cache()
        await query_cache.get("test_key")

    # Check metrics
    assert metrics.hits == 1
    assert metrics.ops_count["get"] == 1
