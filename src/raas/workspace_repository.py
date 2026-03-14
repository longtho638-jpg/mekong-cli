"""Workspace repository for multi-tenant isolation (SQLite version)."""
from __future__ import annotations

import json
import logging
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Optional

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "workspaces.db"

_DDL = """
-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL,
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    config          TEXT DEFAULT '{}',
    is_active       INTEGER DEFAULT 1,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id    TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_email      TEXT NOT NULL,
    role            TEXT NOT NULL,
    joined_at       TEXT NOT NULL,
    PRIMARY KEY (workspace_id, user_email)
);

-- Workspace state table
CREATE TABLE IF NOT EXISTS workspace_state (
    workspace_id    TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    state_key       TEXT NOT NULL,
    state_value     TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    PRIMARY KEY (workspace_id, state_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_email);
"""


@dataclass
class Workspace:
    """A workspace within a tenant."""

    id: str
    tenant_id: str
    name: str
    slug: str
    config: dict[str, Any] = field(default_factory=dict)
    is_active: bool = True
    created_at: str = ""
    updated_at: str = ""


@dataclass
class WorkspaceMember:
    """A member of a workspace."""

    workspace_id: str
    user_email: str
    role: str  # owner/admin/member
    joined_at: str = ""


def _row_to_workspace(row: sqlite3.Row) -> Workspace:
    """Convert DB row to Workspace."""
    return Workspace(
        id=row["id"],
        tenant_id=row["tenant_id"],
        name=row["name"],
        slug=row["slug"],
        config=json.loads(row["config"] or "{}"),
        is_active=bool(row["is_active"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


class WorkspaceRepository:
    """
    SQLite repository for workspace operations.

    Usage:
        repo = WorkspaceRepository()
        workspace = repo.create(tenant_id="...", name="My Project", slug="my-project")
        members = repo.list_members(workspace.id)
    """

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Open WAL-mode connection."""
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        """Create tables if they don't exist."""
        try:
            with self._connect() as conn:
                conn.execute(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize workspace DB: {exc}") from exc

    def create(
        self,
        tenant_id: str,
        name: str,
        slug: str,
        config: dict[str, Any] | None = None,
    ) -> Workspace:
        """Create a new workspace."""
        workspace_id = f"ws_{datetime.now().strftime('%Y%m%d%H%M%S')}_{slug}"
        now = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO workspaces (id, tenant_id, name, slug, config, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (workspace_id, tenant_id, name, slug, json.dumps(config or {}), now, now),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to create workspace '{name}': {exc}") from exc

        return Workspace(
            id=workspace_id,
            tenant_id=tenant_id,
            name=name,
            slug=slug,
            config=config or {},
            is_active=True,
            created_at=now,
            updated_at=now,
        )

    def get_by_slug(self, slug: str) -> Workspace | None:
        """Get workspace by slug."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM workspaces WHERE slug = ?", (slug,)
                ).fetchone()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get workspace: {exc}") from exc

        return _row_to_workspace(row) if row else None

    def get_by_id(self, workspace_id: str) -> Workspace | None:
        """Get workspace by ID."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM workspaces WHERE id = ?", (workspace_id,)
                ).fetchone()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get workspace: {exc}") from exc

        return _row_to_workspace(row) if row else None

    def list_by_tenant(self, tenant_id: str) -> list[Workspace]:
        """List all workspaces for a tenant."""
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM workspaces WHERE tenant_id = ? ORDER BY created_at DESC",
                    (tenant_id,),
                ).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to list workspaces: {exc}") from exc

        return [_row_to_workspace(row) for row in rows]

    def update(self, workspace_id: str, **kwargs: Any) -> Workspace | None:
        """Update workspace fields."""
        if not kwargs:
            return self.get_by_id(workspace_id)

        # Build dynamic update
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            if key in ["id", "tenant_id", "created_at"]:
                continue
            set_clauses.append(f"{key} = ?")
            if key == "config":
                values.append(json.dumps(value))
            elif key == "is_active":
                values.append(1 if value else 0)
            else:
                values.append(value)

        if not set_clauses:
            return self.get_by_id(workspace_id)

        now = datetime.now(timezone.utc).isoformat()
        set_clauses.append("updated_at = ?")
        values.append(now)
        values.append(workspace_id)

        query = f"UPDATE workspaces SET {', '.join(set_clauses)} WHERE id = ?"

        try:
            with self._connect() as conn:
                cursor = conn.execute(query, values)
                conn.commit()
                if cursor.rowcount == 0:
                    return None
                return self.get_by_id(workspace_id)
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to update workspace: {exc}") from exc

    def deactivate(self, workspace_id: str) -> bool:
        """Deactivate a workspace."""
        now = datetime.now(timezone.utc).isoformat()
        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    "UPDATE workspaces SET is_active = 0, updated_at = ? WHERE id = ?",
                    (now, workspace_id),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to deactivate workspace: {exc}") from exc

    def add_member(
        self, workspace_id: str, user_email: str, role: str = "member"
    ) -> bool:
        """Add a member to a workspace."""
        now = datetime.now(timezone.utc).isoformat()
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO workspace_members (workspace_id, user_email, role, joined_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT (workspace_id, user_email) DO UPDATE SET role = ?, joined_at = ?
                    """,
                    (workspace_id, user_email, role, now, role, now),
                )
                conn.commit()
                return True
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to add member: {exc}") from exc

    def remove_member(self, workspace_id: str, user_email: str) -> bool:
        """Remove a member from a workspace."""
        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    "DELETE FROM workspace_members WHERE workspace_id = ? AND user_email = ?",
                    (workspace_id, user_email),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to remove member: {exc}") from exc

    def list_members(self, workspace_id: str) -> list[WorkspaceMember]:
        """List all members of a workspace."""
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM workspace_members WHERE workspace_id = ? ORDER BY joined_at ASC",
                    (workspace_id,),
                ).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to list members: {exc}") from exc

        return [
            WorkspaceMember(
                workspace_id=row["workspace_id"],
                user_email=row["user_email"],
                role=row["role"],
                joined_at=row["joined_at"],
            )
            for row in rows
        ]

    def get_member_role(self, workspace_id: str, user_email: str) -> str | None:
        """Get a member's role in a workspace."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_email = ?",
                    (workspace_id, user_email),
                ).fetchone()
                return row["role"] if row else None
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get member role: {exc}") from exc

    def get_state(self, workspace_id: str, state_key: str) -> Any | None:
        """Get workspace state value."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT state_value FROM workspace_state WHERE workspace_id = ? AND state_key = ?",
                    (workspace_id, state_key),
                ).fetchone()
                return json.loads(row["state_value"]) if row else None
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get state: {exc}") from exc

    def set_state(
        self, workspace_id: str, state_key: str, state_value: Any
    ) -> None:
        """Set workspace state value."""
        now = datetime.now(timezone.utc).isoformat()
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO workspace_state (workspace_id, state_key, state_value, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT (workspace_id, state_key) DO UPDATE SET state_value = ?, updated_at = ?
                    """,
                    (workspace_id, state_key, json.dumps(state_value), now, state_value, now),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to set state: {exc}") from exc

    def delete_state(self, workspace_id: str, state_key: str) -> bool:
        """Delete workspace state."""
        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    "DELETE FROM workspace_state WHERE workspace_id = ? AND state_key = ?",
                    (workspace_id, state_key),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to delete state: {exc}") from exc
