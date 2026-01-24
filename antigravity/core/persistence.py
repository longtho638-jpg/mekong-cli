"""
💾 Persistence - Multi-Format Data Storage
==========================================

Provides robust, atomic data persistence for all Agency OS modules.
Handles serialization of complex types (datetimes, enums, models) and
ensures data integrity during concurrent operations.

Primary Storage: 📦 JSON (Local)
Future Support:  ☁️ Supabase / Postgres

Binh Pháp: 🏰 Nền Tảng (Foundation) - Building secure and reliable storage.
"""

import json
import logging
import os
import tempfile
from dataclasses import asdict, is_dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, List, Optional, TypeVar, Union

from .errors import PersistenceError

# Configure logging
logger = logging.getLogger(__name__)

T = TypeVar("T")


class JSONStore:
    """
    📦 Atomic JSON Storage

    Ensures that data is written successfully to a temporary file
    before replacing the target file, preventing corruption.
    """

    def __init__(self, data_dir: Union[str, Path] = ".antigravity/data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, key: str) -> Path:
        """Determines the full filesystem path for a given storage key."""
        filename = key if key.endswith(".json") else f"{key}.json"
        return self.data_dir / filename

    def save(self, key: str, data: Any) -> Path:
        """
        Persists data to disk using an atomic write strategy.
        Supports complex types through custom serialization.
        """
        path = self._resolve_path(key)

        # Use a temporary file for atomic write
        fd, temp_path = tempfile.mkstemp(dir=self.data_dir, prefix=f"tmp_{key}_")

        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(
                    data, f, ensure_ascii=False, indent=2, default=self._serialize_complex_types
                )

            # Atomic swap
            os.replace(temp_path, path)
            return path

        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            logger.error(f"Persistence write failure for {key}: {e}")
            raise PersistenceError(
                f"Failed to save data for {key}: {e}", operation="write", path=path
            )

    def load(self, key: str, default: Any = None) -> Any:
        """Retrieves and parses data from disk."""
        path = self._resolve_path(key)
        if not path.exists():
            return default

        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            logger.warning(f"Data corruption detected in {key}: {e}")
            return default
        except Exception as e:
            logger.error(f"Persistence read failure for {key}: {e}")
            raise PersistenceError(
                f"Failed to load data for {key}: {e}", operation="read", path=path
            )

    def exists(self, key: str) -> bool:
        """Checks for the existence of a data file."""
        return self._resolve_path(key).exists()

    def delete(self, key: str) -> bool:
        """Deletes a data file from storage."""
        path = self._resolve_path(key)
        if path.exists():
            try:
                path.unlink()
                return True
            except Exception as e:
                logger.error(f"Failed to delete {key}: {e}")
                return False
        return False

    def list_keys(self) -> List[str]:
        """Returns a list of all identifiers currently in storage."""
        return [p.stem for p in self.data_dir.glob("*.json")]

    @staticmethod
    def _serialize_complex_types(obj: Any) -> Any:
        """Helper to convert Python types into JSON-compatible primitives."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Enum):
            return obj.value
        if is_dataclass(obj) and not isinstance(obj, type):
            return asdict(obj)  # type: ignore[call-overload]
        if hasattr(obj, "to_dict"):
            return obj.to_dict()
        if hasattr(obj, "__dict__"):
            return obj.__dict__
        return str(obj)


# --- Unified Access Points ---

_primary_store: Optional[JSONStore] = None


def get_persistence_store(directory: Optional[str] = None) -> JSONStore:
    """Singleton access to the primary persistence layer."""
    global _primary_store
    if _primary_store is None:
        _primary_store = JSONStore(directory or ".antigravity/persistence")
    return _primary_store


def persist_save(key: str, data: Any):
    """Convenience wrapper for saving data to the primary store."""
    return get_persistence_store().save(key, data)


def persist_load(key: str, default: Any = None) -> Any:
    """Convenience wrapper for loading data from the primary store."""
    return get_persistence_store().load(key, default)
