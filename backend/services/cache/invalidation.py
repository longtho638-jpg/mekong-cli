"""
Cache Invalidation Logic
Handles cache invalidation strategies:
- Pattern-based
- Tag-based
- Event-driven
"""

import logging
from typing import Any, List, Optional

import redis as sync_redis
import redis.asyncio as redis

from backend.services.cache.metrics import MetricsContext, global_metrics

logger = logging.getLogger(__name__)

class SyncCacheInvalidator:
    """Synchronous version of CacheInvalidator for legacy services"""
    def __init__(self, redis_client: sync_redis.Redis, prefix: str = "cache"):
        self.redis = redis_client
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    def invalidate_key(self, key: str) -> int:
        full_key = self._make_key(key)
        try:
            result = self.redis.delete(full_key)
            global_metrics.increment_delete()
            logger.info(f"Invalidated key: {full_key}")
            return result
        except Exception as e:
            logger.error(f"Error invalidating key {full_key}: {e}")
            global_metrics.increment_error()
            return 0

    def invalidate_pattern(self, pattern: str) -> int:
        full_pattern = self._make_key(pattern)
        deleted_count = 0
        cursor = 0
        try:
            while True:
                cursor, keys = self.redis.scan(cursor, match=full_pattern, count=100)
                if keys:
                     count = self.redis.delete(*keys)
                     deleted_count += count
                if cursor == 0:
                    break
            logger.info(f"Invalidated {deleted_count} keys matching pattern: {full_pattern}")
            return deleted_count
        except Exception as e:
            logger.error(f"Error invalidating pattern {full_pattern}: {e}")
            global_metrics.increment_error()
            return 0

    def invalidate_tags(self, tags: List[str]) -> int:
        total_deleted = 0
        try:
            for tag in tags:
                tag_key = self._make_key(f"tag:{tag}")
                keys = self.redis.smembers(tag_key)
                if keys:
                    decoded_keys = [k.decode('utf-8') if isinstance(k, bytes) else k for k in keys]
                    self.redis.delete(*decoded_keys)
                    total_deleted += len(decoded_keys)
                    self.redis.delete(tag_key)
            logger.info(f"Invalidated {total_deleted} keys for tags: {tags}")
            return total_deleted
        except Exception as e:
            logger.error(f"Error invalidating tags {tags}: {e}")
            global_metrics.increment_error()
            return 0

class CacheInvalidator:
    def __init__(self, redis_client: redis.Redis, prefix: str = "cache"):
        self.redis = redis_client
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    async def invalidate_key(self, key: str) -> int:
        """Invalidate a specific key"""
        full_key = self._make_key(key)
        with MetricsContext("delete"):
            try:
                result = await self.redis.delete(full_key)
                global_metrics.increment_delete()
                logger.info(f"Invalidated key: {full_key}")
                return result
            except Exception as e:
                logger.error(f"Error invalidating key {full_key}: {e}")
                global_metrics.increment_error()
                return 0

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate keys matching a pattern (expensive, use scan)"""
        full_pattern = self._make_key(pattern)
        deleted_count = 0
        cursor = 0

        with MetricsContext("delete"):
            try:
                while True:
                    cursor, keys = await self.redis.scan(cursor, match=full_pattern, count=100)
                    if keys:
                        # Direct delete without pipeline for now to keep it simple,
                        # but pipeline would be better for performance
                        if len(keys) > 0:
                            count = await self.redis.delete(*keys)
                            deleted_count += count

                    if cursor == 0:
                        break

                logger.info(f"Invalidated {deleted_count} keys matching pattern: {full_pattern}")
                return deleted_count
            except Exception as e:
                logger.error(f"Error invalidating pattern {full_pattern}: {e}")
                global_metrics.increment_error()
                return 0

    async def invalidate_tags(self, tags: List[str]) -> int:
        """
        Invalidate keys associated with specific tags.
        Requires maintaining a Set for each tag containing the keys.
        """
        total_deleted = 0

        with MetricsContext("delete"):
            try:
                for tag in tags:
                    tag_key = self._make_key(f"tag:{tag}")

                    # Get all keys associated with this tag
                    keys = await self.redis.smembers(tag_key)
                    if keys:
                        # Decode bytes to strings if needed
                        decoded_keys = [k.decode('utf-8') if isinstance(k, bytes) else k for k in keys]

                        # Delete the actual keys
                        await self.redis.delete(*decoded_keys)
                        total_deleted += len(decoded_keys)

                        # Delete the tag set itself
                        await self.redis.delete(tag_key)

                logger.info(f"Invalidated {total_deleted} keys for tags: {tags}")
                return total_deleted
            except Exception as e:
                logger.error(f"Error invalidating tags {tags}: {e}")
                global_metrics.increment_error()
                return 0

    async def add_tags(self, key: str, tags: List[str]):
        """Associate a key with tags for future invalidation"""
        full_key = self._make_key(key)

        try:
            pipe = self.redis.pipeline()
            for tag in tags:
                tag_key = self._make_key(f"tag:{tag}")
                pipe.sadd(tag_key, full_key)
                # Set expiry on tag set equal to max possible TTL (or just long)
                #Ideally tag sets should expire when member keys expire, but Redis doesn't support that easily.
                # A common strategy is setting a long TTL.
                pipe.expire(tag_key, 86400 * 30) # 30 days

            await pipe.execute()
        except Exception as e:
            logger.error(f"Error adding tags to key {full_key}: {e}")
