"""
Cache Factory and Registry
Central entry point for accessing different cache services.
"""

from typing import Any, Dict, Optional

import redis.asyncio as redis

from backend.services.cache.api_response_cache import ResponseCache
from backend.services.cache.invalidation import CacheInvalidator
from backend.services.cache.metrics import global_metrics
from backend.services.cache.query_cache import QueryCache
from backend.services.redis_client import redis_service


class CacheFactory:
    _instances: Dict[str, Any] = {}
    _redis_client: Optional[redis.Redis] = None

    @classmethod
    async def get_redis(cls) -> redis.Redis:
        """Get or initialize generic Redis client"""
        if cls._redis_client is None:
            # Assuming redis_service.get_client() returns the instance we need
            # We might need to handle async initialization if redis_service isn't fully async-ready in expected way
            cls._redis_client = redis_service.get_client()
        return cls._redis_client

    @classmethod
    async def get_query_cache(cls) -> QueryCache:
        if "query_cache" not in cls._instances:
            client = await cls.get_redis()
            cls._instances["query_cache"] = QueryCache(client)
        return cls._instances["query_cache"]

    @classmethod
    async def get_response_cache(cls) -> ResponseCache:
        if "response_cache" not in cls._instances:
            client = await cls.get_redis()
            cls._instances["response_cache"] = ResponseCache(client)
        return cls._instances["response_cache"]

    @classmethod
    async def get_invalidator(cls) -> CacheInvalidator:
        if "invalidator" not in cls._instances:
            client = await cls.get_redis()
            cls._instances["invalidator"] = CacheInvalidator(client)
        return cls._instances["invalidator"]

    @staticmethod
    def get_metrics():
        return global_metrics


# Convenience accessor
cache_factory = CacheFactory()
