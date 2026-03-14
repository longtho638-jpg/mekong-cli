"""Credit account repository for workspace-level billing (SQLite version)."""
from __future__ import annotations

import logging
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "workspaces.db"


@dataclass
class CreditAccount:
    """Represents a workspace's credit account."""

    workspace_id: str
    balance: int
    total_earned: int
    total_spent: int
    created_at: str = ""
    updated_at: str = ""


@dataclass
class CreditTransaction:
    """Represents a single credit transaction."""

    id: str
    workspace_id: str
    amount: int  # positive = credit, negative = debit
    reason: str
    timestamp: str
    metadata: str = "{}"  # JSON for additional context


class CreditAccountRepository:
    """
    SQLite repository for workspace credit accounts.

    Usage:
        repo = CreditAccountRepository()
        repo.create_account(workspace_id="ws_123")
        repo.add_credits(workspace_id, 100, "Polar subscription")
        balance = repo.get_balance(workspace_id)
    """

    def __init__(self, db_path: Path = _DB_PATH) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Open WAL-mode connection."""
        conn = sqlite3.connect(str(self._db_path), timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        """Create tables if they don't exist."""
        try:
            with self._connect() as conn:
                conn.executescript("""
                -- Credit accounts per workspace
                CREATE TABLE IF NOT EXISTS credit_accounts (
                    workspace_id  TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
                    balance       INTEGER NOT NULL DEFAULT 0,
                    total_earned  INTEGER NOT NULL DEFAULT 0,
                    total_spent   INTEGER NOT NULL DEFAULT 0,
                    created_at    TEXT NOT NULL,
                    updated_at    TEXT NOT NULL
                );

                -- Transaction ledger
                CREATE TABLE IF NOT EXISTS credit_transactions (
                    id           TEXT PRIMARY KEY,
                    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                    amount       INTEGER NOT NULL,
                    reason       TEXT NOT NULL,
                    timestamp    TEXT NOT NULL,
                    metadata     TEXT DEFAULT '{}'
                );

                -- Processed events for idempotency (Polar webhooks)
                CREATE TABLE IF NOT EXISTS processed_events (
                    event_id     TEXT PRIMARY KEY,
                    event_type   TEXT NOT NULL,
                    workspace_id TEXT NOT NULL,
                    processed_at TEXT NOT NULL
                );

                -- Indexes
                CREATE INDEX IF NOT EXISTS idx_credit_transactions_workspace
                    ON credit_transactions(workspace_id);
                CREATE INDEX IF NOT EXISTS idx_processed_events_workspace
                    ON processed_events(workspace_id);
                """)
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize credit DB: {exc}") from exc

    @staticmethod
    def _now_iso() -> str:
        """Return current UTC time as ISO 8601 string."""
        return datetime.now(timezone.utc).isoformat()

    def create_account(self, workspace_id: str) -> CreditAccount:
        """Create a new credit account for a workspace."""
        now = self._now_iso()
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO credit_accounts (workspace_id, balance, total_earned, total_spent, created_at, updated_at)
                    VALUES (?, 0, 0, 0, ?, ?)
                    ON CONFLICT(workspace_id) DO NOTHING
                    """,
                    (workspace_id, now, now),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to create credit account: {exc}") from exc

        return CreditAccount(
            workspace_id=workspace_id,
            balance=0,
            total_earned=0,
            total_spent=0,
            created_at=now,
            updated_at=now,
        )

    def get_balance(self, workspace_id: str) -> int:
        """Return the current credit balance for a workspace."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT balance FROM credit_accounts WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()
                return int(row["balance"]) if row else 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get balance: {exc}") from exc

    def get_account(self, workspace_id: str) -> Optional[CreditAccount]:
        """Get full account details for a workspace."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM credit_accounts WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()
                if not row:
                    return None
                return CreditAccount(
                    workspace_id=row["workspace_id"],
                    balance=int(row["balance"]),
                    total_earned=int(row["total_earned"]),
                    total_spent=int(row["total_spent"]),
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get account: {exc}") from exc

    def add_credits(
        self,
        workspace_id: str,
        amount: int,
        reason: str,
        metadata: dict | None = None,
    ) -> int:
        """
        Add credits to a workspace account.

        Args:
            workspace_id: Target workspace identifier
            amount: Positive integer credits to add
            reason: Human-readable reason
            metadata: Optional additional context (event_id, etc.)

        Returns:
            New balance after addition

        Raises:
            ValueError: If amount is not positive
        """
        if amount <= 0:
            raise ValueError("Credit amount must be positive")

        now = self._now_iso()
        meta_json = str(metadata or {}).replace("'", '"')

        try:
            with self._connect() as conn:
                # Upsert account
                conn.execute(
                    """
                    INSERT INTO credit_accounts (workspace_id, balance, total_earned, total_spent, created_at, updated_at)
                    VALUES (?, ?, ?, 0, ?, ?)
                    ON CONFLICT(workspace_id) DO UPDATE SET
                        balance = balance + excluded.balance,
                        total_earned = total_earned + excluded.total_earned,
                        updated_at = excluded.updated_at
                    """,
                    (workspace_id, amount, amount, now, now),
                )
                # Record transaction
                conn.execute(
                    """
                    INSERT INTO credit_transactions (id, workspace_id, amount, reason, timestamp, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), workspace_id, amount, reason, now, meta_json),
                )
                conn.commit()

                # Get new balance
                row = conn.execute(
                    "SELECT balance FROM credit_accounts WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()
                return int(row["balance"])
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to add credits: {exc}") from exc

    def deduct_credits(
        self,
        workspace_id: str,
        amount: int,
        reason: str,
        metadata: dict | None = None,
    ) -> bool:
        """
        Atomically deduct credits from a workspace account.

        Uses BEGIN EXCLUSIVE to prevent double-spend race conditions.

        Args:
            workspace_id: Target workspace identifier
            amount: Positive integer credits to deduct
            reason: Human-readable reason
            metadata: Optional additional context

        Returns:
            True if deduction succeeded, False if insufficient balance
        """
        if amount <= 0:
            raise ValueError("Deduction amount must be positive")

        now = self._now_iso()
        meta_json = str(metadata or {}).replace("'", '"')

        try:
            conn = self._connect()
            try:
                conn.execute("BEGIN EXCLUSIVE")

                # Check balance
                row = conn.execute(
                    "SELECT balance FROM credit_accounts WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()

                current = int(row["balance"]) if row else 0
                if current < amount:
                    conn.execute("ROLLBACK")
                    return False

                new_balance = current - amount

                # Update account
                conn.execute(
                    """
                    UPDATE credit_accounts
                    SET balance = ?, total_spent = total_spent + ?, updated_at = ?
                    WHERE workspace_id = ?
                    """,
                    (new_balance, amount, now, workspace_id),
                )

                # Record transaction
                conn.execute(
                    """
                    INSERT INTO credit_transactions (id, workspace_id, amount, reason, timestamp, metadata)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (str(uuid.uuid4()), workspace_id, -amount, reason, now, meta_json),
                )

                conn.execute("COMMIT")
                return True
            except sqlite3.Error:
                conn.execute("ROLLBACK")
                raise
            finally:
                conn.close()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to deduct credits: {exc}") from exc

    def get_history(
        self, workspace_id: str, limit: int = 50
    ) -> list[CreditTransaction]:
        """Return recent transactions for a workspace."""
        try:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT id, workspace_id, amount, reason, timestamp, metadata
                    FROM credit_transactions
                    WHERE workspace_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """,
                    (workspace_id, limit),
                ).fetchall()

                return [
                    CreditTransaction(
                        id=row["id"],
                        workspace_id=row["workspace_id"],
                        amount=row["amount"],
                        reason=row["reason"],
                        timestamp=row["timestamp"],
                        metadata=row["metadata"] or "{}",
                    )
                    for row in rows
                ]
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get history: {exc}") from exc

    def mark_event_processed(self, event_id: str, event_type: str, workspace_id: str) -> bool:
        """Mark a webhook event as processed for idempotency."""
        now = self._now_iso()
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO processed_events (event_id, event_type, workspace_id, processed_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (event_id, event_type, workspace_id, now),
                )
                conn.commit()
                return True
        except sqlite3.Error:
            return False  # Already processed (duplicate key)

    def is_event_processed(self, event_id: str) -> bool:
        """Check if an event has already been processed."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT 1 FROM processed_events WHERE event_id = ?",
                    (event_id,),
                ).fetchone()
                return row is not None
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to check event: {exc}") from exc
