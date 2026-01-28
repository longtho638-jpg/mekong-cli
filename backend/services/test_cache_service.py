"""
Tests for cache_service.py

Tests both Redis and in-memory cache implementations.
"""

import json
import time
from unittest.mock import MagicMock, Mock, patch

import pytest
from backend.services.cache_service import CacheService, InMemoryCache, api_cache, cached, session_cache, user_cache


class TestInMemoryCache:
    """Test in-memory cache implementation."""

    def test_set_and_get(self):
        cache = InMemoryCache()
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_nonexistent(self):
        cache = InMemoryCache()
        assert cache.get("nonexistent") is None

    def test_set_with_ttl(self):
        cache = InMemoryCache()
        cache.set("key1", "value1", ex=1)
        assert cache.get("key1") == "value1"

        # Wait for TTL to expire
        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_delete_single(self):
        cache = InMemoryCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        deleted = cache.delete("key1")
        assert deleted == 1
        assert cache.get("key1") is None
        assert cache.get("key2") == "value2"

    def test_delete_multiple(self):
        cache = InMemoryCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        deleted = cache.delete("key1", "key2")
        assert deleted == 2
        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") == "value3"

    def test_delete_nonexistent(self):
        cache = InMemoryCache()
        deleted = cache.delete("nonexistent")
        assert deleted == 0

    def test_exists(self):
        cache = InMemoryCache()
        cache.set("key1", "value1")
        assert cache.exists("key1") is True
        assert cache.exists("nonexistent") is False

    def test_flushdb(self):
        cache = InMemoryCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        cache.flushdb()
        assert cache.get("key1") is None
        assert cache.get("key2") is None


class TestCacheService:
    """Test CacheService with in-memory fallback."""

    @pytest.fixture
    def cache(self):
        """Create cache service instance for testing."""
        # Force in-memory cache for testing
        with patch('cache_service.REDIS_AVAILABLE', False):
            service = CacheService(prefix="test", default_ttl=300)
            yield service
            service.clear_all()

    def test_initialization(self, cache):
        assert cache.prefix == "test"
        assert cache.default_ttl == 300
        assert cache.is_redis_available() is False

    def test_make_key(self, cache):
        assert cache._make_key("user:123") == "test:user:123"
        assert cache._make_key("session") == "test:session"

    def test_set_and_get_string(self, cache):
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_set_and_get_dict(self, cache):
        data = {"name": "John", "age": 30}
        cache.set("user:123", data)
        retrieved = cache.get("user:123")
        assert retrieved == data

    def test_set_and_get_list(self, cache):
        data = [1, 2, 3, 4, 5]
        cache.set("numbers", data)
        retrieved = cache.get("numbers")
        assert retrieved == data

    def test_get_with_default(self, cache):
        assert cache.get("nonexistent") is None
        assert cache.get("nonexistent", default="default") == "default"
        assert cache.get("nonexistent", default={"key": "value"}) == {"key": "value"}

    def test_set_with_custom_ttl(self, cache):
        cache.set("key1", "value1", ttl=1)
        assert cache.get("key1") == "value1"

        time.sleep(1.1)
        assert cache.get("key1") is None

    def test_delete_single(self, cache):
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        deleted = cache.delete("key1")
        assert deleted == 1
        assert cache.get("key1") is None
        assert cache.get("key2") == "value2"

    def test_delete_multiple(self, cache):
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        deleted = cache.delete("key1", "key2")
        assert deleted == 2
        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") == "value3"

    def test_exists(self, cache):
        cache.set("key1", "value1")
        assert cache.exists("key1") is True
        assert cache.exists("nonexistent") is False

    def test_invalidate_pattern(self, cache):
        cache.set("user:1", "data1")
        cache.set("user:2", "data2")
        cache.set("session:abc", "session_data")

        # Invalidate all user keys
        deleted = cache.invalidate_pattern("user:*")
        assert deleted == 2
        assert cache.get("user:1") is None
        assert cache.get("user:2") is None
        assert cache.get("session:abc") == "session_data"

    def test_clear_all(self, cache):
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        assert cache.clear_all() is True
        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") is None

    def test_cache_invalidation_on_update(self, cache):
        """Test cache invalidation pattern."""
        # Simulate caching user data
        user_id = "123"
        cache.set(f"user:{user_id}", {"name": "John", "age": 30})

        # Simulate update
        cache.delete(f"user:{user_id}")

        # Verify cache is cleared
        assert cache.get(f"user:{user_id}") is None

    def test_key_prefix_isolation(self):
        """Test that different service prefixes are isolated."""
        cache1 = CacheService(prefix="service1")
        cache2 = CacheService(prefix="service2")

        cache1.set("key", "value1")
        cache2.set("key", "value2")

        assert cache1.get("key") == "value1"
        assert cache2.get("key") == "value2"

        cache1.clear_all()
        cache2.clear_all()


