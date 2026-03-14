"""Engagement event storage for retention tracking.

Stores daily engagement events, user streaks, workspace health snapshots,
and nudge dismissals in SQLite.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

_DDL = """
CREATE TABLE IF NOT EXISTS engagement_events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    event_type   TEXT NOT NULL,
    event_count  INTEGER DEFAULT 1,
    event_date   TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    UNIQUE(user_id, event_type, event_date)
);
CREATE INDEX IF NOT EXISTS idx_engagement_user_date ON engagement_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_engagement_workspace ON engagement_events(workspace_id);

CREATE TABLE IF NOT EXISTS user_streaks (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          TEXT NOT NULL UNIQUE,
    current_streak   INTEGER DEFAULT 0,
    longest_streak   INTEGER DEFAULT 0,
    last_active_date TEXT,
    streak_started   TEXT,
    grace_used       INTEGER DEFAULT 0,
    updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_health_snapshots (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_id  TEXT NOT NULL,
    score         INTEGER NOT NULL,
    grade         TEXT NOT NULL,
    components    TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    UNIQUE(workspace_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_health_ws_date ON workspace_health_snapshots(workspace_id, snapshot_date);

CREATE TABLE IF NOT EXISTS nudge_dismissals (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      TEXT NOT NULL,
    nudge_id     TEXT NOT NULL,
    dismissed_at TEXT NOT NULL,
    reason       TEXT DEFAULT 'manual',
    UNIQUE(user_id, nudge_id)
);
CREATE INDEX IF NOT EXISTS idx_nudge_user ON nudge_dismissals(user_id);
"""


@dataclass
class EngagementEvent:
    user_id: str
    workspace_id: str
    event_type: str
    event_count: int
    event_date: str
    created_at: str


@dataclass
class DailyActivity:
    event_date: str
    total_events: int
    event_types: List[str] = field(default_factory=list)


@dataclass
class StreakData:
    user_id: str
    current_streak: int
    longest_streak: int
    last_active_date: Optional[str]
    streak_started: Optional[str]
    grace_used: int


@dataclass
class HealthSnapshot:
    workspace_id: str
    score: int
    grade: str
    components: Dict[str, float]
    snapshot_date: str


class EngagementStore:
    """SQLite store for engagement tracking data."""

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path), timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_db(self) -> None:
        try:
            with self._connect() as conn:
                conn.executescript(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to init engagement DB: {exc}") from exc

    def track_event(self, user_id: str, workspace_id: str, event_type: str,
                    event_date: Optional[str] = None) -> None:
        now = datetime.now(timezone.utc)
        event_date = event_date or now.strftime("%Y-%m-%d")
        try:
            with self._connect() as conn:
                conn.execute(
                    """INSERT INTO engagement_events (user_id, workspace_id, event_type, event_date, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, event_type, event_date)
                    DO UPDATE SET event_count = event_count + 1""",
                    (user_id, workspace_id, event_type, event_date, now.isoformat()),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to track event: {exc}") from exc

    def get_user_events(self, user_id: str, days: int = 30) -> List[EngagementEvent]:
        cutoff = _cutoff_date(days)
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT user_id, workspace_id, event_type, event_count, event_date, created_at FROM engagement_events WHERE user_id = ? AND event_date >= ? ORDER BY event_date DESC",
                (user_id, cutoff),
            ).fetchall()
            return [EngagementEvent(r["user_id"], r["workspace_id"], r["event_type"],
                                    r["event_count"], r["event_date"], r["created_at"]) for r in rows]

    def get_daily_event_counts(self, user_id: str, days: int = 30) -> List[DailyActivity]:
        cutoff = _cutoff_date(days)
        with self._connect() as conn:
            rows = conn.execute(
                """SELECT event_date, SUM(event_count) as total, GROUP_CONCAT(DISTINCT event_type) as types
                FROM engagement_events WHERE user_id = ? AND event_date >= ?
                GROUP BY event_date ORDER BY event_date DESC""",
                (user_id, cutoff),
            ).fetchall()
            return [DailyActivity(r["event_date"], r["total"], (r["types"] or "").split(",")) for r in rows]

    def get_active_dates(self, user_id: str, days: int = 30) -> List[str]:
        cutoff = _cutoff_date(days)
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT DISTINCT event_date FROM engagement_events WHERE user_id = ? AND event_date >= ? ORDER BY event_date",
                (user_id, cutoff),
            ).fetchall()
            return [r["event_date"] for r in rows]

    def upsert_streak(self, data: StreakData) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, streak_started, grace_used, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    current_streak=excluded.current_streak, longest_streak=excluded.longest_streak,
                    last_active_date=excluded.last_active_date, streak_started=excluded.streak_started,
                    grace_used=excluded.grace_used, updated_at=excluded.updated_at""",
                (data.user_id, data.current_streak, data.longest_streak,
                 data.last_active_date, data.streak_started, data.grace_used, now),
            )
            conn.commit()

    def get_streak(self, user_id: str) -> Optional[StreakData]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM user_streaks WHERE user_id = ?", (user_id,)).fetchone()
            if not row:
                return None
            return StreakData(row["user_id"], row["current_streak"], row["longest_streak"],
                             row["last_active_date"], row["streak_started"], row["grace_used"])

    def save_health_snapshot(self, workspace_id: str, score: int, grade: str,
                             components: Dict[str, float], snapshot_date: Optional[str] = None) -> None:
        now = datetime.now(timezone.utc)
        snapshot_date = snapshot_date or now.strftime("%Y-%m-%d")
        with self._connect() as conn:
            conn.execute(
                """INSERT INTO workspace_health_snapshots (workspace_id, score, grade, components, snapshot_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(workspace_id, snapshot_date) DO UPDATE SET score=excluded.score, grade=excluded.grade, components=excluded.components""",
                (workspace_id, score, grade, json.dumps(components), snapshot_date, now.isoformat()),
            )
            conn.commit()

    def get_health_history(self, workspace_id: str, days: int = 30) -> List[HealthSnapshot]:
        cutoff = _cutoff_date(days)
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM workspace_health_snapshots WHERE workspace_id = ? AND snapshot_date >= ? ORDER BY snapshot_date DESC",
                (workspace_id, cutoff),
            ).fetchall()
            return [HealthSnapshot(r["workspace_id"], r["score"], r["grade"],
                                   json.loads(r["components"]), r["snapshot_date"]) for r in rows]

    def dismiss_nudge(self, user_id: str, nudge_id: str, reason: str = "manual") -> bool:
        now = datetime.now(timezone.utc).isoformat()
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO nudge_dismissals (user_id, nudge_id, dismissed_at, reason) VALUES (?, ?, ?, ?)",
                    (user_id, nudge_id, now, reason),
                )
                conn.commit()
                return True
        except sqlite3.Error:
            return False

    def get_dismissed_nudge_ids(self, user_id: str) -> List[str]:
        with self._connect() as conn:
            rows = conn.execute("SELECT nudge_id FROM nudge_dismissals WHERE user_id = ?", (user_id,)).fetchall()
            return [r["nudge_id"] for r in rows]


    def get_distinct_users(self, workspace_id: str) -> List[str]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT DISTINCT user_id FROM engagement_events WHERE workspace_id = ?",
                (workspace_id,),
            ).fetchall()
            return [r["user_id"] for r in rows]

    def get_workspace_event_stats(self, workspace_id: str, days: int = 30) -> Dict[str, int]:
        cutoff = _cutoff_date(days)
        with self._connect() as conn:
            row = conn.execute(
                """SELECT COUNT(DISTINCT event_date) as active_days, COUNT(*) as total_events
                FROM engagement_events WHERE workspace_id = ? AND event_date >= ?""",
                (workspace_id, cutoff),
            ).fetchone()
            return {"active_days": row["active_days"] or 0, "total_events": row["total_events"] or 0}

    def get_workspace_feature_count(self, workspace_id: str, days: int = 30) -> int:
        cutoff = _cutoff_date(days)
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(DISTINCT event_type) as types FROM engagement_events WHERE workspace_id = ? AND event_date >= ?",
                (workspace_id, cutoff),
            ).fetchone()
            return row["types"] if row else 0

    def get_workspace_user_count(self, workspace_id: str) -> int:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT COUNT(DISTINCT user_id) as cnt FROM engagement_events WHERE workspace_id = ?",
                (workspace_id,),
            ).fetchone()
            return row["cnt"] if row else 0

    def get_billing_balance(self, workspace_id: str) -> Optional[int]:
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT balance FROM credit_accounts WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()
                return row["balance"] if row else None
        except sqlite3.OperationalError:
            return None


def _cutoff_date(days: int) -> str:
    from datetime import timedelta
    return (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
