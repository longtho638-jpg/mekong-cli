"""Mekong CLI - Memory Store.

Long-term execution memory with YAML persistence.
Records goal outcomes, enables history queries and fix suggestions.

Vector backend (Mem0 + Qdrant) is used when available; falls back to YAML.
"""

from __future__ import annotations

import threading
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]

from .event_bus import EventType, get_event_bus

try:
    from packages.memory.memory_facade import get_memory_facade as _get_facade
    _FACADE_AVAILABLE = True
except ImportError:
    _FACADE_AVAILABLE = False


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

    def __init__(self, store_path: str | None = None, sync_save: bool = False) -> None:
        """Initialize memory store.

        Args:
            store_path: Path to YAML file. Defaults to .mekong/memory.yaml
            sync_save: If True, save synchronously (for testing).

        """
        self._path = Path(store_path) if store_path else Path(".mekong/memory.yaml")
        self._sync_save = sync_save  # Flag for testing
        self._entries: list[MemoryEntry] = []
        self._load()

    def record(self, entry: MemoryEntry) -> None:
        """Record an execution outcome and persist (async I/O)."""
        self._entries.append(entry)
        self._evict()
        bus = get_event_bus()
        bus.emit(EventType.MEMORY_RECORDED, asdict(entry))

        # Async save — không block main thread (daemon thread)
        # Unless sync_save flag is set (for testing)
        if self._sync_save:
            self._save()
        else:
            threading.Thread(target=self._save, daemon=True).start()

        # Mirror to vector backend when available (best-effort, non-blocking)
        if _FACADE_AVAILABLE:
            try:
                facade = _get_facade()
                content = (
                    f"goal={entry.goal} status={entry.status} "
                    f"error={entry.error_summary} recipe={entry.recipe_used}"
                )
                facade.add(
                    content,
                    user_id="mekong:memory",
                    metadata={
                        "status": entry.status,
                        "recipe_used": entry.recipe_used,
                        "duration_ms": entry.duration_ms,
                        "timestamp": entry.timestamp,
                    },
                )
            except Exception as e:
                import logging
                logging.debug(f"Vector add failed: {e}")
                pass  # Vector failure never disrupts YAML persistence

    def flush(self) -> None:
        """Force synchronous save (for testing)."""
        self._save()

    def query(self, goal_pattern: str) -> list[MemoryEntry]:
        """Find entries matching goal pattern.

        Prefers semantic vector search (Mem0/Qdrant) when available.
        Falls back to case-insensitive substring match against YAML store.
        """
        if _FACADE_AVAILABLE:
            try:
                facade = _get_facade()
                hits = facade.search(goal_pattern, user_id="mekong:memory")
                if hits:
                    # Extract goals from vector results and match to local entries
                    matched_goals = {
                        h.get("memory", "").split("goal=")[-1].split(" status=")[0]
                        for h in hits
                    }
                    matched = [e for e in self._entries if e.goal in matched_goals]
                    if matched:
                        return matched
            except Exception as e:
                import logging
                logging.debug(f"Vector search failed: {e}")
                pass  # Fall through to substring search

        # YAML substring fallback
        pattern = goal_pattern.lower()
        return [e for e in self._entries if pattern in e.goal.lower()]

    def get_success_rate(self, goal_pattern: str = "") -> float:
        """Calculate success rate (0-100) for entries matching pattern."""
        entries = self.query(goal_pattern) if goal_pattern else self._entries
        if not entries:
            return 0.0
        successes = sum(1 for e in entries if e.status == "success")
        return (successes / len(entries)) * 100

    def get_last_failure(self, goal_pattern: str = "") -> MemoryEntry | None:
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

    def recent(self, limit: int = 20) -> list[MemoryEntry]:
        """Return most recent entries."""
        return self._entries[-limit:]

    def stats(self) -> dict[str, Any]:
        """Return aggregate statistics."""
        goal_counts: dict[str, int] = {}
        for e in self._entries:
            goal_counts[e.goal] = goal_counts.get(e.goal, 0) + 1
        top_goals = sorted(goal_counts, key=lambda k: goal_counts[k], reverse=True)[:5]
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
