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
import zlib
from datetime import timedelta
from functools import wraps
from typing import Any, Dict, List, Optional, Union

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

try:
    import msgpack

    MSGPACK_AVAILABLE = True
except ImportError:
    MSGPACK_AVAILABLE = False

logger = logging.getLogger(__name__)


class InMemoryCache:
    """Simple in-memory cache as fallback when Redis is unavailable."""

    def __init__(self):
        self._cache = {}
        self._ttl = {}
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[bytes]:
        """Get value from cache."""
        import time

        if key in self._cache:
            # Check TTL
            if key in self._ttl and self._ttl[key] < time.time():
                del self._cache[key]
                del self._ttl[key]
                self._misses += 1
                return None
            self._hits += 1
            return self._cache[key]
        self._misses += 1
        return None

    def set(self, key: str, value: bytes, ex: Optional[int] = None) -> bool:
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
        # For in-memory, we check if get returns value (respecting TTL)
        # Note: calling get() will increment hits/misses, which might affect stats slightly
        # but technically asking "exists?" is a cache operation.
        # To avoid skewing "get" stats, we can check manually.
        import time

        if key in self._cache:
            if key in self._ttl and self._ttl[key] < time.time():
                return False
            return True
        return False

    def flushdb(self):
        """Clear all cache."""
        self._cache.clear()
        self._ttl.clear()
        self._hits = 0
        self._misses = 0

    def mget(self, keys: List[str]) -> List[Optional[bytes]]:
        """Get multiple values."""
        return [self.get(key) for key in keys]

    def mset(self, mapping: Dict[str, bytes]):
        """Set multiple values."""
        for key, value in mapping.items():
            self.set(key, value)
        return True

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "type": "memory",
            "keys": len(self._cache),
            "ttl_keys": len(self._ttl),
            "hits": self._hits,
            "misses": self._misses,
            "hit_ratio": self._hits / (self._hits + self._misses)
            if (self._hits + self._misses) > 0
            else 0,
        }


class CacheService:
    """
    Redis caching service with automatic fallback to in-memory cache.
    Supports msgpack serialization and zlib compression.

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
        compress_threshold: int = 1024,  # Compress if larger than 1KB
        **redis_kwargs,
    ):
        """
        Initialize cache service.

        Args:
            prefix: Key prefix for this service (e.g., "api", "user", "order")
            host: Redis host
            port: Redis port
            db: Redis database number
            default_ttl: Default TTL in seconds
            compress_threshold: Minimum bytes to trigger compression
            **redis_kwargs: Additional Redis client arguments
        """
        self.prefix = prefix
        self.default_ttl = default_ttl
        self.compress_threshold = compress_threshold
        self._use_redis = False
        self._client = None

        # Try to connect to Redis
        if REDIS_AVAILABLE:
            try:
                # Use Redis connection pool if available or just direct connection
                # For now, standard Redis client
                self._client = redis.Redis(
                    host=host,
                    port=port,
                    db=db,
                    decode_responses=False,  # We handle encoding/decoding for msgpack
                    socket_connect_timeout=2,
                    socket_timeout=2,
                    **redis_kwargs,
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

    def _serialize(self, value: Any) -> bytes:
        """Serialize value using msgpack and optionally compress."""
        if MSGPACK_AVAILABLE:
            packed = msgpack.packb(value, use_bin_type=True)
        else:
            # Fallback to JSON if msgpack not present
            packed = json.dumps(value).encode("utf-8")

        if len(packed) > self.compress_threshold:
            return zlib.compress(packed) + b".z"  # Mark as compressed
        return packed

    def _deserialize(self, value: bytes) -> Any:
        """Deserialize value, handling compression."""
        if value is None:
            return None

        if value.endswith(b".z"):
            try:
                value = zlib.decompress(value[:-2])
            except zlib.error:
                logger.warning("Failed to decompress cache value")
                return None

        if MSGPACK_AVAILABLE:
            try:
                return msgpack.unpackb(value, raw=False)
            except Exception:
                # Might be raw string or JSON from old cache
                try:
                    return json.loads(value.decode("utf-8"))
                except:
                    return value.decode("utf-8", errors="ignore")
        else:
            try:
                return json.loads(value.decode("utf-8"))
            except:
                return value.decode("utf-8", errors="ignore")

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

            return self._deserialize(value)
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
            return default

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key (will be prefixed)
            value: Value to cache (will be msgpack serialized)
            ttl: Time to live in seconds (uses default_ttl if None)

        Returns:
            True if successful, False otherwise
        """
        try:
            full_key = self._make_key(key)
            ttl = ttl or self.default_ttl
            packed_value = self._serialize(value)

            self._client.set(full_key, packed_value, ex=ttl)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")
            return False

    def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """
        Get multiple values from cache.

        Args:
            keys: List of keys (will be prefixed)

        Returns:
            Dictionary of {key: value}
        """
        if not keys:
            return {}

        try:
            full_keys = [self._make_key(k) for k in keys]
            values = self._client.mget(full_keys)

            result = {}
            for i, key in enumerate(keys):
                val = values[i]
                if val is not None:
                    result[key] = self._deserialize(val)
                else:
                    result[key] = None
            return result
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {k: None for k in keys}

    def set_many(self, mapping: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """
        Set multiple values in cache.
        Note: Redis MSET doesn't support TTL. We use pipeline.

        Args:
            mapping: Dict of {key: value}
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        if not mapping:
            return True

        ttl = ttl or self.default_ttl

        try:
            if self._use_redis:
                pipe = self._client.pipeline()
                for key, value in mapping.items():
                    full_key = self._make_key(key)
                    packed_value = self._serialize(value)
                    pipe.set(full_key, packed_value, ex=ttl)
                pipe.execute()
            else:
                # In-memory fallback
                for key, value in mapping.items():
                    self.set(key, value, ttl=ttl)

            return True
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
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

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        """
        try:
            if self._use_redis:
                info = self._client.info()
                return {
                    "type": "redis",
                    "used_memory_human": info.get("used_memory_human"),
                    "connected_clients": info.get("connected_clients"),
                    "uptime_in_days": info.get("uptime_in_days"),
                    "keyspace_hits": info.get("keyspace_hits"),
                    "keyspace_misses": info.get("keyspace_misses"),
                }
            else:
                return self._client.get_stats()
        except Exception as e:
            logger.error(f"Cache get_stats error: {e}")
            return {"error": str(e)}


def cached(key_func=None, ttl: Optional[int] = None, prefix: str = "func"):
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
