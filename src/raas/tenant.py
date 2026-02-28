"""Tenant storage and management for RaaS multi-tenant isolation."""
from __future__ import annotations

import hashlib
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional


_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

_DDL = """
CREATE TABLE IF NOT EXISTS tenants (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL,
    is_active   INTEGER NOT NULL DEFAULT 1
);
"""


@dataclass
class Tenant:
    """Immutable snapshot of a tenant record.

    Attributes:
        id: UUID4 string identifier.
        name: Human-readable tenant name.
        api_key: Plaintext ``mk_``-prefixed key (only available at creation time).
        created_at: ISO-8601 UTC timestamp string.
        is_active: Whether the tenant is allowed to use the API.
    """

    id: str
    name: str
    api_key: str
    created_at: str
    is_active: bool = True


def _hash_key(key: str) -> str:
    """Return the SHA-256 hex digest of *key*."""
    return hashlib.sha256(key.encode()).hexdigest()


def _row_to_tenant(row: sqlite3.Row, api_key: str = "") -> Tenant:
    """Convert a DB row to a :class:`Tenant` instance.

    Args:
        row: Row object from ``sqlite3`` with tenant columns.
        api_key: Plaintext key to embed in the result (empty after creation).
    """
    return Tenant(
        id=row["id"],
        name=row["name"],
        api_key=api_key,
        created_at=row["created_at"],
        is_active=bool(row["is_active"]),
    )


class TenantStore:
    """SQLite-backed store for tenant records.

    The database is created automatically at ``~/.mekong/raas/tenants.db``
    the first time this class is instantiated.  WAL journal mode is enabled
    for improved concurrency.

    Example::

        store = TenantStore()
        tenant = store.create_tenant("Acme Corp")
        print(tenant.api_key)   # mk_<uuid4>  — only shown once
    """

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        """Initialise the store and create the DB schema when needed.

        Args:
            db_path: Override the default SQLite file location (useful in tests).
        """
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        """Open a WAL-mode connection with row_factory enabled."""
        conn = sqlite3.connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        """Create the tenants table if it does not yet exist."""
        try:
            with self._connect() as conn:
                conn.execute(_DDL)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialise tenant DB: {exc}") from exc

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def create_tenant(self, name: str) -> Tenant:
        """Create a new tenant and return it with the plaintext API key.

        The plaintext key is **only** returned here; subsequent look-ups
        return an empty string for ``api_key``.

        Args:
            name: Human-readable label for the tenant.

        Returns:
            :class:`Tenant` with ``api_key`` set to the new ``mk_``-prefixed key.

        Raises:
            RuntimeError: If the DB write fails.
        """
        tenant_id = str(uuid.uuid4())
        raw_key = f"mk_{uuid.uuid4().hex}"
        key_hash = _hash_key(raw_key)
        created_at = datetime.now(timezone.utc).isoformat()

        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO tenants (id, name, api_key_hash, created_at, is_active) "
                    "VALUES (?, ?, ?, ?, 1)",
                    (tenant_id, name, key_hash, created_at),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to create tenant '{name}': {exc}") from exc

        return Tenant(
            id=tenant_id,
            name=name,
            api_key=raw_key,
            created_at=created_at,
            is_active=True,
        )

    def get_by_api_key(self, key: str) -> Optional[Tenant]:
        """Return the :class:`Tenant` whose hashed key matches *key*.

        Args:
            key: Plaintext ``mk_``-prefixed API key supplied by the caller.

        Returns:
            Matching :class:`Tenant` or ``None`` if not found.

        Raises:
            RuntimeError: If the DB query fails.
        """
        key_hash = _hash_key(key)
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM tenants WHERE api_key_hash = ?",
                    (key_hash,),
                ).fetchone()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to look up API key: {exc}") from exc

        if row is None:
            return None
        return _row_to_tenant(row, api_key=key)

    def list_tenants(self) -> List[Tenant]:
        """Return all tenants ordered by creation date (oldest first).

        Returns:
            List of :class:`Tenant` objects (``api_key`` is empty string).

        Raises:
            RuntimeError: If the DB query fails.
        """
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    "SELECT * FROM tenants ORDER BY created_at ASC"
                ).fetchall()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to list tenants: {exc}") from exc

        return [_row_to_tenant(r) for r in rows]

    def deactivate_tenant(self, tenant_id: str) -> bool:
        """Soft-delete a tenant by marking it inactive.

        Args:
            tenant_id: UUID4 string of the tenant to deactivate.

        Returns:
            ``True`` if a row was updated, ``False`` if *tenant_id* was not found.

        Raises:
            RuntimeError: If the DB update fails.
        """
        try:
            with self._connect() as conn:
                cursor = conn.execute(
                    "UPDATE tenants SET is_active = 0 WHERE id = ?",
                    (tenant_id,),
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to deactivate tenant '{tenant_id}': {exc}") from exc
