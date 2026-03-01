"""
Mekong Daemon - Learning Journal

Records mission outcomes for analysis and self-improvement.
Appends JSON records to a journal file.
"""

import json
import logging
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class JournalEntry:
    """Single mission outcome record."""
    timestamp: float
    mission: str
    complexity: str
    success: bool
    duration: float
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class LearningJournal:
    """
    Append-only mission journal for telemetry and learning.

    Args:
        journal_path: Path to JSON-lines journal file
    """

    def __init__(self, journal_path: str = ".mekong/daemon-journal.jsonl") -> None:
        self._path = Path(journal_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def record(self, entry: JournalEntry) -> None:
        """Append entry to journal."""
        try:
            with open(self._path, "a") as f:
                f.write(json.dumps(asdict(entry)) + "\n")
        except Exception as e:
            logger.warning("Journal write failed: %s", e)

    def record_mission(
        self, mission: str, complexity: str, success: bool,
        duration: float, error: Optional[str] = None,
    ) -> None:
        """Convenience method to record a mission outcome."""
        self.record(JournalEntry(
            timestamp=time.time(), mission=mission[:200],
            complexity=complexity, success=success,
            duration=round(duration, 2), error=error,
        ))

    def recent(self, limit: int = 20) -> List[JournalEntry]:
        """Read last N journal entries."""
        if not self._path.exists():
            return []
        entries = []
        try:
            with open(self._path) as f:
                for line in f:
                    line = line.strip()
                    if line:
                        entries.append(JournalEntry(**json.loads(line)))
        except Exception as e:
            logger.warning("Journal read failed: %s", e)
        return entries[-limit:]

    def success_rate(self) -> float:
        """Calculate overall success rate."""
        entries = self.recent(100)
        if not entries:
            return 0.0
        successes = sum(1 for e in entries if e.success)
        return round(successes / len(entries), 3)


__all__ = ["LearningJournal", "JournalEntry"]
