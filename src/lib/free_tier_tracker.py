"""
Free Tier Usage Tracker — ROIaaS Phase 6

SQLite-based tracking for free tier users for analytics purposes.
Tracks command usage, session data, and feature adoption.
"""

import sqlite3
import json
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass


DB_PATH = Path.home() / ".mekong" / "raas" / "free_tier_analytics.db"


@dataclass
class FreeTierUsage:
    """Free tier usage record.

    Attributes:
        key_id: License key ID
        email: User email (if available)
        command: Command name executed
        command_cost: Credits consumed
        session_id: Session identifier
        created_at: ISO timestamp of usage
        metadata: Additional data (JSON)
    """
    key_id: str
    command: str
    command_cost: int = 1
    email: str = ""
    session_id: str = ""
    created_at: str = ""
    metadata: str = "{}"


_DDL = """
CREATE TABLE IF NOT EXISTS free_tier_usage (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id          TEXT NOT NULL,
    email           TEXT,
    command         TEXT NOT NULL,
    command_cost    INTEGER DEFAULT 1,
    session_id      TEXT,
    created_at      TEXT NOT NULL,
    metadata        TEXT DEFAULT '{}',
    synced          BOOLEAN DEFAULT FALSE,
    sync_attempted  INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ftu_key_id
    ON free_tier_usage (key_id);
CREATE INDEX IF NOT EXISTS idx_ftu_created_at
    ON free_tier_usage (created_at);
CREATE INDEX IF NOT EXISTS idx_ftu_synced
    ON free_tier_usage (synced);

CREATE TABLE IF NOT EXISTS free_tier_sessions (
    session_id      TEXT PRIMARY KEY,
    key_id          TEXT NOT NULL,
    started_at      TEXT NOT NULL,
    last_activity   TEXT,
    commands_count  INTEGER DEFAULT 0,
    total_credits   INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fts_key_id
    ON free_tier_sessions (key_id);
"""


