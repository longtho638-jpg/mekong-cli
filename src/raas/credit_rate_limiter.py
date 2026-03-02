"""Fair-use rate limiter for RaaS tenants.

Implements a sliding window rate limiter backed by SQLite.
Daily = last 24 hours, monthly = last 30 days.
"""
from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

TIER_LIMITS: dict[str, dict[str, int]] = {
    "free":       {"daily": 10,  "monthly": 100},
    "starter":    {"daily": 50,  "monthly": 500},
    "growth":     {"daily": 200, "monthly": 2000},
    "pro":        {"daily": 500, "monthly": 5000},
    "enterprise": {"daily": 0,   "monthly": 0},   # 0 = unlimited
}

_DDL = """
CREATE TABLE IF NOT EXISTS rate_limit_events (
    id          TEXT PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    credits_used INTEGER NOT NULL,
    timestamp   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rle_tenant_ts
    ON rate_limit_events (tenant_id, timestamp);
"""


@dataclass
class RateLimitStatus:
    """Result of a rate-limit check.

    Attributes:
        allowed: Whether the request is permitted.
        daily_used: Credits consumed in the last 24 hours.
        daily_limit: Maximum credits allowed per day (0 = unlimited).
        monthly_used: Credits consumed in the last 30 days.
        monthly_limit: Maximum credits allowed per month (0 = unlimited).
        retry_after_seconds: Seconds until the oldest event in the window
            expires, making room for new requests.  None when allowed.
    """

    allowed: bool
    daily_used: int
    daily_limit: int
    monthly_used: int
    monthly_limit: int
    retry_after_seconds: Optional[int] = field(default=None)


