"""
Mekong CLI - Memory Store

Long-term execution memory with YAML persistence.
Records goal outcomes, enables history queries and fix suggestions.
"""

import time
import yaml
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional

from .event_bus import EventType, get_event_bus


@dataclass
class MemoryEntry:
    """Single execution memory record."""

    goal: str
    status: str  # "success" | "failed" | "partial" | "rolled_back"
    timestamp: float = field(default_factory=time.time)
    duration_ms: float = 0.0
    error_summary: str = ""
    recipe_used: str = ""


class MemoryStore:
    """Long-term execution memory with YAML persistence."""

    MAX_ENTRIES: int = 500

    def __init__(self, store_path: Optional[str] = None) -> None:
        """
        Initialize memory store.

        Args:
            store_path: Path to YAML file. Defaults to .mekong/memory.yaml
        """
        self._path = Path(store_path) if store_path else Path(".mekong/memory.yaml")
        self._entries: List[MemoryEntry] = []
        self._load()

    def record(self, entry: MemoryEntry) -> None:
        """Record an execution outcome and persist."""
        self._entries.append(entry)
        self._evict()
        self._save()
        bus = get_event_bus()
        bus.emit(EventType.MEMORY_RECORDED, asdict(entry))

    def query(self, goal_pattern: str) -> List[MemoryEntry]:
        """Find entries matching goal pattern (case-insensitive substring)."""
        pattern = goal_pattern.lower()
        return [e for e in self._entries if pattern in e.goal.lower()]

    def get_success_rate(self, goal_pattern: str = "") -> float:
        """Calculate success rate (0-100) for entries matching pattern."""
        entries = self.query(goal_pattern) if goal_pattern else self._entries
        if not entries:
            return 0.0
        successes = sum(1 for e in entries if e.status == "success")
        return (successes / len(entries)) * 100

    def get_last_failure(self, goal_pattern: str = "") -> Optional[MemoryEntry]:
        """Get most recent failed entry matching pattern."""
        entries = self.query(goal_pattern) if goal_pattern else self._entries
        failures = [e for e in entries if e.status != "success"]
        return failures[-1] if failures else None

    def suggest_fix(self, goal: str) -> str:
        """Suggest fix based on historical failure patterns."""
        failures = [e for e in self.query(goal) if e.status != "success"]
        if not failures:
            return "No failure history found for this goal."
        recent = failures[-5:]
        errors = [e.error_summary for e in recent if e.error_summary]
        if not errors:
            return f"Goal failed {len(failures)} time(s) but no error details recorded."
        unique_errors = list(dict.fromkeys(errors))
        return f"Common errors ({len(failures)} failures): " + "; ".join(unique_errors[:3])

    def recent(self, limit: int = 20) -> List[MemoryEntry]:
        """Return most recent entries."""
        return self._entries[-limit:]

    def stats(self) -> Dict[str, Any]:
        """Return aggregate statistics."""
        goal_counts: Dict[str, int] = {}
        for e in self._entries:
            goal_counts[e.goal] = goal_counts.get(e.goal, 0) + 1
        top_goals = sorted(goal_counts, key=goal_counts.get, reverse=True)[:5]
        recent_failures = sum(
            1 for e in self._entries[-20:] if e.status != "success"
        )
        return {
            "total": len(self._entries),
            "success_rate": self.get_success_rate(),
            "top_goals": top_goals,
            "recent_failures": recent_failures,
        }

    def clear(self) -> None:
        """Remove all entries and delete persistence file."""
        self._entries.clear()
        if self._path.exists():
            self._path.unlink()

    def _load(self) -> None:
        """Load entries from YAML file."""
        if not self._path.exists():
            return
        try:
            data = yaml.safe_load(self._path.read_text()) or []
            self._entries = [MemoryEntry(**item) for item in data]
        except Exception:
            self._entries = []

    def _save(self) -> None:
        """Persist entries to YAML file."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        data = [asdict(e) for e in self._entries]
        self._path.write_text(yaml.dump(data, default_flow_style=False))

    def _evict(self) -> None:
        """Remove oldest entries when exceeding MAX_ENTRIES (FIFO)."""
        if len(self._entries) > self.MAX_ENTRIES:
            self._entries = self._entries[-self.MAX_ENTRIES:]


__all__ = [
    "MemoryEntry",
    "MemoryStore",
]
