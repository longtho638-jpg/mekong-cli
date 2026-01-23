"""
Infrastructure - Cache System
"""

import json
import logging
import time
from pathlib import Path
from typing import Any, Optional

try:
    from redis import Redis
except ImportError:
    Redis = None

from .database import get_db

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Polymorphic Cache Manager.
    Uses Redis in production/staging if available, falls back to file-based caching for local/CLI.
    """

    def __init__(self, cache_dir: str = ".mekong/cache", ttl: int = 3600, redis_url: Optional[str] = None):
        self.cache_dir = Path.home() / cache_dir
        self.ttl = ttl
        self._ensure_dir()

        self.redis: Optional[Redis] = None
        if Redis and redis_url:
            try:
                self.redis = Redis.from_url(redis_url, decode_responses=True)
                logger.info("✅ Redis cache initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis cache: {e}")

    def _ensure_dir(self):
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get(self, key: str) -> Optional[Any]:
        """Retrieve a value from cache if valid."""
        # 1. Try Redis first
        if self.redis:
            try:
                value = self.redis.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.debug(f"Redis get failed: {e}")

        # 2. Fallback to file-based
        file_path = self.cache_dir / f"{key}.json"
        if not file_path.exists():
            return None

        try:
            data = json.loads(file_path.read_text())
            if time.time() - data["timestamp"] > self.ttl:
                file_path.unlink()  # Expired
                return None
            return data["payload"]
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Save a value to cache."""
        expiration = ttl or self.ttl

        # 1. Set in Redis
        if self.redis:
            try:
                self.redis.set(key, json.dumps(value), ex=expiration)
            except Exception as e:
                logger.debug(f"Redis set failed: {e}")

        # 2. Always persist to file-based for CLI reliability
        file_path = self.cache_dir / f"{key}.json"
        try:
            data = {"timestamp": time.time(), "payload": value}
            file_path.write_text(json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to cache {key} to file: {e}")

    def delete(self, key: str):
        """Delete a key from cache."""
        if self.redis:
            try:
                self.redis.delete(key)
            except Exception:
                pass

        file_path = self.cache_dir / f"{key}.json"
        if file_path.exists():
            file_path.unlink()

    def clear(self):
        """Clear all cache."""
        if self.redis:
            try:
                self.redis.flushdb()
            except Exception:
                pass

        for f in self.cache_dir.glob("*.json"):
            f.unlink()
