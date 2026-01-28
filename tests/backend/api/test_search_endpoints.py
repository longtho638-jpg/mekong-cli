"""
Unit Tests for Search API Endpoints
===================================
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# 1. Set environment variable to disable rate limiting logic where possible
os.environ["ENABLE_RATE_LIMITING"] = "false"

# 2. Patch Redis Class BEFORE importing app
# This prevents the real Redis client from trying to connect during app initialization
patcher_redis = patch("redis.asyncio.Redis")
MockRedis = patcher_redis.start()
mock_redis_instance = MockRedis.return_value

# Mock async methods of Redis client
mock_redis_instance.ping = AsyncMock(return_value=True)
mock_redis_instance.get = AsyncMock(return_value=None)
mock_redis_instance.set = AsyncMock(return_value=True)
mock_redis_instance.delete = AsyncMock(return_value=True)
mock_redis_instance.zcard = AsyncMock(return_value=0)
mock_redis_instance.hgetall = AsyncMock(return_value={})
mock_redis_instance.keys = AsyncMock(return_value=[])
mock_redis_instance.eval = AsyncMock(return_value=1) # Lua script success
mock_redis_instance.close = AsyncMock(return_value=None)

# Mock pipeline
mock_pipeline = MagicMock()
mock_pipeline.execute = AsyncMock(return_value=[1, 1])
mock_redis_instance.pipeline.return_value = mock_pipeline

# 3. Patch RateLimiterService to completely bypass logic
# This ensures that even if middleware runs, it doesn't hit Redis
patcher_limiter = patch("backend.services.rate_limiter_service.RateLimiterService")
MockRateLimiter = patcher_limiter.start()
mock_limiter_instance = MockRateLimiter.return_value
mock_limiter_instance.check_sliding_window.return_value = (True, 100)
mock_limiter_instance.check_token_bucket.return_value = (True, 100)
mock_limiter_instance.check_fixed_window.return_value = (True, 100)
mock_limiter_instance.get_reset_time.return_value = 0

# 4. Now import app and services
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.services.search.indexer import SearchIndexer, get_search_indexer
from backend.services.search.service import SearchService, get_search_service

client = TestClient(app)

# 5. Mock Search Services
mock_search_service = MagicMock()
mock_search_service.client = MagicMock()
mock_indexer = MagicMock()

def override_get_search_service():
    return mock_search_service

def override_get_search_indexer():
    return mock_indexer

app.dependency_overrides[get_search_service] = override_get_search_service
app.dependency_overrides[get_search_indexer] = override_get_search_indexer

def teardown_module(module):
    patcher_redis.stop()
    patcher_limiter.stop()

def test_search_endpoint_success():
    """Test standard search query."""
    mock_search_service.search.return_value = {
        "results": {"users": [{"id": 1, "name": "John"}]},
        "total": 1,
        "query_time_ms": 10
    }

    response = client.get("/search/?q=John")

    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "users" in data["results"]
    assert data["total"] == 1

    # Verify service called
    mock_search_service.search.assert_called()
    args, kwargs = mock_search_service.search.call_args
    assert kwargs['query'] == "John"
    assert kwargs['limit'] == 20
    assert kwargs['offset'] == 0

def test_search_endpoint_with_params():
    """Test search with filters and specific indexes."""
    mock_search_service.search.return_value = {"results": {}, "total": 0, "query_time_ms": 0}

    client.get("/search/?q=John&indexes=users&filters=role=admin&limit=5")

    mock_search_service.search.assert_called_with(
        query="John",
        indexes=['users'],
        filters="role=admin",
        limit=5,
        offset=0
    )

def test_autocomplete_endpoint():
    """Test autocomplete endpoint."""
    mock_search_service.autocomplete.return_value = ["John Doe", "Johnny"]

    response = client.get("/search/autocomplete?q=Joh&index=users")

    assert response.status_code == 200
    assert response.json() == {"suggestions": ["John Doe", "Johnny"]}

def test_reindex_endpoint():
    """Test reindex endpoint."""
    mock_indexer.create_index.return_value = None

    response = client.post("/search/reindex/users")

    assert response.status_code == 200
    assert response.json()["success"] is True
    mock_indexer.create_index.assert_called_with("users")

def test_reindex_invalid_index():
    """Test reindex with invalid index name."""
    response = client.post("/search/reindex/invalid_index")

    assert response.status_code == 404

def test_index_stats_endpoint():
    """Test index stats endpoint."""
    mock_stats = MagicMock()
    mock_stats.number_of_documents = 100
    mock_stats.is_indexing = False
    mock_stats.field_distribution = {"name": 100}

    # Mock the chain: client.index(index).get_stats()
    mock_index = MagicMock()
    mock_index.get_stats.return_value = mock_stats

    # Setup the mock search service client to return our index mock
    mock_search_service.client.index.return_value = mock_index

    response = client.get("/search/stats/users")

    assert response.status_code == 200
    data = response.json()
    assert data["numberOfDocuments"] == 100
    assert data["isIndexing"] is False
