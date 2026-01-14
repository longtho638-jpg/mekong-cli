"""
Persistence layer for AntigravityKit.

Provides JSON-based data storage for all modules.

🏯 "Lưu trữ vững bền" - Persistent storage
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, TypeVar, Type
from dataclasses import asdict

from .errors import PersistenceError


T = TypeVar('T')


class JSONStore:
    """
    JSON-based data store.
    
    Example:
        store = JSONStore(".antigravity/data")
        store.save("clients", [{"name": "ABC"}])
        data = store.load("clients", [])
    """

    def __init__(self, data_dir: str = ".antigravity"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _get_path(self, key: str) -> Path:
        """Get file path for a key."""
        if not key.endswith('.json'):
            key = f"{key}.json"
        return self.data_dir / key

    def save(self, key: str, data: Any) -> Path:
        """Save data to JSON file."""
        path = self._get_path(key)
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=self._serialize)
            return path
        except Exception as e:
            raise PersistenceError(f"Failed to save: {e}", str(path))

    def load(self, key: str, default: Any = None) -> Any:
        """Load data from JSON file."""
        path = self._get_path(key)
        if not path.exists():
            return default
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            raise PersistenceError(f"Failed to load: {e}", str(path))

    def exists(self, key: str) -> bool:
        """Check if data exists."""
        return self._get_path(key).exists()

    def delete(self, key: str) -> bool:
        """Delete data file."""
        path = self._get_path(key)
        if path.exists():
            path.unlink()
            return True
        return False

    def list_keys(self) -> List[str]:
        """List all stored keys."""
        return [p.stem for p in self.data_dir.glob("*.json")]

    @staticmethod
    def _serialize(obj: Any) -> Any:
        """Serialize complex objects."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return str(obj)


# Convenience functions
_default_store: Optional[JSONStore] = None


def get_store(data_dir: str = ".antigravity") -> JSONStore:
    """Get or create default store."""
    global _default_store
    if _default_store is None:
        _default_store = JSONStore(data_dir)
    return _default_store


def save_data(key: str, data: Any, data_dir: str = ".antigravity") -> Path:
    """Save data to default store."""
    return get_store(data_dir).save(key, data)


def load_data(key: str, default: Any = None, data_dir: str = ".antigravity") -> Any:
    """Load data from default store."""
    return get_store(data_dir).load(key, default)
