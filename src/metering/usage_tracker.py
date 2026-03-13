"""
Usage Tracker — ROIaaS Phase 4

Tracks CLI command usage per license key:
- Command invocations (cook, plan, fix, etc.)
- Agent calls (planner, researcher, fullstack-developer, etc.)
- Pipeline runs (PEV cycles)
- Free tier enforcement: 10 commands/day

Storage: SQLite (~/.mekong/raas/tenants.db)

Usage:
    from src.metering.usage_tracker import UsageTracker
    tracker = UsageTracker()
    tracker.track_command("license-123", "cook")
    usage = tracker.get_daily_usage("license-123")
"""

import sqlite3
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any


# Free tier limits
FREE_TIER_LIMITS = {
    "commands_per_day": 10,
    "agents_per_day": 5,
    "pipelines_per_day": 3,
}


@dataclass
class DailyUsage:
    """Daily usage summary."""
    date: str  # YYYY-MM-DD
    total_commands: int = 0
    total_agents: int = 0
    total_pipelines: int = 0
    command_breakdown: Dict[str, int] = field(default_factory=dict)
    agent_breakdown: Dict[str, int] = field(default_factory=dict)


@dataclass
class UsageReport:
    """Multi-day usage report."""
    license_key_hash: str
    period_days: int
    total_commands: int
    total_agents: int
    total_pipelines: int
    daily_reports: List[DailyUsage] = field(default_factory=list)


