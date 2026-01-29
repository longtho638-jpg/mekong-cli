import logging

import redis.asyncio as redis

from backend.api.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    _instance = None

    @classmethod
    def get_instance(cls) -> redis.Redis:
        if cls._instance is None:
            # Create connection pool
            pool = redis.ConnectionPool.from_url(
                settings.redis_url, encoding="utf-8", decode_responses=True, max_connections=100
            )
            cls._instance = redis.Redis(connection_pool=pool)
            logger.info(f"Initialized Redis client with URL: {settings.redis_url}")
        return cls._instance


# Singleton instance
redis_client = RedisClient.get_instance()
