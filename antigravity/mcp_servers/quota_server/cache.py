"""
Quota Cache - Reduce API calls and resource usage
=================================================

Caches quota data to:
1. Reduce FTTH bandwidth (fewer API calls)
2. Reduce CPU heat (less processing)
3. Faster response (cached data)

Binh Pháp: Chương 7 (Quân Tranh) - Speed advantage through caching
"""

import json
import logging
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """Single cache entry with TTL."""

    data: Any
    created_at: datetime = field(default_factory=datetime.now)
    ttl_seconds: int = 120  # 2 minutes default

    @property
    def is_expired(self) -> bool:
        age = (datetime.now() - self.created_at).total_seconds()
        return age > self.ttl_seconds

    @property
    def age_seconds(self) -> float:
        return (datetime.now() - self.created_at).total_seconds()


class QuotaCache:
    """
    In-memory cache for quota data with optional disk persistence.

    Features:
    - TTL-based expiration
    - Thread-safe operations
    - Disk persistence for restart
    - LRU eviction when needed
    """

    DEFAULT_TTL = 120  # 2 minutes
    MAX_ENTRIES = 100

    def __init__(self, cache_dir: Optional[Path] = None):
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.RLock()
        self._cache_dir = cache_dir or Path.home() / ".mekong" / "quota_cache"
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._hits = 0
        self._misses = 0

        # Load persistent cache on init
        self._load_from_disk()

    def get(self, key: str) -> Optional[Any]:
        """Get cached value if exists and not expired."""
        with self._lock:
            entry = self._cache.get(key)

            if entry is None:
                self._misses += 1
                return None

            if entry.is_expired:
                del self._cache[key]
                self._misses += 1
                return None

            self._hits += 1
            logger.debug(f"Cache HIT: {key} (age: {entry.age_seconds:.1f}s)")
            return entry.data

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Set cache value with optional custom TTL."""
        with self._lock:
            # Evict if at capacity
            if len(self._cache) >= self.MAX_ENTRIES:
                self._evict_oldest()

            self._cache[key] = CacheEntry(data=value, ttl_seconds=ttl_seconds or self.DEFAULT_TTL)
            logger.debug(f"Cache SET: {key}")

    def invalidate(self, key: str) -> bool:
        """Invalidate specific cache entry."""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
            logger.info("Cache cleared")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0

            return {
                "entries": len(self._cache),
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": f"{hit_rate:.1f}%",
                "max_entries": self.MAX_ENTRIES,
            }

    def _evict_oldest(self) -> None:
        """Evict oldest cache entry (LRU)."""
        if not self._cache:
            return

        oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k].created_at)
        del self._cache[oldest_key]
        logger.debug(f"Evicted: {oldest_key}")

    def _load_from_disk(self) -> None:
        """Load cache from disk on startup."""
        cache_file = self._cache_dir / "quota_cache.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r") as f:
                    data = json.load(f)
                    for key, entry_data in data.items():
                        created = datetime.fromisoformat(entry_data["created_at"])
                        ttl = entry_data.get("ttl_seconds", self.DEFAULT_TTL)
                        entry = CacheEntry(
                            data=entry_data["data"], created_at=created, ttl_seconds=ttl
                        )
                        if not entry.is_expired:
                            self._cache[key] = entry
                logger.info(f"Loaded {len(self._cache)} entries from disk cache")
            except (json.JSONDecodeError, OSError, KeyError) as e:
                logger.warning(f"Could not load cache from disk: {e}")

    def save_to_disk(self) -> None:
        """Persist cache to disk."""
        cache_file = self._cache_dir / "quota_cache.json"
        try:
            with self._lock:
                data = {
                    key: {
                        "data": entry.data,
                        "created_at": entry.created_at.isoformat(),
                        "ttl_seconds": entry.ttl_seconds,
                    }
                    for key, entry in self._cache.items()
                    if not entry.is_expired
                }

            with open(cache_file, "w") as f:
                json.dump(data, f, indent=2)
            logger.debug(f"Saved {len(data)} entries to disk cache")
        except OSError as e:
            logger.warning(f"Could not save cache to disk: {e}")


# Global singleton
_cache: Optional[QuotaCache] = None


def get_quota_cache() -> QuotaCache:
    """Get or create the global quota cache."""
    global _cache
    if _cache is None:
        _cache = QuotaCache()
    return _cache


# Cache decorator for functions
def cached(key_prefix: str, ttl_seconds: int = 120):
    """Decorator to cache function results."""

    def decorator(func):
        def wrapper(*args, **kwargs):
            cache = get_quota_cache()
            cache_key = f"{key_prefix}:{hash(str(args) + str(kwargs))}"

            # Try cache first
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Call function and cache result
            result = func(*args, **kwargs)
            if result is not None:
                cache.set(cache_key, result, ttl_seconds)

            return result

        return wrapper

    return decorator


# CLI Test
if __name__ == "__main__":
    cache = QuotaCache()

    print("🗄️ Quota Cache Test\n")

    # Test set/get
    cache.set("test_key", {"quota": 50.0})
    result = cache.get("test_key")
    print(f"Set/Get: {result}")

    # Test cache hit
    result2 = cache.get("test_key")
    print(f"Cache hit: {result2}")

    # Stats
    print(f"\nStats: {cache.get_stats()}")
