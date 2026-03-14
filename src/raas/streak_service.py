"""Usage streak tracking with gamification.

Tracks daily usage streaks with 1 grace day.
Awards milestone badges at 7, 14, 30, 60, 100, 365 days.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from src.raas.engagement_store import EngagementStore, StreakData

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

STREAK_MILESTONES = [
    (7, "Week Warrior", "7-day streak"),
    (14, "Fortnight Fighter", "14-day streak"),
    (30, "Monthly Master", "30-day streak"),
    (60, "Two-Month Titan", "60-day streak"),
    (100, "Century Champion", "100-day streak"),
    (365, "Year Legend", "365-day streak"),
]


@dataclass
class Badge:
    name: str
    description: str
    earned: bool
    days_required: int


@dataclass
class StreakInfo:
    user_id: str
    current_streak: int
    longest_streak: int
    last_active_date: Optional[str]
    grace_used: bool
    badges: List[Badge] = field(default_factory=list)


class StreakService:
    """Daily usage streak tracking with grace day and badges."""

    GRACE_DAYS = 1

    def __init__(self, store: Optional[EngagementStore] = None) -> None:
        self._store = store or EngagementStore(db_path=_DB_PATH)

    def record_daily_activity(self, user_id: str) -> StreakInfo:
        """Record activity and update streak. Call once per active day."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        existing = self._store.get_streak(user_id)

        if not existing:
            data = StreakData(user_id, 1, 1, today, today, 0)
            self._store.upsert_streak(data)
            return self._build_info(data)

        if existing.last_active_date == today:
            return self._build_info(existing)  # Already recorded today

        days_gap = self._days_between(existing.last_active_date or today, today)

        if days_gap == 1:
            # Consecutive day
            new_streak = existing.current_streak + 1
            grace_used = 0
        elif days_gap == 2 and existing.grace_used == 0:
            # Grace day used
            new_streak = existing.current_streak + 1
            grace_used = 1
        else:
            # Streak broken
            new_streak = 1
            grace_used = 0

        longest = max(existing.longest_streak, new_streak)
        started = existing.streak_started if new_streak > 1 else today

        data = StreakData(user_id, new_streak, longest, today, started, grace_used)
        self._store.upsert_streak(data)
        return self._build_info(data)

    def get_streak(self, user_id: str) -> StreakInfo:
        """Get current streak info without recording activity."""
        data = self._store.get_streak(user_id)
        if not data:
            data = StreakData(user_id, 0, 0, None, None, 0)
        return self._build_info(data)

    def _build_info(self, data: StreakData) -> StreakInfo:
        badges = [
            Badge(name, desc, data.longest_streak >= days, days)
            for days, name, desc in STREAK_MILESTONES
        ]
        return StreakInfo(
            user_id=data.user_id,
            current_streak=data.current_streak,
            longest_streak=data.longest_streak,
            last_active_date=data.last_active_date,
            grace_used=data.grace_used > 0,
            badges=badges,
        )

    def _days_between(self, date1: str, date2: str) -> int:
        d1 = datetime.strptime(date1, "%Y-%m-%d")
        d2 = datetime.strptime(date2, "%Y-%m-%d")
        return abs((d2 - d1).days)
