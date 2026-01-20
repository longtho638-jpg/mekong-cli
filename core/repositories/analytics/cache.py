"""
Analytics Caching logic.
"""
import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

class AnalyticsCache:
    """Simple in-memory cache cho analytics data."""

    def __init__(self, ttl_seconds: int = 300):  # 5 minutes default TTL
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds
        logger.info(f"Analytics cache initialized with {ttl_seconds}s TTL")

    def _generate_key(self, method: str, **kwargs) -> str:
        """Generate cache key từ method và parameters."""
        key_data = f"{method}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, method: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Lấy data từ cache."""
        key = self._generate_key(method, **kwargs)

        if key in self.cache:
            cached_data = self.cache[key]
            if datetime.now().timestamp() - cached_data["timestamp"] < self.ttl_seconds:
                logger.debug(f"Cache hit for {method}")
                return cached_data["data"]
            else:
                del self.cache[key]
                logger.debug(f"Cache expired for {method}")

        return None

    def set(self, method: str, data: Dict[str, Any], **kwargs) -> None:
        """Lưu data vào cache."""
        key = self._generate_key(method, **kwargs)
        self.cache[key] = {"data": data, "timestamp": datetime.now().timestamp()}
        logger.debug(f"Cached data for {method}")

    def invalidate_all(self) -> None:
        """Xóa toàn bộ cache."""
        self.cache.clear()
        logger.info("Analytics cache invalidated")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Lấy cache statistics."""
        return {
            "cache_size": len(self.cache),
            "ttl_seconds": self.ttl_seconds,
            "keys": list(self.cache.keys()),
        }
