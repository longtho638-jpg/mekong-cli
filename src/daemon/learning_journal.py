"""
Learning Journal — Mission telemetry logging and stats aggregation.

Features:
- Logs all missions with context, outcome, metrics
- Daily stats aggregation
- Pattern extraction from successful missions
- 90-day retention with auto-archive

Usage:
  journal = LearningJournal()
  journal.log_mission(task_id="abc123", status="success", duration_ms=5000)
  stats = journal.get_daily_stats()
  patterns = journal.extract_patterns()
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"
JOURNAL_DIR = MEKONG_DIR / "journal"
JOURNAL_FILE = JOURNAL_DIR / "missions.json"
STATS_FILE = JOURNAL_DIR / "daily_stats.json"
INSIGHTS_FILE = JOURNAL_DIR / "insights.json"

# Ensure directories exist
JOURNAL_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class MissionEntry:
    """A single mission entry in the journal."""

    task_id: str
    description: str
    status: str  # success, failed, cancelled
    created_at: str
    started_at: str | None
    completed_at: str | None
    duration_ms: int
    worker: str | None
    capability: str
    priority: str
    error: str | None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "task_id": self.task_id,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "duration_ms": self.duration_ms,
            "worker": self.worker,
            "capability": self.capability,
            "priority": self.priority,
            "error": self.error,
            "metadata": self.metadata,
        }


@dataclass
class DailyStats:
    """Aggregated stats for a single day."""

    date: str
    total_missions: int = 0
    successful: int = 0
    failed: int = 0
    cancelled: int = 0
    avg_duration_ms: float = 0.0
    total_duration_ms: int = 0
    success_rate: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "date": self.date,
            "total_missions": self.total_missions,
            "successful": self.successful,
            "failed": self.failed,
            "cancelled": self.cancelled,
            "avg_duration_ms": round(self.avg_duration_ms, 2),
            "total_duration_ms": self.total_duration_ms,
            "success_rate": round(self.success_rate, 2),
        }


class LearningJournal:
    """
    Persistent journal for mission telemetry and learning.

    Stores:
    - All mission history in missions.json
    - Daily aggregated stats in daily_stats.json
    - Learning insights in insights.json
    """

    def __init__(self, retention_days: int = 90) -> None:
        self.retention_days = retention_days
        self._missions: list[MissionEntry] = []
        self._daily_stats: dict[str, DailyStats] = {}
        self._insights: list[dict] = []
        self._load()

    def _load(self) -> None:
        """Load journal from disk."""
        # Load missions
        if JOURNAL_FILE.exists():
            try:
                data = json.loads(JOURNAL_FILE.read_text())
                self._missions = [
                    MissionEntry(
                        task_id=m["task_id"],
                        description=m["description"],
                        status=m["status"],
                        created_at=m.get("created_at", ""),
                        started_at=m.get("started_at"),
                        completed_at=m.get("completed_at"),
                        duration_ms=m.get("duration_ms", 0),
                        worker=m.get("worker"),
                        capability=m.get("capability", "general"),
                        priority=m.get("priority", "MEDIUM"),
                        error=m.get("error"),
                        metadata=m.get("metadata", {}),
                    )
                    for m in data.get("missions", [])
                ]
                logger.info(f"[LearningJournal] Loaded {len(self._missions)} missions")
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"[LearningJournal] Failed to load journal: {e}")
                self._missions = []

        # Load daily stats
        if STATS_FILE.exists():
            try:
                data = json.loads(STATS_FILE.read_text())
                self._daily_stats = {
                    date: DailyStats(
                        date=date,
                        total_missions=s.get("total_missions", 0),
                        successful=s.get("successful", 0),
                        failed=s.get("failed", 0),
                        cancelled=s.get("cancelled", 0),
                        avg_duration_ms=s.get("avg_duration_ms", 0),
                        total_duration_ms=s.get("total_duration_ms", 0),
                        success_rate=s.get("success_rate", 0),
                    )
                    for date, s in data.get("stats", {}).items()
                }
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"[LearningJournal] Failed to load daily stats: {e}")

        # Load insights
        if INSIGHTS_FILE.exists():
            try:
                self._insights = json.loads(INSIGHTS_FILE.read_text()).get("insights", [])
            except (json.JSONDecodeError, KeyError):
                self._insights = []

    def _save(self) -> None:
        """Save journal to disk."""
        # Save missions (keep last 1000)
        missions_data = {"missions": [m.to_dict() for m in self._missions[-1000:]]}
        JOURNAL_FILE.write_text(json.dumps(missions_data, indent=2))

        # Save daily stats
        stats_data = {"stats": {date: s.to_dict() for date, s in self._daily_stats.items()}}
        STATS_FILE.write_text(json.dumps(stats_data, indent=2))

        # Save insights (keep last 100)
        insights_data = {"insights": self._insights[-100:]}
        INSIGHTS_FILE.write_text(json.dumps(insights_data, indent=2))

    def log_mission(
        self,
        task_id: str,
        description: str,
        status: str,
        duration_ms: int = 0,
        worker: str | None = None,
        capability: str = "general",
        priority: str = "MEDIUM",
        error: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        Log a mission to the journal.

        Args:
            task_id: Unique task identifier
            description: Task description
            status: success, failed, or cancelled
            duration_ms: Mission duration in milliseconds
            worker: Worker that executed the mission
            capability: Worker capability used
            priority: Task priority level
            error: Error message if failed
            metadata: Additional metadata
        """
        now = datetime.now().isoformat()

        entry = MissionEntry(
            task_id=task_id,
            description=description,
            status=status,
            created_at=now,
            started_at=now if status != "cancelled" else None,
            completed_at=now if status in ["success", "failed"] else None,
            duration_ms=duration_ms,
            worker=worker,
            capability=capability,
            priority=priority,
            error=error,
            metadata=metadata or {},
        )

        self._missions.append(entry)
        logger.info(f"[LearningJournal] Logged mission {task_id} ({status})")

        # Update daily stats
        self._update_daily_stats(entry)

        # Save to disk
        self._save()

        # Archive old entries
        self._archive_old_entries()

    def _update_daily_stats(self, entry: MissionEntry) -> None:
        """Update daily stats for the entry's date."""
        date = entry.created_at[:10]  # YYYY-MM-DD

        if date not in self._daily_stats:
            self._daily_stats[date] = DailyStats(date=date)

        stats = self._daily_stats[date]
        stats.total_missions += 1

        if entry.status == "success":
            stats.successful += 1
        elif entry.status == "failed":
            stats.failed += 1
        elif entry.status == "cancelled":
            stats.cancelled += 1

        stats.total_duration_ms += entry.duration_ms
        stats.avg_duration_ms = stats.total_duration_ms / stats.total_missions
        stats.success_rate = (stats.successful / stats.total_missions * 100) if stats.total_missions > 0 else 0

    def _archive_old_entries(self) -> None:
        """Archive entries older than retention period."""
        cutoff = datetime.now() - timedelta(days=self.retention_days)
        cutoff_str = cutoff.isoformat()

        original_count = len(self._missions)
        self._missions = [m for m in self._missions if m.created_at > cutoff_str]

        if len(self._missions) < original_count:
            archived = original_count - len(self._missions)
            logger.info(f"[LearningJournal] Archived {archived} old entries")

    def get_missions(
        self,
        limit: int = 100,
        status: str | None = None,
        capability: str | None = None,
    ) -> list[dict]:
        """
        Get missions from the journal.

        Args:
            limit: Maximum number of missions to return
            status: Filter by status (success, failed, cancelled)
            capability: Filter by capability

        Returns:
            List of mission dictionaries.
        """
        missions = self._missions

        if status:
            missions = [m for m in missions if m.status == status]
        if capability:
            missions = [m for m in missions if m.capability == capability]

        # Sort by created_at descending
        missions = sorted(missions, key=lambda m: m.created_at, reverse=True)

        return [m.to_dict() for m in missions[:limit]]

    def get_daily_stats(self, days: int = 30) -> list[dict]:
        """
        Get daily stats for the last N days.

        Args:
            days: Number of days to return

        Returns:
            List of daily stats dictionaries.
        """
        cutoff = datetime.now() - timedelta(days=days)
        cutoff_str = cutoff.strftime("%Y-%m-%d")

        stats = [
            s.to_dict()
            for date, s in self._daily_stats.items()
            if date >= cutoff_str
        ]
        return sorted(stats, key=lambda s: s["date"], reverse=True)

    def get_summary(self) -> dict[str, Any]:
        """Get summary statistics."""
        total = len(self._missions)
        if total == 0:
            return {
                "total_missions": 0,
                "success_rate": 0,
                "avg_duration_ms": 0,
                "total_duration_ms": 0,
            }

        successful = sum(1 for m in self._missions if m.status == "success")
        total_duration = sum(m.duration_ms for m in self._missions)

        return {
            "total_missions": total,
            "successful": successful,
            "failed": sum(1 for m in self._missions if m.status == "failed"),
            "cancelled": sum(1 for m in self._missions if m.status == "cancelled"),
            "success_rate": round(successful / total * 100, 2),
            "avg_duration_ms": round(total_duration / total, 2),
            "total_duration_ms": total_duration,
        }

    def add_insight(self, insight_type: str, description: str, data: dict[str, Any] | None = None) -> None:
        """
        Add a learning insight.

        Args:
            insight_type: Type of insight (pattern, improvement, observation)
            description: Insight description
            data: Optional structured data
        """
        self._insights.append({
            "timestamp": datetime.now().isoformat(),
            "type": insight_type,
            "description": description,
            "data": data or {},
        })
        self._save()

    def get_insights(self, limit: int = 20) -> list[dict]:
        """Get recent insights."""
        return self._insights[-limit:]

    def clear(self) -> None:
        """Clear all journal data."""
        self._missions.clear()
        self._daily_stats.clear()
        self._insights.clear()
        self._save()
        logger.info("[LearningJournal] Cleared all data")
