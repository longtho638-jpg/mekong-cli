import logging

import redis.asyncio as redis

from backend.api.config.settings import settings
from backend.core.infrastructure.redis import redis_client as core_redis_client

logger = logging.getLogger(__name__)

class RedisService:
    """
    Service wrapper for Redis operations.
    Provides a clean interface for Redis interactions, ensuring singleton access
    and consistent error handling.
    """
    def __init__(self):
        self._client = core_redis_client

    def get_client(self) -> redis.Redis:
        """Get the underlying Redis client."""
        return self._client

    async def ping(self) -> bool:
        """Check Redis connection health."""
        try:
            return await self._client.ping()
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False

    async def get(self, key: str) -> str:
        return await self._client.get(key)

    async def set(self, key: str, value: str, expire: int = None):
        return await self._client.set(key, value, ex=expire)

    async def delete(self, key: str):
        return await self._client.delete(key)

# Singleton instance
redis_service = RedisService()