class UsageTracker:
    """SQLite-backed usage tracker."""

    def __init__(self, db_path: Optional[Path] = None) -> None:
        """Initialize usage tracker.

        Args:
            db_path: Optional database path override for testing.
        """
        if db_path is None:
            db_path = Path.home() / ".mekong" / "raas" / "tenants.db"

        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(self._db_path), timeout=10)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self) -> None:
        """Create usage_events table if not exists."""
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS usage_events (
                id TEXT PRIMARY KEY,
                license_key_hash TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_name TEXT NOT NULL,
                units INTEGER NOT NULL DEFAULT 1,
                metadata TEXT,
                timestamp TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_usage_license_date
            ON usage_events(license_key_hash, substr(timestamp, 1, 10));

            CREATE INDEX IF NOT EXISTS idx_usage_type
            ON usage_events(event_type);
        """)

    def _hash_license_key(self, license_key: str) -> str:
        """Hash license key for privacy."""
        return hashlib.sha256(license_key.encode()).hexdigest()

    def track_command(
        self,
        license_key: str,
        command: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Track a command execution."""
        self._track_event(
            license_key,
            "command",
            command,
            metadata=metadata,
        )

    def track_agent_call(
        self,
        license_key: str,
        agent_name: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Track an agent call."""
        self._track_event(
            license_key,
            "agent_call",
            agent_name,
            metadata=metadata,
        )

    def track_pipeline_run(
        self,
        license_key: str,
        pipeline_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Track a pipeline run."""
        self._track_event(
            license_key,
            "pipeline_run",
            pipeline_type,
            metadata=metadata,
        )

    def _track_event(
        self,
        license_key: str,
        event_type: str,
        event_name: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Internal: Track a usage event."""
        import uuid

        license_key_hash = self._hash_license_key(license_key)
        event_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        self._conn.execute(
            """
            INSERT INTO usage_events
            (id, license_key_hash, event_type, event_name, units, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                license_key_hash,
                event_type,
                event_name,
                1,
                str(metadata or {}),
                timestamp,
            ),
        )
        self._conn.commit()

    def get_daily_usage(
        self,
        license_key: str,
        date: Optional[str] = None,
    ) -> DailyUsage:
        """Get daily usage for a license key."""
        license_key_hash = self._hash_license_key(license_key)
        target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Get commands
        cmd_rows = self._conn.execute(
            """
            SELECT event_name, SUM(units) as count
            FROM usage_events
            WHERE license_key_hash = ?
              AND event_type = 'command'
              AND substr(timestamp, 1, 10) = ?
            GROUP BY event_name
            """,
            (license_key_hash, target_date),
        ).fetchall()

        # Get agents
        agent_rows = self._conn.execute(
            """
            SELECT event_name, SUM(units) as count
            FROM usage_events
            WHERE license_key_hash = ?
              AND event_type = 'agent_call'
              AND substr(timestamp, 1, 10) = ?
            GROUP BY event_name
            """,
            (license_key_hash, target_date),
        ).fetchall()

        # Get pipelines
        pipeline_row = self._conn.execute(
            """
            SELECT SUM(units) as count
            FROM usage_events
            WHERE license_key_hash = ?
              AND event_type = 'pipeline_run'
              AND substr(timestamp, 1, 10) = ?
            """,
            (license_key_hash, target_date),
        ).fetchone()

        # Build result
        command_breakdown: Dict[str, int] = {}
        total_commands = 0
        for row in cmd_rows:
            command_breakdown[row["event_name"]] = row["count"] or 0
            total_commands += row["count"] or 0

        agent_breakdown: Dict[str, int] = {}
        total_agents = 0
        for row in agent_rows:
            agent_breakdown[row["event_name"]] = row["count"] or 0
            total_agents += row["count"] or 0

        return DailyUsage(
            date=target_date,
            total_commands=total_commands,
            total_agents=total_agents,
            total_pipelines=pipeline_row["count"] or 0 if pipeline_row else 0,
            command_breakdown=command_breakdown,
            agent_breakdown=agent_breakdown,
        )

    def is_free_tier_exceeded(
        self,
        license_key: str,
        date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Check if free tier limit exceeded."""
        usage = self.get_daily_usage(license_key, date)

        if usage.total_commands >= FREE_TIER_LIMITS["commands_per_day"]:
            return {
                "exceeded": True,
                "reason": f"Command limit exceeded: {usage.total_commands}/{FREE_TIER_LIMITS['commands_per_day']}",
            }

        if usage.total_agents >= FREE_TIER_LIMITS["agents_per_day"]:
            return {
                "exceeded": True,
                "reason": f"Agent limit exceeded: {usage.total_agents}/{FREE_TIER_LIMITS['agents_per_day']}",
            }

        if usage.total_pipelines >= FREE_TIER_LIMITS["pipelines_per_day"]:
            return {
                "exceeded": True,
                "reason": f"Pipeline limit exceeded: {usage.total_pipelines}/{FREE_TIER_LIMITS['pipelines_per_day']}",
            }

        return {"exceeded": False}

    def get_free_tier_remaining(self, usage: DailyUsage) -> Dict[str, int]:
        """Get remaining free tier quota."""
        return {
            "commands_remaining": max(0, FREE_TIER_LIMITS["commands_per_day"] - usage.total_commands),
            "agents_remaining": max(0, FREE_TIER_LIMITS["agents_per_day"] - usage.total_agents),
            "pipelines_remaining": max(0, FREE_TIER_LIMITS["pipelines_per_day"] - usage.total_pipelines),
        }

    def get_usage_report(self, license_key: str, days: int = 7) -> UsageReport:
        """Get multi-day usage report."""
        from datetime import timedelta

        today = datetime.now(timezone.utc)
        daily_reports: List[DailyUsage] = []
        total_commands = 0
        total_agents = 0
        total_pipelines = 0

        for i in range(days):
            date = today - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            daily_usage = self.get_daily_usage(license_key, date_str)
            daily_reports.append(daily_usage)
            total_commands += daily_usage.total_commands
            total_agents += daily_usage.total_agents
            total_pipelines += daily_usage.total_pipelines

        return UsageReport(
            license_key_hash=self._hash_license_key(license_key),
            period_days=days,
            total_commands=total_commands,
            total_agents=total_agents,
            total_pipelines=total_pipelines,
            daily_reports=daily_reports,
        )

    def close(self) -> None:
        """Close database connection."""
        self._conn.close()


# Singleton instance
_tracker: Optional[UsageTracker] = None


def get_tracker() -> UsageTracker:
    """Get global usage tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = UsageTracker()
    return _tracker
