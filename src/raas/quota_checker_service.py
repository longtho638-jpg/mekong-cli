"""Quota checker service for workspace usage limits (SQLite version)."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional
import sqlite3

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "workspaces.db"


@dataclass
class UsageQuota:
    """Represents a workspace's usage quota."""

    workspace_id: str
    tier: str
    daily_used: int
    monthly_used: int
    daily_limit: int
    monthly_limit: int
    last_reset_daily: str = ""
    last_reset_monthly: str = ""
    overage_allowed: bool = False


@dataclass
class QuotaStatus:
    """Result of a quota check."""

    allowed: bool
    daily_remaining: int
    monthly_remaining: int
    retry_after: Optional[str] = None  # ISO timestamp when quota resets
    reason: str = ""


# Tier configurations
TIER_LIMITS: dict[str, dict[str, int]] = {
    "free": {"daily": 10, "monthly": 100},
    "starter": {"daily": 50, "monthly": 500},
    "growth": {"daily": 200, "monthly": 2000},
    "pro": {"daily": 500, "monthly": 5000},
    "enterprise": {"daily": 0, "monthly": 0},  # 0 = unlimited
}

# Tiers that allow overage billing (soft limit)
SOFT_LIMIT_TIERS = {"starter", "growth", "pro"}


class QuotaCheckerService:
    """
    SQLite service for workspace quota enforcement.

    Usage:
        service = QuotaCheckerService()
        status = service.check_quota(workspace_id)
        if status.allowed:
            service.record_usage(workspace_id, credits=1)
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
        """Create usage_quotas table if it doesn't exist."""
        try:
            with self._connect() as conn:
                conn.executescript("""
                -- Usage quotas per workspace
                CREATE TABLE IF NOT EXISTS usage_quotas (
                    workspace_id     TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
                    tier             TEXT NOT NULL DEFAULT 'free',
                    daily_used       INTEGER NOT NULL DEFAULT 0,
                    monthly_used     INTEGER NOT NULL DEFAULT 0,
                    daily_limit      INTEGER NOT NULL DEFAULT 10,
                    monthly_limit    INTEGER NOT NULL DEFAULT 100,
                    last_reset_daily TEXT NOT NULL,
                    last_reset_monthly TEXT NOT NULL,
                    overage_allowed  INTEGER DEFAULT 0,
                    updated_at       TEXT NOT NULL
                );

                -- Index for tier lookups
                CREATE INDEX IF NOT EXISTS idx_usage_quotas_tier ON usage_quotas(tier);
                """)
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to initialize quota DB: {exc}") from exc

    @staticmethod
    def _now_iso() -> str:
        """Return current UTC time as ISO 8601 string."""
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _today_utc() -> str:
        """Return today's date in UTC (YYYY-MM-DD)."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    @staticmethod
    def _month_utc() -> str:
        """Return current month in UTC (YYYY-MM)."""
        return datetime.now(timezone.utc).strftime("%Y-%m")

    def _get_tier_limits(self, tier: str) -> dict[str, int]:
        """Get limits for a tier."""
        return TIER_LIMITS.get(tier, TIER_LIMITS["free"])

    def _is_soft_limit_tier(self, tier: str) -> bool:
        """Check if tier allows soft limits (overage billing)."""
        return tier in SOFT_LIMIT_TIERS

    def create_quota(
        self,
        workspace_id: str,
        tier: str = "free",
    ) -> UsageQuota:
        """Create a new quota record for a workspace."""
        now = self._now_iso()
        today = self._today_utc()
        month = self._month_utc()
        limits = self._get_tier_limits(tier)
        overage = tier in SOFT_LIMIT_TIERS

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO usage_quotas
                    (workspace_id, tier, daily_used, monthly_used, daily_limit, monthly_limit,
                     last_reset_daily, last_reset_monthly, overage_allowed, updated_at)
                    VALUES (?, 0, 0, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(workspace_id) DO NOTHING
                    """,
                    (workspace_id, tier, limits["daily"], limits["monthly"],
                     today, month, 1 if overage else 0, now),
                )
                conn.commit()
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to create quota: {exc}") from exc

        return UsageQuota(
            workspace_id=workspace_id,
            tier=tier,
            daily_used=0,
            monthly_used=0,
            daily_limit=limits["daily"],
            monthly_limit=limits["monthly"],
            last_reset_daily=today,
            last_reset_monthly=month,
            overage_allowed=overage,
        )

    def get_quota(self, workspace_id: str) -> Optional[UsageQuota]:
        """Get quota details for a workspace."""
        try:
            with self._connect() as conn:
                row = conn.execute(
                    "SELECT * FROM usage_quotas WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()

                if not row:
                    return None

                return UsageQuota(
                    workspace_id=row["workspace_id"],
                    tier=row["tier"],
                    daily_used=int(row["daily_used"]),
                    monthly_used=int(row["monthly_used"]),
                    daily_limit=int(row["daily_limit"]),
                    monthly_limit=int(row["monthly_limit"]),
                    last_reset_daily=row["last_reset_daily"],
                    last_reset_monthly=row["last_reset_monthly"],
                    overage_allowed=bool(row["overage_allowed"]),
                )
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to get quota: {exc}") from exc

    def check_quota(self, workspace_id: str, credits: int = 1) -> QuotaStatus:
        """
        Check if workspace has remaining quota.

        Args:
            workspace_id: Target workspace
            credits: Number of credits to check (default 1)

        Returns:
            QuotaStatus with allowed flag and remaining quota info
        """
        quota = self.get_quota(workspace_id)

        # Auto-create quota if not exists (default to free tier)
        if not quota:
            quota = self.create_quota(workspace_id, "free")

        # Reset daily/monthly if period changed
        quota = self._reset_if_period_changed(quota)

        daily_remaining = self._calc_remaining(quota.daily_used, quota.daily_limit)
        monthly_remaining = self._calc_remaining(quota.monthly_used, quota.monthly_limit)

        # Unlimited tier
        if quota.tier == "enterprise":
            return QuotaStatus(
                allowed=True,
                daily_remaining=999999,
                monthly_remaining=999999,
                reason="Unlimited tier",
            )

        # Check hard limits first
        if daily_remaining < credits and monthly_remaining < credits:
            return QuotaStatus(
                allowed=False,
                daily_remaining=0,
                monthly_remaining=0,
                retry_after=self._next_reset_time(quota, "daily"),
                reason="Quota exhausted (daily and monthly limits reached)",
            )

        if daily_remaining < credits:
            return QuotaStatus(
                allowed=quota.overage_allowed,
                daily_remaining=0,
                monthly_remaining=monthly_remaining,
                retry_after=self._next_reset_time(quota, "daily"),
                reason="Daily quota exhausted" + (" (overage allowed)" if quota.overage_allowed else ""),
            )

        if monthly_remaining < credits:
            return QuotaStatus(
                allowed=quota.overage_allowed,
                daily_remaining=daily_remaining,
                monthly_remaining=0,
                retry_after=self._next_reset_time(quota, "monthly"),
                reason="Monthly quota exhausted" + (" (overage allowed)" if quota.overage_allowed else ""),
            )

        # Allowed
        return QuotaStatus(
            allowed=True,
            daily_remaining=daily_remaining - credits,
            monthly_remaining=monthly_remaining - credits,
            reason="OK",
        )

    def _calc_remaining(self, used: int, limit: int) -> int:
        """Calculate remaining quota (0 = unlimited)."""
        if limit == 0:
            return 999999  # Unlimited
        return max(0, limit - used)

    def _reset_if_period_changed(self, quota: UsageQuota) -> UsageQuota:
        """Reset counters if daily/monthly period has changed."""
        today = self._today_utc()
        month = self._month_utc()

        needs_update = False
        new_daily = quota.daily_used
        new_monthly = quota.monthly_used

        if quota.last_reset_daily != today:
            new_daily = 0
            needs_update = True

        if quota.last_reset_monthly != month:
            new_monthly = 0
            needs_update = True

        if not needs_update:
            return quota

        # Update in DB
        now = self._now_iso()
        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE usage_quotas
                    SET daily_used = ?, monthly_used = ?,
                        last_reset_daily = COALESCE(?, last_reset_daily),
                        last_reset_monthly = COALESCE(?, last_reset_monthly),
                        updated_at = ?
                    WHERE workspace_id = ?
                    """,
                    (new_daily, new_monthly,
                     today if quota.last_reset_daily != today else None,
                     month if quota.last_reset_monthly != month else None,
                     now, quota.workspace_id),
                )
                conn.commit()
        except sqlite3.Error as exc:
            logger.warning(f"Failed to reset quota counters: {exc}")
            return quota  # Return original on error

        return UsageQuota(
            workspace_id=quota.workspace_id,
            tier=quota.tier,
            daily_used=new_daily,
            monthly_used=new_monthly,
            daily_limit=quota.daily_limit,
            monthly_limit=quota.monthly_limit,
            last_reset_daily=today if quota.last_reset_daily != today else quota.last_reset_daily,
            last_reset_monthly=month if quota.last_reset_monthly != month else quota.last_reset_monthly,
            overage_allowed=quota.overage_allowed,
        )

    def _next_reset_time(self, quota: UsageQuota, period: str) -> str:
        """Get next reset time as ISO timestamp."""
        now = datetime.now(timezone.utc)

        if period == "daily":
            # Tomorrow at midnight UTC
            next_reset = (now + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        else:
            # First of next month at midnight UTC
            if now.month == 12:
                next_reset = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                next_reset = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)

        return next_reset.isoformat()

    def record_usage(
        self,
        workspace_id: str,
        credits: int = 1,
        mission_type: str = "standard",
    ) -> bool:
        """
        Record credit usage for a workspace.

        Args:
            workspace_id: Target workspace
            credits: Number of credits used (default 1)
            mission_type: Type of mission (simple/standard/complex)

        Returns:
            True if recorded successfully
        """
        now = self._now_iso()

        try:
            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE usage_quotas
                    SET daily_used = daily_used + ?,
                        monthly_used = monthly_used + ?,
                        updated_at = ?
                    WHERE workspace_id = ?
                    """,
                    (credits, credits, now, workspace_id),
                )
                conn.commit()
                return True
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to record usage: {exc}") from exc

    def get_usage_status(self, workspace_id: str) -> dict:
        """
        Get current usage status for dashboard display.

        Returns:
            Dictionary with usage percentages and limits
        """
        quota = self.get_quota(workspace_id)
        if not quota:
            return {
                "workspace_id": workspace_id,
                "tier": "free",
                "daily_used": 0,
                "daily_limit": 10,
                "daily_percent": 0,
                "monthly_used": 0,
                "monthly_limit": 100,
                "monthly_percent": 0,
            }

        daily_percent = (
            (quota.daily_used / quota.daily_limit * 100) if quota.daily_limit > 0 else 0
        )
        monthly_percent = (
            (quota.monthly_used / quota.monthly_limit * 100) if quota.monthly_limit > 0 else 0
        )

        return {
            "workspace_id": workspace_id,
            "tier": quota.tier,
            "daily_used": quota.daily_used,
            "daily_limit": quota.daily_limit,
            "daily_remaining": self._calc_remaining(quota.daily_used, quota.daily_limit),
            "daily_percent": round(daily_percent, 1),
            "monthly_used": quota.monthly_used,
            "monthly_limit": quota.monthly_limit,
            "monthly_remaining": self._calc_remaining(quota.monthly_used, quota.monthly_limit),
            "monthly_percent": round(monthly_percent, 1),
            "overage_allowed": quota.overage_allowed,
        }

    def update_tier(self, workspace_id: str, tier: str) -> bool:
        """
        Update workspace tier (called by Polar webhook).

        Args:
            workspace_id: Target workspace
            tier: New tier name (free/starter/growth/pro/enterprise)

        Returns:
            True if updated successfully
        """
        if tier not in TIER_LIMITS:
            raise ValueError(f"Unknown tier: {tier}")

        limits = self._get_tier_limits(tier)
        overage = tier in SOFT_LIMIT_TIERS
        now = self._now_iso()

        try:
            with self._connect() as conn:
                # Check if exists
                row = conn.execute(
                    "SELECT 1 FROM usage_quotas WHERE workspace_id = ?",
                    (workspace_id,),
                ).fetchone()

                if row:
                    conn.execute(
                        """
                        UPDATE usage_quotas
                        SET tier = ?, daily_limit = ?, monthly_limit = ?,
                            overage_allowed = ?, updated_at = ?
                        WHERE workspace_id = ?
                        """,
                        (tier, limits["daily"], limits["monthly"], 1 if overage else 0, now, workspace_id),
                    )
                else:
                    # Create new quota with new tier
                    today = self._today_utc()
                    month = self._month_utc()
                    conn.execute(
                        """
                        INSERT INTO usage_quotas
                        (workspace_id, tier, daily_used, monthly_used, daily_limit, monthly_limit,
                         last_reset_daily, last_reset_monthly, overage_allowed, updated_at)
                        VALUES (?, 0, 0, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (workspace_id, tier, limits["daily"], limits["monthly"],
                         today, month, 1 if overage else 0, now),
                    )

                conn.commit()
                return True
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed to update tier: {exc}") from exc
