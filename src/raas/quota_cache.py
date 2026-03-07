"""
Quota State Cache — ROIaaS Phase 6b

Local SQLite cache for quota state to reduce API calls.
TTL: 5 minutes default.
"""

import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from dataclasses import dataclass


DB_PATH = Path.home() / ".mekong" / "raas" / "quota_cache.db"

DEFAULT_TTL_SECONDS = 300  # 5 minutes (cache TTL for normal operation)
GRACE_PERIOD_SECONDS = 86400  # 24 hours offline grace period


@dataclass
class QuotaState:
    """Cached quota state for a key.

    Attributes:
        key_id: License key ID
        daily_used: Commands used today
        daily_limit: Daily command limit
        monthly_used: Commands used this month (if available)
        monthly_limit: Monthly command limit (if available)
        tier: License tier
        status: License status (active, revoked, expired)
        expires_at_ts: License expiration timestamp (Unix epoch)
        cached_at: When this was cached (UTC)
        expires_at: When cache expires (UTC)
        grace_period_remaining: Seconds remaining in offline grace period
        last_online_validation: ISO timestamp of last successful online validation
        is_offline_mode: True if currently in offline mode
        last_reset_date: Date string (YYYY-MM-DD) of last daily reset
    """
    key_id: str
    daily_used: int
    daily_limit: int
    tier: str = "free"
    status: str = "active"  # active, revoked, expired
    expires_at_ts: int = 0  # 0 = never expires
    monthly_used: int = 0
    monthly_limit: int = 0
    cached_at: str = ""
    expires_at: str = ""
    # Grace period support (Phase 6d)
    grace_period_remaining: int = GRACE_PERIOD_SECONDS  # 24h default
    last_online_validation: str = ""  # ISO timestamp
    is_offline_mode: bool = False
    last_reset_date: str = ""  # YYYY-MM-DD format

    def __post_init__(self):
        if not self.cached_at:
            self.cached_at = datetime.now(timezone.utc).isoformat()
        if not self.expires_at:
            expires = datetime.now(timezone.utc) + timedelta(seconds=DEFAULT_TTL_SECONDS)
            self.expires_at = expires.isoformat()

    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        expires = datetime.fromisoformat(self.expires_at)
        return datetime.now(timezone.utc) >= expires

    def is_license_expired(self) -> bool:
        """Check if license itself is expired."""
        if self.expires_at_ts <= 0:
            return False  # No expiration
        now_ts = int(datetime.now(timezone.utc).timestamp())
        return now_ts >= self.expires_at_ts

    def is_revoked(self) -> bool:
        """Check if license is revoked."""
        return self.status == "revoked"

    def remaining_seconds(self) -> int:
        """Get seconds until cache expires."""
        expires = datetime.fromisoformat(self.expires_at)
        delta = expires - datetime.now(timezone.utc)
        return max(0, int(delta.total_seconds()))

    def usage_percentage(self) -> float:
        """Get usage as percentage of limit."""
        if self.daily_limit <= 0:  # Unlimited
            return 0.0
        return (self.daily_used / self.daily_limit) * 100

    def remaining(self) -> int:
        """Get remaining commands."""
        if self.daily_limit <= 0:  # Unlimited
            return -1  # -1 means unlimited
        return max(0, self.daily_limit - self.daily_used)

    def is_in_grace_period(self) -> bool:
        """Check if still within offline grace period."""
        if not self.last_online_validation:
            return False
        last_valid = datetime.fromisoformat(self.last_online_validation)
        now = datetime.now(timezone.utc)
        elapsed = (now - last_valid).total_seconds()
        return elapsed < self.grace_period_remaining

    def remaining_grace_seconds(self) -> int:
        """Get remaining seconds in grace period."""
        if not self.last_online_validation:
            return 0
        last_valid = datetime.fromisoformat(self.last_online_validation)
        now = datetime.now(timezone.utc)
        elapsed = (now - last_valid).total_seconds()
        return max(0, int(self.grace_period_remaining - elapsed))

    def remaining_grace_hours(self) -> float:
        """Get remaining grace period in hours (for display)."""
        return round(self.remaining_grace_seconds() / 3600, 1)


