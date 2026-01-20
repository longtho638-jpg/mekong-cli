"""
Tunnel response cache.
"""

import hashlib
import json
import time
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class CacheEntry:
    """Cache entry with TTL."""

    data: Any
    timestamp: float
    ttl: float

    @property
    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        return time.time() > (self.timestamp + self.ttl)


class ResponseCache:
    """In-memory response cache with TTL."""

    def __init__(self, max_size: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.access_times: Dict[str, float] = defaultdict(float)

    def _generate_key(self, method: str, url: str, params: Dict = None) -> str:
        """Generate cache key."""
        cache_data = {"method": method, "url": url, "params": params or {}}
        cache_str = json.dumps(cache_data, sort_keys=True)
        return hashlib.md5(cache_str.encode()).hexdigest()

    def get(self, method: str, url: str, params: Dict = None) -> Optional[Any]:
        """Get cached response."""
        key = self._generate_key(method, url, params)

        if key not in self.cache:
            return None

        entry = self.cache[key]

        if entry.is_expired:
            del self.cache[key]
            if key in self.access_times:
                del self.access_times[key]
            return None

        # Update access time for LRU
        self.access_times[key] = time.time()
        return entry.data

    def set(self, method: str, url: str, data: Any, ttl: float, params: Dict = None):
        """Set cache entry."""
        key = self._generate_key(method, url, params)

        # Remove oldest entry if cache is full
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.access_times.items(), key=lambda x: x[1])[0]
            del self.cache[oldest_key]
            del self.access_times[oldest_key]

        self.cache[key] = CacheEntry(data=data, timestamp=time.time(), ttl=ttl)
        self.access_times[key] = time.time()

    def clear(self):
        """Clear all cache entries."""
        self.cache.clear()
        self.access_times.clear()
