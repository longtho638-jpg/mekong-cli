"""
Tunnel Response Cache.
"""
import time
from typing import Any, Dict, Optional, Tuple


class ResponseCache:
    def __init__(self, max_size: int = 1000, ttl: int = 60):
        self.max_size = max_size
        self.ttl = ttl
        self._cache: Dict[str, Tuple[float, Any]] = {}

    def _get_key(self, method: str, endpoint: str, params: Optional[Dict] = None) -> str:
        param_str = "&".join([f"{k}={v}" for k, v in sorted(params.items())]) if params else ""
        return f"{method}:{endpoint}:{param_str}"

    def get(self, method: str, endpoint: str, params: Optional[Dict] = None) -> Optional[Any]:
        key = self._get_key(method, endpoint, params)
        if key in self._cache:
            timestamp, data = self._cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self._cache[key]
        return None

    def set(self, method: str, endpoint: str, data: Any, params: Optional[Dict] = None):
        if len(self._cache) >= self.max_size:
            # Simple eviction: remove oldest
            self._cache.pop(next(iter(self._cache)))

        key = self._get_key(method, endpoint, params)
        self._cache[key] = (time.time(), data)
