import json
import time
import zlib
from unittest.mock import MagicMock, patch

import pytest

from backend.services.cache_service import CacheService, InMemoryCache


class TestCacheService:
    def test_in_memory_basic_ops(self):
        """Test basic operations with InMemoryCache."""
        # Force in-memory
        with patch("backend.services.cache_service.REDIS_AVAILABLE", False):
            service = CacheService()
            assert isinstance(service._client, InMemoryCache)

            # Set
            assert service.set("test", "value") is True

            # Get
            assert service.get("test") == "value"

            # Exists
            assert service.exists("test") is True

            # Delete
            assert service.delete("test") == 1
            assert service.exists("test") is False
            assert service.get("test") is None

    def test_ttl_expiry_in_memory(self):
        """Test TTL expiry in InMemoryCache."""
        with patch("backend.services.cache_service.REDIS_AVAILABLE", False):
            service = CacheService()

            # Set with short TTL
            # We mock time to verify expiry without waiting
            with patch("time.time") as mock_time:
                mock_time.return_value = 1000
                service.set("short", "lived", ttl=10)

                # Should exist now
                assert service.get("short") == "lived"

                # Advance time beyond TTL
                mock_time.return_value = 1020
                assert service.get("short") is None
                assert service.exists("short") is False

    def test_compression(self):
        """Test automatic compression of large values."""
        # Low threshold to trigger compression
        service = CacheService(compress_threshold=10)
        # Force in-memory to simplify
        service._client = InMemoryCache()
        service._use_redis = False

        large_value = "x" * 100

        # We intercept the InMemoryCache.set to verify it received compressed bytes
        original_set = service._client.set
        captured_value = None

        def side_effect_set(key, value, ex=None):
            nonlocal captured_value
            captured_value = value
            return original_set(key, value, ex)

        with patch.object(service._client, "set", side_effect=side_effect_set):
            service.set("large", large_value)

        # Verify it was compressed (ends with .z marker we added)
        assert captured_value is not None
        assert captured_value.endswith(b".z")

        # Verify we get the original string back
        retrieved = service.get("large")
        assert retrieved == large_value

    def test_serialization_fallback(self):
        """Test JSON serialization when msgpack is missing."""
        with patch("backend.services.cache_service.MSGPACK_AVAILABLE", False):
            service = CacheService()
            service._client = InMemoryCache()

            data = {"key": "value", "list": [1, 2, 3]}
            service.set("json_data", data)

            result = service.get("json_data")
            assert result == data
            assert result["key"] == "value"

    def test_invalidate_pattern(self):
        """Test pattern invalidation."""
        service = CacheService()
        service._client = InMemoryCache()
        service._use_redis = False

        # Setup keys
        service.set("users:1", "u1")
        service.set("users:2", "u2")
        service.set("posts:1", "p1")

        # Verify setup
        assert service.exists("users:1")
        assert service.exists("users:2")
        assert service.exists("posts:1")

        # Invalidate pattern
        deleted = service.invalidate_pattern("users:*")

        # Verify result
        assert deleted == 2
        assert not service.exists("users:1")
        assert not service.exists("users:2")
        assert service.exists("posts:1")

    def test_decorator_usage(self):
        """Test the @cached decorator."""
        from backend.services.cache_service import cached

        # Mock CacheService to avoid global state issues
        with patch("backend.services.cache_service.CacheService") as MockService:
            mock_instance = MockService.return_value
            mock_instance.get.return_value = None  # Cache miss first

            # Define decorated function
            @cached(ttl=60, prefix="test")
            def expensive_func(x, y):
                return x + y

            # First call - miss
            result = expensive_func(1, 2)
            assert result == 3
            mock_instance.get.assert_called()
            mock_instance.set.assert_called()

            # Second call - hit (simulate by changing mock return)
            mock_instance.get.return_value = 10  # Fake cached value
            result = expensive_func(1, 2)
            assert result == 10  # Should return cached value
