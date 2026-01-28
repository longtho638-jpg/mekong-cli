from unittest.mock import AsyncMock, MagicMock, call

import pytest

from backend.services.cache.invalidation import CacheInvalidator


@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    # Mock pipeline object
    pipeline = MagicMock()
    # Configure pipeline methods to be synchronous/return sync mocks
    pipeline.sadd = MagicMock()
    pipeline.expire = MagicMock()
    # execute is async
    pipeline.execute = AsyncMock()

    # IMPORTANT: pipeline() is synchronous in redis-py, so we must replace the AsyncMock
    # with a MagicMock so it returns the pipeline object immediately without awaiting.
    mock.pipeline = MagicMock(return_value=pipeline)
    return mock

@pytest.fixture
def invalidator(mock_redis):
    return CacheInvalidator(mock_redis, prefix="test")

@pytest.mark.asyncio
async def test_invalidate_key(invalidator, mock_redis):
    mock_redis.delete.return_value = 1

    count = await invalidator.invalidate_key("some_key")

    assert count == 1
    mock_redis.delete.assert_called_once_with("test:some_key")

@pytest.mark.asyncio
async def test_invalidate_tags(invalidator, mock_redis):
    # Setup
    tags = ["user:1", "group:A"]
    # Mock smembers return values
    mock_redis.smembers.side_effect = [
        [b"test:key1", b"test:key2"], # user:1 keys
        [b"test:key3"]               # group:A keys
    ]

    count = await invalidator.invalidate_tags(tags)

    # Should delete keys and tag sets
    assert count == 3 # 2 + 1 keys
    assert mock_redis.delete.call_count == 4 # 2 calls for keys, 2 calls for tag sets

@pytest.mark.asyncio
async def test_add_tags(invalidator, mock_redis):
    pipeline = AsyncMock()
    mock_redis.pipeline.return_value = pipeline

    await invalidator.add_tags("my_key", ["tag1", "tag2"])

    # Check pipeline calls
    assert pipeline.sadd.call_count == 2
    assert pipeline.expire.call_count == 2
    pipeline.execute.assert_called_once()
