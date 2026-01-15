"""
Infrastructure - Cache System
"""
import json
import logging
import os
import time
from typing import Any, Optional, Dict
from pathlib import Path

logger = logging.getLogger(__name__)

class CacheManager:
    """
    Simple file-based caching for CLI operations.
    Useful for persisting Binh Phap analysis or API results between runs.
    """
    
    def __init__(self, cache_dir: str = ".mekong/cache", ttl: int = 3600):
        self.cache_dir = Path.home() / cache_dir
        self.ttl = ttl
        self._ensure_dir()
        
    def _ensure_dir(self):
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
    def get(self, key: str) -> Optional[Any]:
        """Retrieve a value from cache if valid."""
        file_path = self.cache_dir / f"{key}.json"
        if not file_path.exists():
            return None
            
        try:
            data = json.loads(file_path.read_text())
            if time.time() - data['timestamp'] > self.ttl:
                file_path.unlink() # Expired
                return None
            return data['payload']
        except Exception:
            return None
            
    def set(self, key: str, value: Any):
        """Save a value to cache."""
        file_path = self.cache_dir / f"{key}.json"
        try:
            data = {
                'timestamp': time.time(),
                'payload': value
            }
            file_path.write_text(json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to cache {key}: {e}")

    def clear(self):
        """Clear all cache."""
        for f in self.cache_dir.glob("*.json"):
            f.unlink()
