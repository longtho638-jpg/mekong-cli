"""
Cache Warming Service
Pre-populates cache with critical data on startup or schedule.
"""

import asyncio
import logging
from typing import Awaitable, Callable, List

from backend.services.cache.query_cache import QueryCache
from backend.services.redis_client import redis_service

logger = logging.getLogger(__name__)

class CacheWarmer:
    def __init__(self):
        self.tasks: List[Callable[[], Awaitable[None]]] = []
        self._redis = None
        self._query_cache = None

    async def initialize(self):
        """Lazy init of dependencies"""
        if not self._redis:
             # Assuming redis_service.get_client() returns the sync client wrapper or async client
             # The existing redis_client.py seems to return a sync wrapper that uses 'redis.Redis'
             # We need to make sure we are compatible.
             # Ideally we should use the same client instance.
             # For now, let's just assume we can get an async client or adapt.
             # Re-checking redis_client.py: it wraps redis.asyncio as 'redis' but then init 'redis.Redis'.
             # Wait, in toolu_6440163ee930b40bb660c714, it imports `redis.asyncio as redis`.
             # And `core_redis_client` is imported.
             pass

    def register_task(self, task: Callable[[], Awaitable[None]]):
        """Register a warming task"""
        self.tasks.append(task)

    async def warm_up(self):
        """Execute all warming tasks"""
        logger.info(f"Starting cache warming with {len(self.tasks)} tasks...")

        results = await asyncio.gather(*[self._safe_execute(task) for task in self.tasks], return_exceptions=True)

        success_count = sum(1 for r in results if r is True)
        logger.info(f"Cache warming completed. Success: {success_count}/{len(self.tasks)}")

    async def _safe_execute(self, task):
        try:
            await task()
            return True
        except Exception as e:
            logger.error(f"Cache warming task failed: {e}")
            return False

# Example usage/registration
# warmer = CacheWarmer()
# warmer.register_task(warm_top_products)
