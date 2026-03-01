"""
Mekong Daemon - Dead Letter Queue

Failed missions (after max retries) are moved here for manual review.
"""

import logging
import shutil
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)


class DeadLetterQueue:
    """
    Stores failed missions for manual triage.

    Args:
        dlq_dir: Directory for dead-letter files
    """

    def __init__(self, dlq_dir: str = "./tasks/dead-letter") -> None:
        self._dir = Path(dlq_dir)
        self._dir.mkdir(parents=True, exist_ok=True)

    def move_to_dlq(self, filepath: Path, reason: str = "") -> Path:
        """Move failed mission file to dead-letter directory."""
        dest = self._dir / filepath.name
        try:
            shutil.move(str(filepath), str(dest))
            if reason:
                meta = dest.with_suffix(dest.suffix + ".reason")
                meta.write_text(reason)
            logger.info("Mission moved to DLQ: %s (%s)", filepath.name, reason)
        except Exception as e:
            logger.error("DLQ move failed: %s", e)
        return dest

    def list_dead_letters(self) -> List[Path]:
        """List all files in dead-letter queue."""
        return sorted(f for f in self._dir.iterdir() if f.is_file() and not f.name.endswith(".reason"))

    @property
    def count(self) -> int:
        return len(self.list_dead_letters())


__all__ = ["DeadLetterQueue"]
