from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.services.cache.metrics import global_metrics
from backend.services.cache.query_cache import QueryCache


@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    # Mock pipeline
    pipeline = AsyncMock()
    mock.pipeline.return_value = pipeline
    pipeline.execute.return_value = [True, True]
    return mock

@pytest.fixture
def query_cache(mock_redis):
    return QueryCache(mock_redis, prefix="test_query")

@pytest.mark.asyncio
async def test_generate_key(query_cache):
    sql = "SELECT * FROM users WHERE id = :id"
    params = {"id": 1}
    key = query_cache.generate_key(sql, params)
    assert key.startswith("sql:")
    assert len(key) > 10

@pytest.mark.asyncio
async def test_get_hit(query_cache, mock_redis):
    mock_redis.get.return_value = b'{"data": "value"}'

    result = await query_cache.get("some_key")

    assert result == {"data": "value"}
    mock_redis.get.assert_called_once()
    assert global_metrics.hits > 0

@pytest.mark.asyncio
async def test_get_miss(query_cache, mock_redis):
    mock_redis.get.return_value = None

    result = await query_cache.get("missing_key")

    assert result is None
    assert global_metrics.misses > 0

@pytest.mark.asyncio
async def test_set(query_cache, mock_redis):
    key = "new_key"
    value = {"id": 1, "name": "Test"}

    success = await query_cache.set(key, value, ttl=60)

    assert success is True
    mock_redis.set.assert_called_once()
    # verify arguments
    call_args = mock_redis.set.call_args
    assert call_args[0][0] == "test_query:new_key"
    assert "id" in call_args[0][1]
    assert call_args[1]['ex'] == 60

@pytest.mark.asyncio
async def test_cached_query_hit(query_cache):
    # Setup cache hit
    query_cache.get = AsyncMock(return_value={"result": "cached"})
    mock_db_func = AsyncMock()

    result = await query_cache.cached_query("key", mock_db_func)

    assert result == {"result": "cached"}
    mock_db_func.assert_not_called()

@pytest.mark.asyncio
async def test_cached_query_miss(query_cache):
    # Setup cache miss
    query_cache.get = AsyncMock(return_value=None)
    query_cache.set = AsyncMock()
    mock_db_func = AsyncMock(return_value={"result": "fresh"})

    result = await query_cache.cached_query("key", mock_db_func, ttl=300)

    assert result == {"result": "fresh"}
    mock_db_func.assert_called_once()
    query_cache.set.assert_called_once_with("key", {"result": "fresh"}, ttl=300, tags=None)
