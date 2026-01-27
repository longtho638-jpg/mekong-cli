from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.middleware.cache_middleware import CacheControlMiddleware
from backend.services.cache_service import CacheService, cached

# --- CacheService Tests ---

def test_cache_service_in_memory():
    """Test CacheService using in-memory fallback."""
    # Force in-memory by simulating import error or connection failure
    # Here we just rely on the fact that Redis might not be running in test env,
    # or explicitly instantiate with invalid connection to trigger fallback if logic allows,
    # but the safest is to check if it falls back or just use the class directly.

    # We'll test the InMemoryCache class directly first to ensure logic is sound
    from backend.services.cache_service import InMemoryCache
    cache = InMemoryCache()

    # Test Set/Get
    assert cache.set("test_key", "test_value") is True
    assert cache.get("test_key") == "test_value"

    # Test Delete
    cache.delete("test_key")
    assert cache.get("test_key") is None

    # Test Exists
    cache.set("exist_key", "val")
    assert cache.exists("exist_key") is True
    cache.delete("exist_key")
    assert cache.exists("exist_key") is False

def test_cache_service_ttl():
    """Test TTL expiration in InMemoryCache."""
    import time

    from backend.services.cache_service import InMemoryCache

    cache = InMemoryCache()
    cache.set("ttl_key", "value", ex=1) # 1 second TTL

    assert cache.get("ttl_key") == "value"
    time.sleep(1.1)
    assert cache.get("ttl_key") is None

def test_cache_decorator():
    """Test @cached decorator."""

    # Mock the cache service used by the decorator
    with patch("backend.services.cache_service.CacheService") as MockCacheService:
        mock_instance = MockCacheService.return_value
        mock_instance.get.return_value = None
        mock_instance.set.return_value = True

        # Define a function to cache
        @cached(ttl=60, prefix="test")
        def heavy_computation(x, y):
            return x + y

        # First call - should calculate
        result = heavy_computation(5, 10)
        assert result == 15
        mock_instance.get.assert_called()
        mock_instance.set.assert_called()

        # Test cache hit scenario
        mock_instance.get.return_value = 15
        result_cached = heavy_computation(5, 10)
        assert result_cached == 15

# --- CacheControlMiddleware Tests ---

def test_cache_control_middleware_static():
    """Test Cache-Control headers for static assets."""
    app = FastAPI()
    app.add_middleware(CacheControlMiddleware)

    @app.get("/static/image.png")
    def get_static():
        return {"data": "image"}

    client = TestClient(app)
    response = client.get("/static/image.png")

    assert response.status_code == 200
    assert "public, max-age=31536000, immutable" in response.headers["cache-control"]

def test_cache_control_middleware_api_default():
    """Test default Cache-Control headers for API endpoints."""
    app = FastAPI()
    app.add_middleware(CacheControlMiddleware)

    @app.get("/api/users")
    def get_users():
        return {"users": []}

    client = TestClient(app)
    response = client.get("/api/users")

    assert response.status_code == 200
    assert "no-store" in response.headers["cache-control"]
    assert "must-revalidate" in response.headers["cache-control"]
    assert "Vary" in response.headers

def test_cache_control_middleware_public_api():
    """Test Cache-Control headers for public API endpoints."""
    app = FastAPI()
    app.add_middleware(CacheControlMiddleware)

    @app.get("/api/v1/public/config")
    def get_public_config():
        return {"config": "public"}

    client = TestClient(app)
    response = client.get("/api/v1/public/config")

    assert response.status_code == 200
    assert "public" in response.headers["cache-control"]
    assert "stale-while-revalidate" in response.headers["cache-control"]

def test_cache_control_middleware_skip_existing():
    """Test that middleware respects existing Cache-Control headers."""
    app = FastAPI()
    app.add_middleware(CacheControlMiddleware)

    from fastapi.responses import JSONResponse

    @app.get("/api/custom")
    def get_custom():
        return JSONResponse(
            content={"data": "custom"},
            headers={"Cache-Control": "private, max-age=60"}
        )

    client = TestClient(app)
    response = client.get("/api/custom")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, max-age=60"
