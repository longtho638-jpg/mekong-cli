"""Credit metering middleware for RaaS PEV pipeline.

Connects the credit system into Plan-Execute-Verify pipeline by tracking
per-task credit usage, enforcing balance checks, and aggregating usage stats.
"""

from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from src.raas.credits import CreditStore, DB_PATH


# ---------------------------------------------------------------------------
# Task-level cost table
# ---------------------------------------------------------------------------

TASK_COSTS: Dict[str, int] = {
    "plan": 1,
    "execute_shell": 1,
    "execute_llm": 2,
    "execute_api": 1,
    "verify": 1,
    "cook_simple": 1,
    "cook_standard": 3,
    "cook_complex": 5,
}


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class InsufficientCreditsError(Exception):
    """Raised when a tenant does not have enough credits for a task."""

    def __init__(self, tenant_id: str, required: int, available: int) -> None:
        self.tenant_id = tenant_id
        self.required = required
        self.available = available
        super().__init__(
            f"Tenant '{tenant_id}' has {available} credits but {required} required."
        )


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------


@dataclass
class UsageEvent:
    """Single credit usage record."""

    id: str
    tenant_id: str
    mission_id: Optional[str]
    task_type: str
    credits_used: int
    timestamp: str  # ISO 8601


@dataclass
class UsageSummary:
    """Aggregated credit usage for a tenant over a period."""

    tenant_id: str
    period: str
    total_credits_used: int
    event_count: int
    breakdown: Dict[str, int]  # task_type → total credits


# ---------------------------------------------------------------------------
# CreditMeter
# ---------------------------------------------------------------------------


class CreditMeter:
    """Middleware that enforces credit checks and records usage events.

    Shares the same SQLite database as :class:`CreditStore` and adds a
    ``usage_events`` table for per-task metering without duplicating the
    balance/transaction logic.
    """

    def __init__(self, db_path: Path = DB_PATH) -> None:
        """Initialise meter, creating the usage_events table if needed.

        Args:
            db_path: Path to the shared RaaS SQLite database.
        """
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._credit_store = CreditStore(db_path=db_path)
        self._init_db()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path), timeout=10)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Create usage_events table if it does not exist."""
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS usage_events (
                        id           TEXT PRIMARY KEY,
                        tenant_id    TEXT NOT NULL,
                        mission_id   TEXT,
                        task_type    TEXT NOT NULL,
                        credits_used INTEGER NOT NULL,
                        timestamp    TEXT NOT NULL
                    )
                    """
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditMeter: failed to initialize DB: {exc}") from exc

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _period_filter(period: str) -> str:
        """Return a SQLite strftime prefix for the requested period."""
        if period == "monthly":
            return datetime.now(timezone.utc).strftime("%Y-%m")
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_balance(self, tenant_id: str, complexity: str) -> None:
        """Verify tenant has enough credits for a given task type.

        Args:
            tenant_id: Target tenant identifier.
            complexity: Task type key from :data:`TASK_COSTS`.

        Raises:
            ValueError: If ``complexity`` is not a recognised task type.
            InsufficientCreditsError: If the tenant's balance is too low.
        """
        cost = TASK_COSTS.get(complexity)
        if cost is None:
            raise ValueError(
                f"Unknown task type '{complexity}'. Valid types: {list(TASK_COSTS)}"
            )

        balance = self._credit_store.get_balance(tenant_id)
        if balance < cost:
            raise InsufficientCreditsError(
                tenant_id=tenant_id, required=cost, available=balance
            )

    def record_usage(
        self,
        tenant_id: str,
        task_type: str,
        credits_used: int,
        mission_id: Optional[str] = None,
    ) -> UsageEvent:
        """Log a usage event to the metering table.

        Does NOT deduct credits — that is handled by :class:`CreditStore`.
        This method only appends an audit record.

        Args:
            tenant_id: Target tenant identifier.
            task_type: Type of task executed (e.g. ``"execute_llm"``).
            credits_used: Number of credits consumed.
            mission_id: Optional parent mission identifier.

        Returns:
            The persisted :class:`UsageEvent`.
        """
        event = UsageEvent(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            mission_id=mission_id,
            task_type=task_type,
            credits_used=credits_used,
            timestamp=self._now_iso(),
        )
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO usage_events "
                    "(id, tenant_id, mission_id, task_type, credits_used, timestamp) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        event.id,
                        event.tenant_id,
                        event.mission_id,
                        event.task_type,
                        event.credits_used,
                        event.timestamp,
                    ),
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditMeter.record_usage failed: {exc}") from exc
        return event

    def get_usage_summary(
        self, tenant_id: str, period: str = "daily"
    ) -> UsageSummary:
        """Aggregate credit usage for a tenant over a period.

        Args:
            tenant_id: Target tenant identifier.
            period: ``"daily"`` (default) or ``"monthly"``.

        Returns:
            :class:`UsageSummary` with total spend and per-task breakdown.

        Raises:
            ValueError: If ``period`` is not ``"daily"`` or ``"monthly"``.
        """
        if period not in ("daily", "monthly"):
            raise ValueError("period must be 'daily' or 'monthly'")

        prefix = self._period_filter(period)
        like_pattern = f"{prefix}%"

        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT task_type, SUM(credits_used) as total "
                    "FROM usage_events "
                    "WHERE tenant_id = ? AND timestamp LIKE ? "
                    "GROUP BY task_type",
                    (tenant_id, like_pattern),
                ).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditMeter.get_usage_summary failed: {exc}") from exc

        breakdown: Dict[str, int] = {row["task_type"]: int(row["total"]) for row in rows}
        total = sum(breakdown.values())
        count_rows = sum(1 for _ in breakdown)  # per-type count

        # Get actual event count
        try:
            with self._connect() as conn:
                count_row = conn.execute(
                    "SELECT COUNT(*) as cnt FROM usage_events "
                    "WHERE tenant_id = ? AND timestamp LIKE ?",
                    (tenant_id, like_pattern),
                ).fetchone()
                event_count = int(count_row["cnt"]) if count_row else 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditMeter.get_usage_summary failed: {exc}") from exc

        return UsageSummary(
            tenant_id=tenant_id,
            period=period,
            total_credits_used=total,
            event_count=event_count,
            breakdown=breakdown,
        )

    def list_events(
        self, tenant_id: str, limit: int = 50
    ) -> List[UsageEvent]:
        """Return recent usage events for a tenant, newest first.

        Args:
            tenant_id: Target tenant identifier.
            limit: Maximum number of events to return.

        Returns:
            List of :class:`UsageEvent` ordered by timestamp descending.
        """
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT id, tenant_id, mission_id, task_type, credits_used, timestamp "
                    "FROM usage_events "
                    "WHERE tenant_id = ? "
                    "ORDER BY timestamp DESC LIMIT ?",
                    (tenant_id, limit),
                ).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditMeter.list_events failed: {exc}") from exc

        return [
            UsageEvent(
                id=row["id"],
                tenant_id=row["tenant_id"],
                mission_id=row["mission_id"],
                task_type=row["task_type"],
                credits_used=int(row["credits_used"]),
                timestamp=row["timestamp"],
            )
            for row in rows
        ]
