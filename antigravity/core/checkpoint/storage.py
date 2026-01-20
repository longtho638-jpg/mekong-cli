"""
Checkpoint Storage - File I/O operations for checkpoints.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from .models import SessionState

logger = logging.getLogger(__name__)


class CheckpointStorage:
    """Handles checkpoint file operations."""

    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_path / "index.json"

    def write_checkpoint(self, state: SessionState):
        """Physical write of state to a dedicated JSON file."""
        ts = state.timestamp.strftime("%Y%m%d_%H%M%S")
        filename = f"cp_{state.name}_{ts}.json"
        path = self.storage_path / filename

        payload = {
            "name": state.name,
            "description": state.description,
            "timestamp": state.timestamp.isoformat(),
            "version": state.version,
            "data": state.data,
        }

        path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")

    def load_checkpoint(self, name: str) -> Optional[SessionState]:
        """Loads full data for a specific checkpoint name."""
        files = list(self.storage_path.glob(f"cp_{name}_*.json"))
        if not files:
            return None

        # Take most recent if multiple exist for same name
        target_file = sorted(files)[-1]
        try:
            raw = json.loads(target_file.read_text(encoding="utf-8"))
            return SessionState(
                name=raw["name"],
                timestamp=datetime.fromisoformat(raw["timestamp"]),
                description=raw.get("description", ""),
                data=raw.get("data", {}),
                version=raw.get("version", "1.0"),
            )
        except Exception as e:
            logger.error(f"Failed to read checkpoint file {target_file.name}: {e}")
            return None

    def delete_files(self, name: str):
        """Cleans up checkpoint files matching the name pattern."""
        for f in self.storage_path.glob(f"cp_{name}_*.json"):
            f.unlink()

    def save_index(self, checkpoints: list):
        """Saves the metadata index for fast listing."""
        index = [
            {"name": cp.name, "ts": cp.timestamp.isoformat(), "desc": cp.description}
            for cp in checkpoints
        ]
        self.index_file.write_text(json.dumps(index, indent=2), encoding="utf-8")

    def load_index(self) -> list:
        """Loads checkpoint metadata on startup."""
        if not self.index_file.exists():
            return []

        try:
            data = json.loads(self.index_file.read_text(encoding="utf-8"))
            return [
                SessionState(
                    name=item["name"],
                    timestamp=datetime.fromisoformat(item["ts"]),
                    description=item.get("desc", ""),
                    data={},  # Lazy load full data
                )
                for item in data
            ]
        except Exception:
            return []
