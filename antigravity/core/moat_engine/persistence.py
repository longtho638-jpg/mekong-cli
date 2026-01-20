"""
🏰 Moat Persistence Logic
"""
import json
import logging
from pathlib import Path
from typing import Dict

from .models import Moat

# Configure logging
logger = logging.getLogger(__name__)


class MoatPersistence:
    """Handles storage of moat metrics."""

    def __init__(self, storage_path: Path):
        self.data_file = storage_path / "moats_v2.json"

    def save(self, moats: Dict[str, Moat]) -> None:
        """Persists moat metrics to disk."""
        try:
            data = {k: {"s": v.strength, "m": v.metrics} for k, v in moats.items()}
            self.data_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save moat engine data: {e}")

    def load(self, moats: Dict[str, Moat]) -> None:
        """Loads moat metrics from disk into existing Moat objects."""
        if not self.data_file.exists():
            return
        try:
            raw = json.loads(self.data_file.read_text(encoding="utf-8"))
            for k, v in raw.items():
                if k in moats:
                    moats[k].strength = v.get("s", 0)
                    moats[k].metrics.update(v.get("m", {}))
        except Exception as e:
            logger.warning(f"Failed to load moat data: {e}")
