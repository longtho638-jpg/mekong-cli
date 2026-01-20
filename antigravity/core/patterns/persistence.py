"""
Base Persistence Pattern - Standardized JSON-based file storage.

Provides a common interface for engines that need to persist state to disk.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class BasePersistence:
    """
    Base class for JSON-based persistence.

    Provides save/load operations for engine state using JSON files.
    Automatically creates storage directories if they don't exist.

    Example:
        class MyEnginePersistence(BasePersistence):
            def __init__(self, data_dir: Path):
                super().__init__(data_dir, "my_engine.json")
    """

    def __init__(self, storage_path: Path, filename: str = "data.json"):
        self.storage_path = Path(storage_path)
        self.filepath = self.storage_path / filename
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def save(self, data: Dict[str, Any]) -> None:
        """Persists data to JSON file."""
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str, ensure_ascii=False)
            logger.debug(f"Saved state to {self.filepath}")
        except Exception as e:
            logger.error(f"Failed to save to {self.filepath}: {e}")
            raise

    def load(self) -> Dict[str, Any]:
        """Loads data from JSON file, returns empty dict if not found."""
        if not self.filepath.exists():
            return {}
        try:
            with open(self.filepath, encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load from {self.filepath}: {e}")
            return {}
