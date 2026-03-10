"""ALGO 4 — MCU Gate.

Atomic check/lock/confirm/refund MCU credits using SQLite transactions.
THE VAULT — no race conditions with concurrent tenant submissions.
"""

from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


@dataclass
class MCULockResult:
    """Result of an MCU lock operation."""

    success: bool
    lock_id: str = ""
    locked_amount: int = 0
    error: str = ""
    available: int = 0
    required: int = 0
    recharge_url: str = ""


@dataclass
class MCUConfirmResult:
    """Result of an MCU confirm operation."""

    success: bool
    charged: int = 0
    refunded: int = 0
    error: str = ""


@dataclass
class MCURefundResult:
    """Result of an MCU refund operation."""

    success: bool
    refunded: int = 0
    error: str = ""


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS mcu_ledger (
    id          TEXT PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    mission_id  TEXT NOT NULL,
    amount      INTEGER NOT NULL,
    type        TEXT NOT NULL,
    status      TEXT DEFAULT 'pending',
    created_at  TEXT DEFAULT (datetime('now')),
    confirmed_at TEXT
);

CREATE TABLE IF NOT EXISTS mcu_balance (
    tenant_id       TEXT PRIMARY KEY,
    balance         INTEGER DEFAULT 0,
    locked          INTEGER DEFAULT 0,
    lifetime_used   INTEGER DEFAULT 0
);
"""


class MCUGate:
    """Atomic MCU credit management with SQLite transactions."""

    def __init__(self, db_path: str | Path = ":memory:"):
        self._db_path = str(db_path)
        self._conn = sqlite3.connect(self._db_path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._conn.executescript(SCHEMA_SQL)

    def close(self) -> None:
        """Close database connection."""
        self._conn.close()

    def seed_balance(self, tenant_id: str, amount: int, reason: str = "seed") -> None:
        """Add MCU credits to a tenant (e.g. from Polar webhook)."""
        lock_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        with self._conn:
            self._conn.execute(
                "INSERT OR IGNORE INTO mcu_balance (tenant_id, balance, locked, lifetime_used) "
                "VALUES (?, 0, 0, 0)",
                (tenant_id,),
            )
            self._conn.execute(
                "UPDATE mcu_balance SET balance = balance + ? WHERE tenant_id = ?",
                (amount, tenant_id),
            )
            self._conn.execute(
                "INSERT INTO mcu_ledger (id, tenant_id, mission_id, amount, type, status, confirmed_at) "
                "VALUES (?, ?, ?, ?, 'seed', 'confirmed', ?)",
                (lock_id, tenant_id, reason, amount, now),
            )

    def get_balance(self, tenant_id: str) -> dict:
        """Get tenant balance info."""
        row = self._conn.execute(
            "SELECT balance, locked, lifetime_used FROM mcu_balance WHERE tenant_id = ?",
            (tenant_id,),
        ).fetchone()
        if row is None:
            return {"balance": 0, "locked": 0, "lifetime_used": 0, "available": 0}
        return {
            "balance": row["balance"],
            "locked": row["locked"],
            "lifetime_used": row["lifetime_used"],
            "available": row["balance"] - row["locked"],
        }

    def check_and_lock(
        self, tenant_id: str, mission_id: str, mcu_amount: int
    ) -> MCULockResult:
        """Atomically check balance and lock MCU credits.

        Uses BEGIN IMMEDIATE to prevent race conditions.
        """
        lock_id = str(uuid.uuid4())

        try:
            self._conn.execute("BEGIN IMMEDIATE")

            row = self._conn.execute(
                "SELECT balance, locked FROM mcu_balance WHERE tenant_id = ?",
                (tenant_id,),
            ).fetchone()

            if row is None:
                self._conn.execute("ROLLBACK")
                return MCULockResult(
                    success=False,
                    error="tenant_not_found",
                    available=0,
                    required=mcu_amount,
                    recharge_url=f"https://agencyos.network/billing?tenant={tenant_id}",
                )

            available = row["balance"] - row["locked"]

            if available < mcu_amount:
                self._conn.execute("ROLLBACK")
                return MCULockResult(
                    success=False,
                    error="insufficient_mcu",
                    available=available,
                    required=mcu_amount,
                    recharge_url=f"https://agencyos.network/billing?tenant={tenant_id}",
                )

            # Lock MCU
            self._conn.execute(
                "INSERT INTO mcu_ledger (id, tenant_id, mission_id, amount, type, status) "
                "VALUES (?, ?, ?, ?, 'lock', 'pending')",
                (lock_id, tenant_id, mission_id, mcu_amount),
            )
            self._conn.execute(
                "UPDATE mcu_balance SET locked = locked + ? WHERE tenant_id = ?",
                (mcu_amount, tenant_id),
            )
            self._conn.execute("COMMIT")

            return MCULockResult(
                success=True, lock_id=lock_id, locked_amount=mcu_amount
            )

        except sqlite3.Error as e:
            try:
                self._conn.execute("ROLLBACK")
            except sqlite3.Error:
                pass
            return MCULockResult(success=False, error=str(e))

    def confirm(self, lock_id: str, actual_mcu: int | None = None) -> MCUConfirmResult:
        """Confirm MCU deduction after task completion.

        If actual_mcu < locked amount, refunds the difference.
        """
        try:
            self._conn.execute("BEGIN IMMEDIATE")

            row = self._conn.execute(
                "SELECT * FROM mcu_ledger WHERE id = ? AND type = 'lock'",
                (lock_id,),
            ).fetchone()

            if row is None:
                self._conn.execute("ROLLBACK")
                return MCUConfirmResult(success=False, error="lock_not_found")

            locked_amount = row["amount"]
            tenant_id = row["tenant_id"]
            charged = actual_mcu if actual_mcu is not None else locked_amount
            refunded = locked_amount - charged

            now = datetime.now(timezone.utc).isoformat()

            # Confirm the lock
            self._conn.execute(
                "UPDATE mcu_ledger SET status = 'confirmed', confirmed_at = ? WHERE id = ?",
                (now, lock_id),
            )

            # If partial refund needed
            if refunded > 0:
                refund_id = str(uuid.uuid4())
                self._conn.execute(
                    "INSERT INTO mcu_ledger (id, tenant_id, mission_id, amount, type, status, confirmed_at) "
                    "VALUES (?, ?, ?, ?, 'refund', 'confirmed', ?)",
                    (refund_id, tenant_id, row["mission_id"], -refunded, now),
                )

            # Update balance
            self._conn.execute(
                "UPDATE mcu_balance SET "
                "balance = balance - ?, "
                "locked = locked - ?, "
                "lifetime_used = lifetime_used + ? "
                "WHERE tenant_id = ?",
                (charged, locked_amount, charged, tenant_id),
            )
            self._conn.execute("COMMIT")

            return MCUConfirmResult(success=True, charged=charged, refunded=refunded)

        except sqlite3.Error as e:
            try:
                self._conn.execute("ROLLBACK")
            except sqlite3.Error:
                pass
            return MCUConfirmResult(success=False, error=str(e))

    def refund_full(self, lock_id: str, reason: str = "mission_failed") -> MCURefundResult:
        """Full refund — mission failed, return 100% MCU."""
        try:
            self._conn.execute("BEGIN IMMEDIATE")

            row = self._conn.execute(
                "SELECT * FROM mcu_ledger WHERE id = ? AND type = 'lock'",
                (lock_id,),
            ).fetchone()

            if row is None:
                self._conn.execute("ROLLBACK")
                return MCURefundResult(success=False, error="lock_not_found")

            locked_amount = row["amount"]
            tenant_id = row["tenant_id"]
            now = datetime.now(timezone.utc).isoformat()

            # Record refund
            refund_id = str(uuid.uuid4())
            self._conn.execute(
                "INSERT INTO mcu_ledger (id, tenant_id, mission_id, amount, type, status, confirmed_at) "
                "VALUES (?, ?, ?, ?, 'refund', 'confirmed', ?)",
                (refund_id, tenant_id, row["mission_id"], -locked_amount, now),
            )

            # Cancel the lock
            self._conn.execute(
                "UPDATE mcu_ledger SET status = 'cancelled' WHERE id = ?",
                (lock_id,),
            )

            # Release lock without deducting balance
            self._conn.execute(
                "UPDATE mcu_balance SET locked = locked - ? WHERE tenant_id = ?",
                (locked_amount, tenant_id),
            )
            self._conn.execute("COMMIT")

            return MCURefundResult(success=True, refunded=locked_amount)

        except sqlite3.Error as e:
            try:
                self._conn.execute("ROLLBACK")
            except sqlite3.Error:
                pass
            return MCURefundResult(success=False, error=str(e))