class TestCachedDecorator:
    """Test @cached decorator."""

    def test_basic_caching(self):
        call_count = 0

        @cached(prefix="test_func", ttl=300)
        def expensive_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2

        # First call - function executed
        result1 = expensive_function(5)
        assert result1 == 10
        assert call_count == 1

        # Second call - cached result
        result2 = expensive_function(5)
        assert result2 == 10
        assert call_count == 1  # Not called again

        # Clear cache
        expensive_function.invalidate()

    def test_cached_with_key_func(self):
        call_count = 0

        @cached(
            key_func=lambda user_id: f"user:{user_id}",
            prefix="user_lookup",
            ttl=300
        )
        def get_user(user_id):
            nonlocal call_count
            call_count += 1
            return {"id": user_id, "name": f"User{user_id}"}

        # First call
        user1 = get_user(123)
        assert user1 == {"id": 123, "name": "User123"}
        assert call_count == 1

        # Second call - cached
        user1_again = get_user(123)
        assert user1_again == user1
        assert call_count == 1

        # Different argument - new call
        user2 = get_user(456)
        assert user2 == {"id": 456, "name": "User456"}
        assert call_count == 2

        # Clear cache
        get_user.invalidate()

    def test_cached_invalidation(self):
        call_count = 0

        @cached(prefix="test_invalidate", ttl=300)
        def my_function(x):
            nonlocal call_count
            call_count += 1
            return x + 1

        # Call and cache
        result1 = my_function(10)
        assert result1 == 11
        assert call_count == 1

        # Call again - cached
        result2 = my_function(10)
        assert result2 == 11
        assert call_count == 1

        # Invalidate cache
        my_function.invalidate()

        # Call again - not cached
        result3 = my_function(10)
        assert result3 == 11
        assert call_count == 2


class TestGlobalCacheInstances:
    """Test global cache instances."""

    def test_api_cache(self):
        api_cache.set("endpoint:/users", {"data": "users"})
        assert api_cache.get("endpoint:/users") == {"data": "users"}
        api_cache.clear_all()

    def test_user_cache(self):
        user_cache.set("user:123", {"name": "John"})
        assert user_cache.get("user:123") == {"name": "John"}
        user_cache.clear_all()

    def test_session_cache(self):
        session_cache.set("session:abc", {"user_id": 123})
        assert session_cache.get("session:abc") == {"user_id": 123}
        session_cache.clear_all()

    def test_cache_instances_isolated(self):
        """Test that global caches are isolated."""
        api_cache.set("key", "api_value")
        user_cache.set("key", "user_value")
        session_cache.set("key", "session_value")

        assert api_cache.get("key") == "api_value"
        assert user_cache.get("key") == "user_value"
        assert session_cache.get("key") == "session_value"

        api_cache.clear_all()
        user_cache.clear_all()
        session_cache.clear_all()


@pytest.mark.skipif(
    not hasattr(pytest, 'redis_available'),
    reason="Redis not available for integration testing"
)
class TestRedisIntegration:
    """Integration tests with real Redis (if available)."""

    @pytest.fixture
    def redis_cache(self):
        """Create Redis cache instance."""
        try:
            cache = CacheService(
                prefix="test_redis",
                host="localhost",
                port=6379,
                db=15  # Use separate DB for testing
            )
            if not cache.is_redis_available():
                pytest.skip("Redis not available")
            yield cache
            cache.clear_all()
        except Exception:
            pytest.skip("Redis connection failed")

    def test_redis_set_get(self, redis_cache):
        redis_cache.set("key1", "value1")
        assert redis_cache.get("key1") == "value1"

    def test_redis_ttl(self, redis_cache):
        redis_cache.set("key1", "value1", ttl=1)
        assert redis_cache.get("key1") == "value1"
        time.sleep(1.1)
        assert redis_cache.get("key1") is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
