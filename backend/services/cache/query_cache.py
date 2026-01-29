"""
Query Cache Strategy
Implements caching for database query results.
Strategy: Cache-Aside
"""

import hashlib
import json
import logging
from typing import Any, Dict, Optional, Union

import redis.asyncio as redis

from backend.services.cache.invalidation import CacheInvalidator
from backend.services.cache.metrics import MetricsContext, global_metrics

logger = logging.getLogger(__name__)


class QueryCache:
    def __init__(self, redis_client: redis.Redis, prefix: str = "query", default_ttl: int = 600):
        self.redis = redis_client
        self.prefix = prefix
        self.default_ttl = default_ttl
        self.invalidator = CacheInvalidator(redis_client, prefix)

    def _make_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    def generate_key(self, sql: str, params: Union[list, dict, tuple] = None) -> str:
        """Generate a deterministic cache key from SQL and params"""
        if params is None:
            params = []

        # Create a canonical representation of the query
        query_str = f"{sql}|{str(params)}"
        hash_digest = hashlib.sha256(query_str.encode("utf-8")).hexdigest()
        return f"sql:{hash_digest}"

    async def get(self, key: str) -> Optional[Any]:
        """Get cached query result"""
        full_key = self._make_key(key)

        with MetricsContext("get"):
            try:
                data = await self.redis.get(full_key)
                if data:
                    global_metrics.increment_hit()
                    return json.loads(data)

                global_metrics.increment_miss()
                return None
            except Exception as e:
                logger.error(f"Error getting query cache {full_key}: {e}")
                global_metrics.increment_error()
                return None

    async def set(self, key: str, value: Any, ttl: int = None, tags: list = None) -> bool:
        """Set query result in cache"""
        full_key = self._make_key(key)
        expiry = ttl if ttl is not None else self.default_ttl

        with MetricsContext("set"):
            try:
                serialized = json.dumps(value)
                await self.redis.set(full_key, serialized, ex=expiry)

                if tags:
                    await self.invalidator.add_tags(key, tags)

                global_metrics.increment_write()
                return True
            except Exception as e:
                logger.error(f"Error setting query cache {full_key}: {e}")
                global_metrics.increment_error()
                return False

    async def cached_query(self, key: str, query_func, ttl: int = None, tags: list = None):
        """
        Cache-Aside wrapper for query execution.
        1. Check cache
        2. If hit, return
        3. If miss, execute query_func()
        4. Cache result
        5. Return result
        """
        # 1. Check cache
        cached_result = await self.get(key)
        if cached_result is not None:
            return cached_result

        # 2 & 3. Execute query
        result = await query_func()

        # 4. Cache result (background task would be better but direct for now)
        if result is not None:
            await self.set(key, result, ttl=ttl, tags=tags)

        # 5. Return
        return result
