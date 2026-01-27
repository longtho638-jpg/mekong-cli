"""
Redis caching service with in-memory fallback.

Features:
- Cache API responses with TTL
- Cache invalidation on update
- Key prefix by service
- Get/Set/Delete operations
- Fallback to in-memory if Redis unavailable
"""

import json
import logging
from datetime import timedelta
from functools import wraps
from typing import Any, Optional, Union

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class InMemoryCache:
    """Simple in-memory cache as fallback when Redis is unavailable."""

    def __init__(self):
        self._cache = {}
        self._ttl = {}

    def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        import time
        if key in self._cache:
            # Check TTL
            if key in self._ttl and self._ttl[key] < time.time():
                del self._cache[key]
                del self._ttl[key]
                return None
            return self._cache[key]
        return None

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL."""
        import time
        self._cache[key] = value
        if ex:
            self._ttl[key] = time.time() + ex
        return True

    def delete(self, *keys: str) -> int:
        """Delete keys from cache."""
        deleted = 0
        for key in keys:
            if key in self._cache:
                del self._cache[key]
                if key in self._ttl:
                    del self._ttl[key]
                deleted += 1
        return deleted

    def exists(self, key: str) -> bool:
        """Check if key exists."""
        value = self.get(key)
        return value is not None

    def flushdb(self):
        """Clear all cache."""
        self._cache.clear()
        self._ttl.clear()


class CacheService:
    """
    Redis caching service with automatic fallback to in-memory cache.

    Usage:
        cache = CacheService(prefix="api")
        cache.set("user:123", {"name": "John"}, ttl=300)
        data = cache.get("user:123")
        cache.delete("user:123")
        cache.invalidate_pattern("user:*")
    """

    def __init__(
        self,
        prefix: str = "cache",
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        default_ttl: int = 300,
        **redis_kwargs
    ):
        """
        Initialize cache service.

        Args:
            prefix: Key prefix for this service (e.g., "api", "user", "order")
            host: Redis host
            port: Redis port
            db: Redis database number
            default_ttl: Default TTL in seconds
            **redis_kwargs: Additional Redis client arguments
        """
        self.prefix = prefix
        self.default_ttl = default_ttl
        self._use_redis = False
        self._client = None

        # Try to connect to Redis
        if REDIS_AVAILABLE:
            try:
                self._client = redis.Redis(
                    host=host,
                    port=port,
                    db=db,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    **redis_kwargs
                )
                # Test connection
                self._client.ping()
                self._use_redis = True
                logger.info(f"CacheService '{prefix}' connected to Redis at {host}:{port}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Using in-memory cache.")
                self._client = InMemoryCache()
        else:
            logger.warning("Redis not installed. Using in-memory cache.")
            self._client = InMemoryCache()

    def _make_key(self, key: str) -> str:
        """Create prefixed key."""
        return f"{self.prefix}:{key}"

    def get(self, key: str, default: Any = None) -> Any:
        """
        Get value from cache.

        Args:
            key: Cache key (will be prefixed)
            default: Default value if key not found

        Returns:
            Cached value or default
        """
        try:
            full_key = self._make_key(key)
            value = self._client.get(full_key)

            if value is None:
                return default

            # Try to deserialize JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return default

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key (will be prefixed)
            value: Value to cache (will be JSON serialized if not string)
            ttl: Time to live in seconds (uses default_ttl if None)

        Returns:
            True if successful, False otherwise
        """
        try:
            full_key = self._make_key(key)
            ttl = ttl or self.default_ttl

            # Serialize value if not string
            if not isinstance(value, str):
                value = json.dumps(value)

            self._client.set(full_key, value, ex=ttl)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False

    def delete(self, *keys: str) -> int:
        """
        Delete keys from cache.

        Args:
            *keys: Keys to delete (will be prefixed)

        Returns:
            Number of keys deleted
        """
        try:
            full_keys = [self._make_key(k) for k in keys]
            return self._client.delete(*full_keys)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key (will be prefixed)

        Returns:
            True if key exists, False otherwise
        """
        try:
            full_key = self._make_key(key)
            return self._client.exists(full_key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key '{key}': {e}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all keys matching pattern.

        Args:
            pattern: Key pattern (e.g., "user:*") - will be prefixed

        Returns:
            Number of keys deleted
        """
        try:
            full_pattern = self._make_key(pattern)

            # For in-memory cache, we need to iterate
            if not self._use_redis:
                keys_to_delete = []
                import fnmatch
                for key in list(self._client._cache.keys()):
                    if fnmatch.fnmatch(key, full_pattern):
                        keys_to_delete.append(key)

                if keys_to_delete:
                    return self._client.delete(*keys_to_delete)
                return 0

            # For Redis, use SCAN for safe deletion
            deleted = 0
            cursor = 0
            while True:
                cursor, keys = self._client.scan(cursor, match=full_pattern, count=100)
                if keys:
                    deleted += self._client.delete(*keys)
                if cursor == 0:
                    break

            return deleted
        except Exception as e:
            logger.error(f"Cache invalidate_pattern error for pattern '{pattern}': {e}")
            return 0

    def clear_all(self) -> bool:
        """
        Clear all cache entries for this service prefix.

        Returns:
            True if successful, False otherwise
        """
        try:
            return self.invalidate_pattern("*") >= 0
        except Exception as e:
            logger.error(f"Cache clear_all error: {e}")
            return False

    def is_redis_available(self) -> bool:
        """Check if using Redis (vs in-memory cache)."""
        return self._use_redis


def cached(
    key_func=None,
    ttl: Optional[int] = None,
    prefix: str = "func"
):
    """
    Decorator to cache function results.

    Usage:
        @cached(key_func=lambda user_id: f"user:{user_id}", ttl=300)
        def get_user(user_id):
            return db.query(User).filter_by(id=user_id).first()

    Args:
        key_func: Function to generate cache key from args/kwargs
        ttl: Cache TTL in seconds
        prefix: Cache key prefix
    """
    import inspect

    def decorator(func):
        cache = CacheService(prefix=prefix)

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Use function name and args as key
                # Note: args might contain dependencies which are not serializable
                # For endpoints, better to use explicit key_func
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result

        # Return appropriate wrapper
        if inspect.iscoroutinefunction(func):
            wrapper = async_wrapper
        else:
            wrapper = sync_wrapper

        # Add cache control methods
        wrapper.cache = cache
        wrapper.invalidate = lambda: cache.clear_all()

        return wrapper

    return decorator


# Global cache instances for common use cases
api_cache = CacheService(prefix="api", default_ttl=300)
user_cache = CacheService(prefix="user", default_ttl=600)
session_cache = CacheService(prefix="session", default_ttl=1800)