class CreditRateLimiter:
    """Sliding-window rate limiter persisted in SQLite.

    Limits are checked against two windows:
    - **Daily**: sum of ``credits_used`` in the last 24 hours.
    - **Monthly**: sum of ``credits_used`` in the last 30 days.

    A limit of ``0`` means *unlimited* (used for the ``enterprise`` tier).

    Example::

        limiter = CreditRateLimiter(daily_limit=50, monthly_limit=500)
        status = limiter.check_limit("tenant-123")
        if status.allowed:
            limiter.record_request("tenant-123", credits_used=3)
    """

    def __init__(
        self,
        db_path: Path = DB_PATH,
        daily_limit: int = TIER_LIMITS["free"]["daily"],
        monthly_limit: int = TIER_LIMITS["free"]["monthly"],
    ) -> None:
        """Initialise the limiter and create the DB table when needed.

        Args:
            db_path: SQLite file path (defaults to shared RaaS DB).
            daily_limit: Max credits per 24-hour rolling window (0 = unlimited).
            monthly_limit: Max credits per 30-day rolling window (0 = unlimited).
        """
        self.db_path = db_path
        self.daily_limit = daily_limit
        self.monthly_limit = monthly_limit
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _connect(self) -> sqlite3.Connection:
        """Return a WAL-mode SQLite connection with row_factory."""
        conn = sqlite3.connect(str(self.db_path), timeout=10)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Create rate_limit_events table and index if missing."""
        try:
            with self._connect() as conn:
                conn.executescript(_DDL)
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditRateLimiter: DB init failed: {exc}") from exc

    @staticmethod
    def _now() -> datetime:
        """Return current UTC datetime."""
        return datetime.now(timezone.utc)

    @staticmethod
    def _iso(dt: datetime) -> str:
        """Serialise a datetime to ISO-8601 string."""
        return dt.isoformat()

    def _sum_credits(
        self, conn: sqlite3.Connection, tenant_id: str, since: datetime
    ) -> int:
        """Sum credits_used for *tenant_id* from *since* until now."""
        row = conn.execute(
            "SELECT COALESCE(SUM(credits_used), 0) AS total "
            "FROM rate_limit_events "
            "WHERE tenant_id = ? AND timestamp >= ?",
            (tenant_id, self._iso(since)),
        ).fetchone()
        return int(row["total"])

    def _oldest_timestamp_in_window(
        self, conn: sqlite3.Connection, tenant_id: str, since: datetime
    ) -> Optional[datetime]:
        """Return the oldest event timestamp within the window, or None."""
        row = conn.execute(
            "SELECT MIN(timestamp) AS oldest "
            "FROM rate_limit_events "
            "WHERE tenant_id = ? AND timestamp >= ?",
            (tenant_id, self._iso(since)),
        ).fetchone()
        if row and row["oldest"]:
            return datetime.fromisoformat(row["oldest"])
        return None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_limit(self, tenant_id: str) -> RateLimitStatus:
        """Check whether *tenant_id* is within their rate limits.

        Args:
            tenant_id: Tenant identifier to check.

        Returns:
            :class:`RateLimitStatus` with usage counters and ``allowed`` flag.

        Raises:
            RuntimeError: On SQLite error.
        """
        now = self._now()
        daily_since = now - timedelta(hours=24)
        monthly_since = now - timedelta(days=30)

        try:
            with self._connect() as conn:
                daily_used = self._sum_credits(conn, tenant_id, daily_since)
                monthly_used = self._sum_credits(conn, tenant_id, monthly_since)

                # 0 limit = unlimited
                daily_exceeded = (
                    self.daily_limit > 0 and daily_used >= self.daily_limit
                )
                monthly_exceeded = (
                    self.monthly_limit > 0 and monthly_used >= self.monthly_limit
                )

                if daily_exceeded or monthly_exceeded:
                    # Calculate retry_after: time until oldest event leaves window
                    window_since = daily_since if daily_exceeded else monthly_since
                    window_hours = 24 if daily_exceeded else 24 * 30
                    oldest = self._oldest_timestamp_in_window(
                        conn, tenant_id, window_since
                    )
                    retry_after: Optional[int] = None
                    if oldest is not None:
                        expires_at = oldest + timedelta(hours=window_hours)
                        delta = (expires_at - now).total_seconds()
                        retry_after = max(0, int(delta))

                    return RateLimitStatus(
                        allowed=False,
                        daily_used=daily_used,
                        daily_limit=self.daily_limit,
                        monthly_used=monthly_used,
                        monthly_limit=self.monthly_limit,
                        retry_after_seconds=retry_after,
                    )

                return RateLimitStatus(
                    allowed=True,
                    daily_used=daily_used,
                    daily_limit=self.daily_limit,
                    monthly_used=monthly_used,
                    monthly_limit=self.monthly_limit,
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"CreditRateLimiter.check_limit failed: {exc}") from exc

    def record_request(self, tenant_id: str, credits_used: int) -> None:
        """Log a request event into the sliding window.

        Args:
            tenant_id: Tenant that made the request.
            credits_used: Number of credits consumed by this request.

        Raises:
            ValueError: If *credits_used* is not positive.
            RuntimeError: On SQLite error.
        """
        if credits_used <= 0:
            raise ValueError("credits_used must be positive")

        try:
            with self._connect() as conn:
                conn.execute(
                    "INSERT INTO rate_limit_events "
                    "(id, tenant_id, credits_used, timestamp) VALUES (?, ?, ?, ?)",
                    (str(uuid.uuid4()), tenant_id, credits_used, self._iso(self._now())),
                )
        except sqlite3.Error as exc:
            raise RuntimeError(
                f"CreditRateLimiter.record_request failed: {exc}"
            ) from exc

    def get_limits(self, tenant_id: str) -> dict:
        """Return current usage versus configured limits for *tenant_id*.

        Args:
            tenant_id: Tenant identifier.

        Returns:
            Dictionary with keys: ``daily_used``, ``daily_limit``,
            ``monthly_used``, ``monthly_limit``, ``daily_remaining``,
            ``monthly_remaining``.
        """
        now = self._now()
        try:
            with self._connect() as conn:
                daily_used = self._sum_credits(
                    conn, tenant_id, now - timedelta(hours=24)
                )
                monthly_used = self._sum_credits(
                    conn, tenant_id, now - timedelta(days=30)
                )

        except sqlite3.Error as exc:
            raise RuntimeError(
                f"CreditRateLimiter.get_limits failed: {exc}"
            ) from exc

        daily_remaining = (
            max(0, self.daily_limit - daily_used) if self.daily_limit > 0 else None
        )
        monthly_remaining = (
            max(0, self.monthly_limit - monthly_used)
            if self.monthly_limit > 0
            else None
        )

        return {
            "daily_used": daily_used,
            "daily_limit": self.daily_limit,
            "daily_remaining": daily_remaining,
            "monthly_used": monthly_used,
            "monthly_limit": self.monthly_limit,
            "monthly_remaining": monthly_remaining,
        }
