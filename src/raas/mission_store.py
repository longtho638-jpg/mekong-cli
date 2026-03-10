"""SQLite persistence layer for RaaS mission records."""
from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from src.raas.mission_models import MissionComplexity, MissionRecord, MissionStatus

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

_MISSIONS_DDL = """
CREATE TABLE IF NOT EXISTS missions (
    id            TEXT PRIMARY KEY,
    tenant_id     TEXT NOT NULL,
    goal          TEXT NOT NULL,
    status        TEXT NOT NULL,
    complexity    TEXT NOT NULL,
    credits_cost  INTEGER NOT NULL,
    created_at    TEXT NOT NULL,
    started_at    TEXT,
    completed_at  TEXT,
    error_message TEXT
);
"""


class MissionStore:
    """SQLite-backed persistence for mission records.

    Shares ``~/.mekong/raas/tenants.db`` with TenantStore and CreditStore.
    WAL mode enabled for concurrency.

    Example::

        store = MissionStore()
        rec = store.create("tid", "automate reports", MissionComplexity.simple, 1)
    """

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        """Initialise and create the missions table if absent.

        Args:
            db_path: SQLite file location (override in tests).
        """
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        try:
            with self._connect() as conn:
                conn.execute(_MISSIONS_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialise missions DB: {exc}") from exc

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> MissionRecord:
        return MissionRecord(
            id=row["id"],
            tenant_id=row["tenant_id"],
            goal=row["goal"],
            status=MissionStatus(row["status"]),
            complexity=MissionComplexity(row["complexity"]),
            credits_cost=row["credits_cost"],
            created_at=row["created_at"],
            started_at=row["started_at"],
            completed_at=row["completed_at"],
            error_message=row["error_message"],
        )

    def create(
        self,
        tenant_id: str,
        goal: str,
        complexity: MissionComplexity,
        credits_cost: int,
    ) -> MissionRecord:
        """Persist a new mission with status ``queued`` and return it."""
        mission_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO missions "
                    "(id, tenant_id, goal, status, complexity, credits_cost, created_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        mission_id,
                        tenant_id,
                        goal,
                        MissionStatus.queued.value,
                        complexity.value,
                        credits_cost,
                        created_at,
                    ),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to create mission: {exc}") from exc

        return MissionRecord(
            id=mission_id,
            tenant_id=tenant_id,
            goal=goal,
            status=MissionStatus.queued,
            complexity=complexity,
            credits_cost=credits_cost,
            created_at=created_at,
        )

    def get(self, mission_id: str, tenant_id: str) -> Optional[MissionRecord]:
        """Fetch a tenant-scoped mission by ID, or ``None`` if not found."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM missions WHERE id = ? AND tenant_id = ?",
                    (mission_id, tenant_id),
                ).fetchone()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to fetch mission '{mission_id}': {exc}") from exc
        return self._row_to_record(row) if row else None

    def list_for_tenant(
        self,
        tenant_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> List[MissionRecord]:
        """Return paginated missions for *tenant_id*, newest first."""
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM missions WHERE tenant_id = ? "
                    "ORDER BY created_at DESC LIMIT ? OFFSET ?",
                    (tenant_id, limit, offset),
                ).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to list missions for '{tenant_id}': {exc}") from exc
        return [self._row_to_record(r) for r in rows]

    def update_status(
        self,
        mission_id: str,
        status: MissionStatus,
        error_msg: Optional[str] = None,
    ) -> None:
        """Update status; stamps started_at/completed_at on state transitions."""
        now = datetime.now(timezone.utc).isoformat()
        params: list = [status.value]
        sql_sets = ["status = ?"]

        if status == MissionStatus.running:
            sql_sets.append("started_at = ?")
            params.append(now)
        elif status in (
            MissionStatus.completed,
            MissionStatus.failed,
            MissionStatus.cancelled,
        ):
            sql_sets.append("completed_at = ?")
            params.append(now)

        if error_msg is not None:
            sql_sets.append("error_message = ?")
            params.append(error_msg)

        params.append(mission_id)
        sql = f"UPDATE missions SET {', '.join(sql_sets)} WHERE id = ?"
        try:
            with self._connect() as conn:
                conn.execute(sql, params)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to update mission '{mission_id}': {exc}") from exc