class FreeTierTracker:
    """SQLite-based free tier usage tracker for analytics."""

    def __init__(self, db_path: Path = DB_PATH) -> None:
        """Initialize tracker.

        Args:
            db_path: SQLite database file path
        """
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Return WAL-mode SQLite connection."""
        conn = sqlite3.connect(str(self.db_path), timeout=10)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Create tables if missing."""
        try:
            with closing(self._connect()) as conn:
                conn.executescript(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"FreeTierTracker: DB init failed: {exc}") from exc

    @staticmethod
    def _now() -> datetime:
        """Current UTC datetime."""
        return datetime.now(timezone.utc)

    @staticmethod
    def _iso(dt: datetime) -> str:
        """Serialize datetime to ISO-8601."""
        return dt.isoformat()

    def track_command(
        self,
        key_id: str,
        command: str,
        command_cost: int = 1,
        email: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Track a command execution for free tier user.

        Args:
            key_id: License key ID
            command: Command name executed
            command_cost: Credits consumed (for command cost tiers)
            email: User email (optional)
            session_id: Session identifier (optional)
            metadata: Additional data (optional)

        Returns:
            True if tracked successfully
        """
        try:
            now = self._now()
            iso_now = self._iso(now)

            if session_id is None:
                session_id = f"{key_id}-{now.strftime('%Y%m%d%H%M%S')}"

            with closing(self._connect()) as conn:
                # Insert usage record
                conn.execute(
                    """INSERT INTO free_tier_usage
                       (key_id, email, command, command_cost, session_id, created_at, metadata)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (
                        key_id,
                        email,
                        command,
                        command_cost,
                        session_id,
                        iso_now,
                        json.dumps(metadata or {}),
                    ),
                )

                # Update or create session
                conn.execute(
                    """INSERT INTO free_tier_sessions
                       (session_id, key_id, started_at, last_activity, commands_count, total_credits)
                       VALUES (?, ?, ?, ?, 1, ?)
                       ON CONFLICT (session_id) DO UPDATE SET
                       last_activity = excluded.last_activity,
                       commands_count = free_tier_sessions.commands_count + 1,
                       total_credits = free_tier_sessions.total_credits + excluded.total_credits""",
                    (session_id, key_id, iso_now, iso_now, command_cost),
                )

                conn.commit()

            return True

        except sqlite3.Error:
            # Silently fail - analytics should not block execution
            return False

    def get_usage_summary(self, key_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get usage summary for a free tier user.

        Args:
            key_id: License key ID
            days: Number of days to summarize (default: 30)

        Returns:
            Summary dict with usage statistics
        """
        try:
            with closing(self._connect()) as conn:
                # Get total commands and credits
                row = conn.execute(
                    """SELECT
                        COUNT(*) as total_commands,
                        COALESCE(SUM(command_cost), 0) as total_credits,
                        COUNT(DISTINCT DATE(created_at)) as active_days,
                        COUNT(DISTINCT command) as unique_commands
                       FROM free_tier_usage
                       WHERE key_id = ? AND created_at >= datetime('now', ?)""",
                    (key_id, f"-{days} days"),
                ).fetchone()

                if not row:
                    return {
                        "total_commands": 0,
                        "total_credits": 0,
                        "active_days": 0,
                        "unique_commands": 0,
                    }

                # Get most used commands
                top_commands = conn.execute(
                    """SELECT command, SUM(command_cost) as credits
                       FROM free_tier_usage
                       WHERE key_id = ? AND created_at >= datetime('now', ?)
                       GROUP BY command
                       ORDER BY credits DESC
                       LIMIT 5""",
                    (key_id, f"-{days} days"),
                ).fetchall()

                return {
                    "total_commands": row["total_commands"],
                    "total_credits": row["total_credits"],
                    "active_days": row["active_days"],
                    "unique_commands": row["unique_commands"],
                    "top_commands": [
                        {"command": r["command"], "credits": r["credits"]}
                        for r in top_commands
                    ],
                }

        except sqlite3.Error:
            return {
                "total_commands": 0,
                "total_credits": 0,
                "active_days": 0,
                "unique_commands": 0,
                "top_commands": [],
            }

    def get_unsynced_records(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get unsynced records for upload to analytics server.

        Args:
            limit: Maximum number of records to return

        Returns:
            List of unsynced usage records
        """
        try:
            with closing(self._connect()) as conn:
                rows = conn.execute(
                    """SELECT * FROM free_tier_usage
                       WHERE synced = FALSE AND sync_attempted < 3
                       ORDER BY created_at
                       LIMIT ?""",
                    (limit,),
                ).fetchall()

                return [dict(row) for row in rows]

        except sqlite3.Error:
            return []

    def mark_synced(self, record_ids: List[int]) -> int:
        """
        Mark records as synced.

        Args:
            record_ids: List of record IDs to mark

        Returns:
            Number of records updated
        """
        try:
            with closing(self._connect()) as conn:
                placeholders = ",".join("?" * len(record_ids))
                cursor = conn.execute(
                    f"UPDATE free_tier_usage SET synced = TRUE WHERE id IN ({placeholders})",
                    record_ids,
                )
                conn.commit()
                return cursor.rowcount

        except sqlite3.Error:
            return 0

    def increment_sync_attempts(self, record_ids: List[int]) -> int:
        """
        Increment sync attempt counter for records.

        Args:
            record_ids: List of record IDs

        Returns:
            Number of records updated
        """
        try:
            with closing(self._connect()) as conn:
                placeholders = ",".join("?" * len(record_ids))
                cursor = conn.execute(
                    f"UPDATE free_tier_usage SET sync_attempted = sync_attempted + 1 WHERE id IN ({placeholders})",
                    record_ids,
                )
                conn.commit()
                return cursor.rowcount

        except sqlite3.Error:
            return 0

    def clear_old_records(self, days: int = 90) -> int:
        """
        Clear records older than specified days.

        Args:
            days: Days to keep (default: 90)

        Returns:
            Number of records deleted
        """
        try:
            with closing(self._connect()) as conn:
                cursor = conn.execute(
                    """DELETE FROM free_tier_usage
                       WHERE created_at < datetime('now', ?)
                       AND synced = TRUE""",
                    (f"-{days} days",),
                )
                conn.commit()
                return cursor.rowcount

        except sqlite3.Error:
            return 0


# Singleton instance
_tracker: Optional[FreeTierTracker] = None


def get_tracker(db_path: Optional[Path] = None) -> FreeTierTracker:
    """Get global tracker instance."""
    global _tracker
    if _tracker is None or (db_path and _tracker.db_path != db_path):
        _tracker = FreeTierTracker(db_path or DB_PATH)
    return _tracker


def track_free_tier_command(
    key_id: str,
    command: str,
    command_cost: int = 1,
    email: Optional[str] = None,
    session_id: Optional[str] = None,
) -> bool:
    """
    Track a free tier command execution.

    Args:
        key_id: License key ID
        command: Command name
        command_cost: Credits consumed
        email: User email
        session_id: Session identifier

    Returns:
        True if tracked successfully
    """
    return get_tracker().track_command(
        key_id=key_id,
        command=command,
        command_cost=command_cost,
        email=email,
        session_id=session_id,
    )


def get_free_tier_summary(key_id: str, days: int = 30) -> Dict[str, Any]:
    """Get usage summary for a free tier user."""
    return get_tracker().get_usage_summary(key_id, days)


__all__ = [
    "FreeTierTracker",
    "get_tracker",
    "track_free_tier_command",
    "get_free_tier_summary",
]
