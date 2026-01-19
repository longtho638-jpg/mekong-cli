"""
Redis Client - Centralized Redis Operations
============================================

Provides a simple, type-safe interface for Redis operations with:
- Connection pooling
- JSON serialization/deserialization
- Health checking
- Error handling
"""

import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Redis support (optional)
try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, RedisClient will not function")


class RedisClient:
    """Centralized Redis operations with connection pooling."""

    def __init__(self, url: str, pool_size: int = 10):
        """
        Initialize Redis client with connection pooling.

        Args:
            url: Redis connection URL (e.g., redis://localhost:6379)
            pool_size: Maximum number of connections in pool
        """
        if not REDIS_AVAILABLE:
            raise ImportError("redis package is required. Install with: pip install redis")

        self.url = url
        self.pool_size = pool_size

        # Create connection pool
        self.pool = redis.ConnectionPool.from_url(url, max_connections=pool_size, decode_responses=True)
        self.client = redis.Redis(connection_pool=self.pool)

        logger.info(f"RedisClient initialized with pool_size={pool_size}")

    def get(self, key: str) -> Optional[Any]:
        """
        Get value with JSON deserialization.

        Args:
            key: Redis key

        Returns:
            Deserialized value or None if key doesn't exist
        """
        try:
            value = self.client.get(key)
            if value is None:
                return None

            # Try JSON decode, fallback to raw string
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        except redis.RedisError as e:
            logger.error(f"Redis GET error for key={key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = 3600):
        """
        Set value with JSON serialization.

        Args:
            key: Redis key
            value: Value to store (will be JSON serialized)
            ttl: Time to live in seconds (default: 1 hour)
        """
        try:
            # Serialize value
            if isinstance(value, (str, int, float, bool)):
                serialized = str(value)
            else:
                serialized = json.dumps(value)

            # Set with TTL
            self.client.setex(key, ttl, serialized)
            logger.debug(f"Redis SET: {key} (TTL={ttl}s)")

        except redis.RedisError as e:
            logger.error(f"Redis SET error for key={key}: {e}")
        except (TypeError, ValueError) as e:
            logger.error(f"Serialization error for key={key}: {e}")

    def delete(self, key: str) -> bool:
        """
        Delete key from Redis.

        Args:
            key: Redis key to delete

        Returns:
            True if key was deleted, False otherwise
        """
        try:
            result = self.client.delete(key)
            return result > 0
        except redis.RedisError as e:
            logger.error(f"Redis DELETE error for key={key}: {e}")
            return False

    def exists(self, key: str) -> bool:
        """
        Check if key exists.

        Args:
            key: Redis key

        Returns:
            True if key exists, False otherwise
        """
        try:
            return self.client.exists(key) > 0
        except redis.RedisError as e:
            logger.error(f"Redis EXISTS error for key={key}: {e}")
            return False

    def health_check(self) -> bool:
        """
        Check Redis connectivity.

        Returns:
            True if Redis is reachable, False otherwise
        """
        try:
            self.client.ping()
            return True
        except redis.ConnectionError:
            logger.error("Redis health check failed: Connection error")
            return False
        except redis.RedisError as e:
            logger.error(f"Redis health check failed: {e}")
            return False

    def close(self):
        """Close Redis connection pool."""
        try:
            self.pool.disconnect()
            logger.info("Redis connection pool closed")
        except Exception as e:
            logger.error(f"Error closing Redis pool: {e}")


__all__ = ["RedisClient", "REDIS_AVAILABLE"]