_DDL = """
CREATE TABLE IF NOT EXISTS quota_cache (
    key_id          TEXT PRIMARY KEY,
    daily_used      INTEGER NOT NULL,
    daily_limit     INTEGER NOT NULL,
    tier            TEXT NOT NULL,
    status          TEXT DEFAULT 'active',
    expires_at_ts   INTEGER DEFAULT 0,
    monthly_used    INTEGER DEFAULT 0,
    monthly_limit   INTEGER DEFAULT 0,
    cached_at       TEXT NOT NULL,
    expires_at      TEXT NOT NULL,
    grace_period_remaining INTEGER DEFAULT 86400,
    last_online_validation TEXT,
    is_offline_mode BOOLEAN DEFAULT FALSE,
    last_reset_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_quota_cache_expires
    ON quota_cache (expires_at);
"""


class QuotaCache:
    """SQLite-backed quota state cache with TTL and schema migration."""

    def __init__(self, db_path: Path = DB_PATH, ttl_seconds: int = DEFAULT_TTL_SECONDS):
        """Initialize cache.

        Args:
            db_path: SQLite file path
            ttl_seconds: Time-to-live for cache entries (default: 5 min)
        """
        self.db_path = db_path
        self.ttl_seconds = ttl_seconds
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Return WAL-mode SQLite connection."""
        conn = sqlite3.connect(str(self.db_path), timeout=10)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _migrate_schema(self, conn) -> None:
        """Migrate schema if missing columns exist.

        Adds new columns that may not exist in older DB versions.

        Args:
            conn: SQLite connection
        """
        # Check existing columns
        cursor = conn.execute("PRAGMA table_info(quota_cache)")
        existing_columns = {row[1] for row in cursor.fetchall()}

        # Columns to add if missing
        columns_to_add = {
            "grace_period_remaining": "INTEGER DEFAULT 86400",
            "last_online_validation": "TEXT",
            "is_offline_mode": "BOOLEAN DEFAULT 0",
            "last_reset_date": "TEXT",
        }

        # Add missing columns
        for col_name, col_def in columns_to_add.items():
            if col_name not in existing_columns:
                try:
                    conn.execute(
                        f"ALTER TABLE quota_cache ADD COLUMN {col_name} {col_def}"
                    )
                except sqlite3.OperationalError:
                    # Column may already exist or table may be locked
                    pass

    def _init_db(self) -> None:
        """Create quota_cache table if missing and migrate schema."""
        try:
            with closing(self._connect()) as conn:
                # Create table if not exists
                conn.executescript(_DDL)
                # Run schema migration if table exists
                self._migrate_schema(conn)
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache: DB init failed: {exc}") from exc

    @staticmethod
    def _now() -> datetime:
        """Current UTC datetime."""
        return datetime.now(timezone.utc)

    @staticmethod
    def _iso(dt: datetime) -> str:
        """Serialize datetime to ISO-8601."""
        return dt.isoformat()

    def get(self, key_id: str) -> Optional[QuotaState]:
        """
        Get cached quota state for key.
        Implements daily quota reset: if current date != cached date, reset daily_used to 0.

        Args:
            key_id: License key ID

        Returns:
            QuotaState if valid cache exists, None otherwise
        """
        try:
            with closing(self._connect()) as conn:
                row = conn.execute(
                    "SELECT * FROM quota_cache WHERE key_id = ? AND expires_at > ?",
                    (key_id, self._iso(self._now())),
                ).fetchone()

                if row:
                    state = QuotaState(
                        key_id=row["key_id"],
                        daily_used=row["daily_used"],
                        daily_limit=row["daily_limit"],
                        tier=row["tier"],
                        status=row["status"] if "status" in row.keys() else "active",
                        expires_at_ts=row["expires_at_ts"] if "expires_at_ts" in row.keys() else 0,
                        monthly_used=row["monthly_used"] if "monthly_used" in row.keys() else 0,
                        monthly_limit=row["monthly_limit"] if "monthly_limit" in row.keys() else 0,
                        cached_at=row["cached_at"],
                        expires_at=row["expires_at"],
                        grace_period_remaining=row["grace_period_remaining"] if "grace_period_remaining" in row.keys() else GRACE_PERIOD_SECONDS,
                        last_online_validation=row["last_online_validation"] if "last_online_validation" in row.keys() else "",
                        is_offline_mode=bool(row["is_offline_mode"]) if "is_offline_mode" in row.keys() else False,
                        last_reset_date=row["last_reset_date"] if "last_reset_date" in row.keys() else "",
                    )

                    # Fix 1: Daily Quota Reset - Check if date changed
                    today = self._now().strftime("%Y-%m-%d")
                    if state.last_reset_date and state.last_reset_date != today:
                        # Date changed - reset daily_used to 0
                        state.daily_used = 0
                        state.last_reset_date = today
                        # Update cache with reset values
                        self.set(
                            key_id=key_id,
                            daily_used=0,
                            daily_limit=state.daily_limit,
                            tier=state.tier,
                            status=state.status,
                            expires_at_ts=state.expires_at_ts,
                            monthly_used=state.monthly_used,
                            monthly_limit=state.monthly_limit,
                            grace_period_remaining=state.grace_period_remaining,
                            last_online_validation=state.last_online_validation,
                            is_offline_mode=state.is_offline_mode,
                        )

                    return state
                return None
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache.get failed: {exc}") from exc

    def set(
        self,
        key_id: str,
        daily_used: int,
        daily_limit: int,
        tier: str = "free",
        status: str = "active",
        expires_at_ts: int = 0,
        monthly_used: int = 0,
        monthly_limit: int = 0,
        grace_period_remaining: int = GRACE_PERIOD_SECONDS,
        last_online_validation: str = "",
        is_offline_mode: bool = False,
        last_reset_date: Optional[str] = None,
    ) -> QuotaState:
        """
        Cache quota state for key.

        Args:
            key_id: License key ID
            daily_used: Commands used today
            daily_limit: Daily command limit
            tier: License tier
            status: License status (active, revoked, expired)
            expires_at_ts: License expiration timestamp (Unix epoch)
            monthly_used: Commands used this month
            monthly_limit: Monthly command limit
            grace_period_remaining: Seconds remaining in grace period
            last_online_validation: ISO timestamp of last online validation
            is_offline_mode: True if currently in offline mode
            last_reset_date: Date of last daily reset (YYYY-MM-DD), defaults to today

        Returns:
            Created QuotaState
        """
        now = self._now()
        expires = now + timedelta(seconds=self.ttl_seconds)

        # Default last_reset_date to today if not provided
        if last_reset_date is None:
            last_reset_date = now.strftime("%Y-%m-%d")

        state = QuotaState(
            key_id=key_id,
            daily_used=daily_used,
            daily_limit=daily_limit,
            tier=tier,
            status=status,
            expires_at_ts=expires_at_ts,
            monthly_used=monthly_used,
            monthly_limit=monthly_limit,
            cached_at=self._iso(now),
            expires_at=self._iso(expires),
            grace_period_remaining=grace_period_remaining,
            last_online_validation=last_online_validation or self._iso(now),
            is_offline_mode=is_offline_mode,
            last_reset_date=last_reset_date,
        )

        try:
            with closing(self._connect()) as conn:
                conn.execute(
                    """INSERT OR REPLACE INTO quota_cache
                       (key_id, daily_used, daily_limit, tier, status, expires_at_ts,
                        monthly_used, monthly_limit, cached_at, expires_at,
                        grace_period_remaining, last_online_validation, is_offline_mode,
                        last_reset_date)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        key_id,
                        daily_used,
                        daily_limit,
                        tier,
                        status,
                        expires_at_ts,
                        monthly_used,
                        monthly_limit,
                        state.cached_at,
                        state.expires_at,
                        state.grace_period_remaining,
                        state.last_online_validation,
                        state.is_offline_mode,
                        state.last_reset_date,
                    ),
                )
                conn.commit()
            return state
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache.set failed: {exc}") from exc

    def invalidate(self, key_id: str) -> bool:
        """
        Invalidate cache for key.

        Args:
            key_id: License key ID

        Returns:
            True if entry was deleted
        """
        try:
            with closing(self._connect()) as conn:
                cursor = conn.execute(
                    "DELETE FROM quota_cache WHERE key_id = ?",
                    (key_id,)
                )
                conn.commit()
                return cursor.rowcount > 0
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache.invalidate failed: {exc}") from exc

    def clear(self) -> int:
        """
        Clear all expired entries.

        Returns:
            Number of entries cleared
        """
        try:
            with closing(self._connect()) as conn:
                cursor = conn.execute(
                    "DELETE FROM quota_cache WHERE expires_at <= ?",
                    (self._iso(self._now()),)
                )
                conn.commit()
                return cursor.rowcount
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache.clear failed: {exc}") from exc

    def clear_all(self) -> int:
        """
        Clear all entries (for testing).

        Returns:
            Number of entries cleared
        """
        try:
            with closing(self._connect()) as conn:
                cursor = conn.execute("DELETE FROM quota_cache")
                conn.commit()
                return cursor.rowcount
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache.clear_all failed: {exc}") from exc

    def get_all(self) -> list[QuotaState]:
        """
        Get all valid cached states.

        Returns:
            List of QuotaState objects
        """
        try:
            with closing(self._connect()) as conn:
                rows = conn.execute(
                    "SELECT * FROM quota_cache WHERE expires_at > ?",
                    (self._iso(self._now()),)
                ).fetchall()

                return [
                    QuotaState(
                        key_id=row["key_id"],
                        daily_used=row["daily_used"],
                        daily_limit=row["daily_limit"],
                        tier=row["tier"],
                        monthly_used=row["monthly_used"] if "monthly_used" in row.keys() else 0,
                        monthly_limit=row["monthly_limit"] if "monthly_limit" in row.keys() else 0,
                        cached_at=row["cached_at"],
                        expires_at=row["expires_at"],
                    )
                    for row in rows
                ]
        except sqlite3.Error as exc:
            raise RuntimeError(f"QuotaCache.get_all failed: {exc}") from exc


