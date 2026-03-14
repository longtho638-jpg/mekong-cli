"""Engagement scoring service.

Calculates engagement score (0-100) based on:
- Recency: days since last activity (40%)
- Frequency: active days in period (35%)
- Breadth: unique feature types used (25%)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from src.raas.engagement_store import EngagementStore

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"

KNOWN_EVENT_TYPES = [
    "mission_run", "command_used", "login", "api_call",
    "workspace_switch", "config_change", "export_data",
]


@dataclass
class EngagementScore:
    user_id: str
    total_score: int  # 0-100
    recency_score: int  # 0-100
    frequency_score: int  # 0-100
    breadth_score: int  # 0-100
    active_days: int
    total_events: int
    unique_features: int
    days_since_last: int
    level: str  # "highly_engaged", "engaged", "at_risk", "inactive"


class EngagementTracker:
    """Calculates user engagement scores from activity data."""

    RECENCY_WEIGHT = 0.40
    FREQUENCY_WEIGHT = 0.35
    BREADTH_WEIGHT = 0.25

    def __init__(self, store: Optional[EngagementStore] = None) -> None:
        self._store = store or EngagementStore(db_path=_DB_PATH)

    def record_activity(self, user_id: str, workspace_id: str, event_type: str) -> None:
        self._store.track_event(user_id, workspace_id, event_type)

    def get_engagement_score(self, user_id: str, days: int = 30) -> EngagementScore:
        active_dates = self._store.get_active_dates(user_id, days=days)
        daily_counts = self._store.get_daily_event_counts(user_id, days=days)

        active_days = len(active_dates)
        total_events = sum(d.total_events for d in daily_counts)
        all_types: set[str] = set()
        for d in daily_counts:
            all_types.update(d.event_types)
        unique_features = len(all_types)

        # Recency: days since last activity
        if active_dates:
            last_date = max(active_dates)
            last_dt = datetime.strptime(last_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            days_since = (datetime.now(timezone.utc) - last_dt).days
        else:
            days_since = days + 1

        recency = self._score_recency(days_since)
        frequency = self._score_frequency(active_days, days)
        breadth = self._score_breadth(unique_features)

        total = int(
            recency * self.RECENCY_WEIGHT
            + frequency * self.FREQUENCY_WEIGHT
            + breadth * self.BREADTH_WEIGHT
        )
        total = max(0, min(100, total))

        return EngagementScore(
            user_id=user_id, total_score=total,
            recency_score=recency, frequency_score=frequency, breadth_score=breadth,
            active_days=active_days, total_events=total_events,
            unique_features=unique_features, days_since_last=days_since,
            level=self._classify_level(total),
        )

    def _score_recency(self, days_since: int) -> int:
        if days_since <= 1:
            return 100
        if days_since <= 3:
            return 80
        if days_since <= 7:
            return 60
        if days_since <= 14:
            return 30
        return 0

    def _score_frequency(self, active_days: int, period_days: int) -> int:
        if period_days == 0:
            return 0
        ratio = active_days / period_days
        return min(100, int(ratio * 150))  # 67%+ daily usage = 100

    def _score_breadth(self, unique_features: int) -> int:
        max_features = len(KNOWN_EVENT_TYPES)
        return min(100, int((unique_features / max_features) * 100))

    def _classify_level(self, score: int) -> str:
        if score >= 70:
            return "highly_engaged"
        if score >= 40:
            return "engaged"
        if score >= 15:
            return "at_risk"
        return "inactive"
