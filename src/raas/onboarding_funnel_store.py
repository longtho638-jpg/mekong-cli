"""Onboarding funnel event storage and analytics for RaaS.

Tracks user progression through onboarding funnel steps.
Provides aggregation queries for conversion analytics.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

_DDL = """
-- Onboarding funnel events table
CREATE TABLE IF NOT EXISTS onboarding_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    workspace_id    TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    event_data      TEXT DEFAULT '{}',
    created_at      TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workspace ON onboarding_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_created_at ON onboarding_events(created_at);
"""


@dataclass
class FunnelStep:
    """A single step in the onboarding funnel."""

    step_name: str
    step_order: int
    count: int
    unique_users: int
    conversion_rate: float = 0.0


@dataclass
class FunnelData:
    """Complete funnel data with all steps and metrics."""

    period_start: str
    period_end: str
    total_days: int
    steps: List[FunnelStep] = field(default_factory=list)
    overall_conversion_rate: float = 0.0


class OnboardingFunnelStore:
    """
    SQLite store for onboarding funnel analytics.

    Tracks events like:
    - signup_started
    - workspace_created
    - llm_configured
    - polar_connected
    - first_mission_started
    - first_mission_completed

    Usage:
        store = OnboardingFunnelStore()
        store.track_event(user_id="u123", workspace_id="ws456", event_type="workspace_created")
        funnel = store.get_funnel_data(days=30)
    """

    # Standard funnel steps in order
    FUNNEL_STEPS = [
        "signup_started",
        "workspace_created",
        "llm_configured",
        "polar_connected",
        "first_mission_started",
        "first_mission_completed",
    ]

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Open WAL-mode connection."""
        conn = sqlite3.connect(str(self._db_path), timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    def _init_db(self) -> None:
        """Create tables and indexes if they don't exist."""
        try:
            with self._connect() as conn:
                conn.executescript(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize onboarding events DB: {exc}") from exc

    def track_event(
        self,
        user_id: str,
        workspace_id: str,
        event_type: str,
        event_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Record an onboarding funnel event.

        Args:
            user_id: User identifier (tenant_id).
            workspace_id: Workspace identifier.
            event_type: One of the standard funnel event types.
            event_data: Optional additional event metadata.

        Raises:
            RuntimeError: If database write fails.
        """
        now = datetime.now(timezone.utc).isoformat()
        event_data = event_data or {}

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO onboarding_events (user_id, workspace_id, event_type, event_data, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (user_id, workspace_id, event_type, json.dumps(event_data), now),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to track onboarding event: {exc}") from exc

        logger.debug(
            f"Tracked onboarding event: {event_type} for user={user_id} workspace={workspace_id}"
        )

    def get_funnel_data(self, days: int = 30) -> FunnelData:
        """
        Get aggregated funnel data for the last N days.

        Args:
            days: Look-back window in days (default 30).

        Returns:
            FunnelData with step counts and conversion rates.
        """
        now = datetime.now(timezone.utc)
        period_start = (now - __import__("datetime").timedelta(days=days)).isoformat()
        period_end = now.isoformat()

        try:
            with self._connect() as conn:
                steps = self._get_step_counts(conn, period_start)
        except sqlite3.OperationalError:
            # Table may not exist yet
            steps = []

        # Calculate conversion rates
        overall_conversion = 0.0
        if steps and steps[0].count > 0:
            last_step = steps[-1] if steps else None
            if last_step:
                overall_conversion = (last_step.count / steps[0].count) * 100

        # Update individual step conversion rates
        initial_count = steps[0].count if steps else 0
        for step in steps:
            if initial_count > 0:
                step.conversion_rate = (step.count / initial_count) * 100

        return FunnelData(
            period_start=period_start,
            period_end=period_end,
            total_days=days,
            steps=steps,
            overall_conversion_rate=overall_conversion,
        )

    def _get_step_counts(
        self,
        conn: sqlite3.Connection,
        since: str,
    ) -> List[FunnelStep]:
        """Get count for each funnel step."""
        steps = []

        for idx, step_name in enumerate(self.FUNNEL_STEPS):
            row = conn.execute(
                """
                SELECT
                    COUNT(*) as total_count,
                    COUNT(DISTINCT user_id) as unique_users
                FROM onboarding_events
                WHERE event_type = ? AND created_at >= ?
                """,
                (step_name, since),
            ).fetchone()

            if row:
                steps.append(
                    FunnelStep(
                        step_name=step_name,
                        step_order=idx,
                        count=row["total_count"] or 0,
                        unique_users=row["unique_users"] or 0,
                    )
                )

        return steps

    def get_user_funnel_progress(
        self,
        user_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Get funnel progress for a specific user.

        Args:
            user_id: User to query.

        Returns:
            List of event dicts with step completion info.
        """
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT event_type, workspace_id, created_at, event_data
                    FROM onboarding_events
                    WHERE user_id = ?
                    ORDER BY created_at ASC
                    """,
                    (user_id,),
                ).fetchall()

                return [
                    {
                        "event_type": row["event_type"],
                        "workspace_id": row["workspace_id"],
                        "created_at": row["created_at"],
                        "event_data": json.loads(row["event_data"]) if row["event_data"] else {},
                    }
                    for row in rows
                ]
        except sqlite3.OperationalError:
            return []

    def get_workspace_funnel_events(
        self,
        workspace_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Get all funnel events for a workspace.

        Args:
            workspace_id: Workspace to query.

        Returns:
            List of event dicts ordered by creation time.
        """
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT user_id, event_type, created_at, event_data
                    FROM onboarding_events
                    WHERE workspace_id = ?
                    ORDER BY created_at ASC
                    """,
                    (workspace_id,),
                ).fetchall()

                return [
                    {
                        "user_id": row["user_id"],
                        "event_type": row["event_type"],
                        "created_at": row["created_at"],
                        "event_data": json.loads(row["event_data"]) if row["event_data"] else {},
                    }
                    for row in rows
                ]
        except sqlite3.OperationalError:
            return []
