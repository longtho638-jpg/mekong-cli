"""
Mekong Daemon - Task Watcher

Polls a directory for mission files (*.txt, *.json, *.md).
Yields discovered missions in FIFO order for dispatch.
"""

import logging
import time
from pathlib import Path
from typing import Iterator, List, Optional

logger = logging.getLogger(__name__)


class TaskWatcher:
    """
    Watches a directory for new mission files.

    Args:
        watch_dir: Directory to poll for mission files
        poll_interval: Seconds between polls (default: 5)
        patterns: Glob patterns for mission files
    """

    def __init__(
        self,
        watch_dir: str = "./tasks",
        poll_interval: float = 5.0,
        patterns: Optional[List[str]] = None,
    ) -> None:
        self._dir = Path(watch_dir)
        self._interval = poll_interval
        self._patterns = patterns or ["mission_*.txt", "mission_*.json", "*.md"]
        self._processed: set = set()
        self._dir.mkdir(parents=True, exist_ok=True)

    def scan_once(self) -> List[Path]:
        """Scan directory once for new mission files."""
        missions: List[Path] = []
        for pattern in self._patterns:
            for fpath in sorted(self._dir.glob(pattern)):
                if fpath.name not in self._processed and fpath.is_file():
                    missions.append(fpath)
        return missions

    def mark_processed(self, fpath: Path) -> None:
        """Mark a mission file as processed."""
        self._processed.add(fpath.name)

    def poll(self) -> Iterator[Path]:
        """
        Blocking iterator — yields mission files as they appear.
        Call in a loop or thread.
        """
        while True:
            missions = self.scan_once()
            for m in missions:
                yield m
            time.sleep(self._interval)

    def archive(self, fpath: Path) -> Path:
        """Move processed file to processed/ subdirectory."""
        archive_dir = self._dir / "processed"
        archive_dir.mkdir(exist_ok=True)
        dest = archive_dir / fpath.name
        fpath.rename(dest)
        self.mark_processed(fpath)
        return dest


__all__ = ["TaskWatcher"]