# Singleton instance
_cache: Optional[QuotaCache] = None


def get_cache(ttl_seconds: int = DEFAULT_TTL_SECONDS) -> QuotaCache:
    """Get global cache instance."""
    global _cache
    if _cache is None or _cache.ttl_seconds != ttl_seconds:
        _cache = QuotaCache(ttl_seconds=ttl_seconds)
    return _cache


def get_cached_quota(key_id: str) -> Optional[QuotaState]:
    """Get cached quota for key."""
    return get_cache().get(key_id)


def cache_quota(
    key_id: str,
    daily_used: int,
    daily_limit: int,
    tier: str = "free",
    status: str = "active",
    expires_at_ts: int = 0,
    monthly_used: int = 0,
    monthly_limit: int = 0,
    is_offline_mode: bool = False,
    grace_period_remaining: int = GRACE_PERIOD_SECONDS,
    last_reset_date: Optional[str] = None,
) -> QuotaState:
    """Cache quota state for key with grace period support."""
    now = datetime.now(timezone.utc)

    # Default last_reset_date to today if not provided
    if last_reset_date is None:
        last_reset_date = now.strftime("%Y-%m-%d")

    state = QuotaState(
        key_id=key_id,
        daily_used=daily_used,
        daily_limit=daily_limit,
        tier=tier,
        status=status,
        expires_at_ts=expires_at_ts,
        monthly_used=monthly_used,
        monthly_limit=monthly_limit,
        cached_at=now.isoformat(),
        expires_at=(now + timedelta(seconds=DEFAULT_TTL_SECONDS)).isoformat(),
        last_online_validation=now.isoformat() if not is_offline_mode else "",
        grace_period_remaining=grace_period_remaining,
        is_offline_mode=is_offline_mode,
        last_reset_date=last_reset_date,
    )
    return get_cache().set(
        key_id,
        daily_used,
        daily_limit,
        tier,
        status,
        expires_at_ts,
        monthly_used,
        monthly_limit,
        grace_period_remaining=grace_period_remaining,
        last_online_validation=state.last_online_validation,
        is_offline_mode=is_offline_mode,
        last_reset_date=state.last_reset_date,
    )


def invalidate_cache(key_id: str) -> bool:
    """Invalidate cache for key."""
    return get_cache().invalidate(key_id)


__all__ = [
    "QuotaCache",
    "QuotaState",
    "get_cache",
    "get_cached_quota",
    "cache_quota",
    "invalidate_cache",
]
