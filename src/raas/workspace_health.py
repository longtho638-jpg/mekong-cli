"""Workspace health score calculator.

Composite score from 3 dimensions:
- Usage activity (40%): event frequency + recency
- Feature adoption (35%): breadth of features used
- Billing health (25%): credit balance status
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from src.raas.engagement_store import EngagementStore, HealthSnapshot

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"


@dataclass
class WorkspaceHealthScore:
    workspace_id: str
    score: int  # 0-100
    grade: str  # A, B, C, D, F
    usage_score: int
    adoption_score: int
    billing_score: int
    active_users: int
    trend: str  # "improving", "stable", "declining"


class WorkspaceHealthCalculator:
    """Calculates composite health score for a workspace."""

    USAGE_WEIGHT = 0.40
    ADOPTION_WEIGHT = 0.35
    BILLING_WEIGHT = 0.25

    def __init__(self, store: Optional[EngagementStore] = None) -> None:
        self._store = store or EngagementStore(db_path=_DB_PATH)

    def calculate_health(self, workspace_id: str, days: int = 30) -> WorkspaceHealthScore:
        usage = self._calc_usage_score(workspace_id, days)
        adoption = self._calc_adoption_score(workspace_id, days)
        billing = self._calc_billing_score(workspace_id)

        total = int(usage * self.USAGE_WEIGHT + adoption * self.ADOPTION_WEIGHT + billing * self.BILLING_WEIGHT)
        total = max(0, min(100, total))
        grade = self._grade(total)
        active_users = self._store.get_workspace_user_count(workspace_id)
        trend = self._calc_trend(workspace_id)

        components = {"usage": usage, "adoption": adoption, "billing": billing}
        self._store.save_health_snapshot(workspace_id, total, grade, components)

        return WorkspaceHealthScore(
            workspace_id=workspace_id, score=total, grade=grade,
            usage_score=usage, adoption_score=adoption, billing_score=billing,
            active_users=active_users, trend=trend,
        )

    def get_history(self, workspace_id: str, days: int = 30) -> List[HealthSnapshot]:
        return self._store.get_health_history(workspace_id, days)

    def _calc_usage_score(self, workspace_id: str, days: int) -> int:
        if days == 0:
            return 0
        stats = self._store.get_workspace_event_stats(workspace_id, days)
        ratio = stats["active_days"] / days
        return min(100, int(ratio * 150))

    def _calc_adoption_score(self, workspace_id: str, days: int) -> int:
        types = self._store.get_workspace_feature_count(workspace_id, days)
        return min(100, int((types / 7) * 100))

    def _calc_billing_score(self, workspace_id: str) -> int:
        balance = self._store.get_billing_balance(workspace_id)
        if balance is None:
            return 50
        if balance >= 100:
            return 100
        if balance >= 50:
            return 75
        if balance >= 10:
            return 40
        return 10

    def _calc_trend(self, workspace_id: str) -> str:
        history = self._store.get_health_history(workspace_id, days=7)
        if len(history) < 2:
            return "stable"
        diff = history[0].score - history[-1].score
        if diff >= 5:
            return "improving"
        if diff <= -5:
            return "declining"
        return "stable"

    def _grade(self, score: int) -> str:
        if score >= 80:
            return "A"
        if score >= 60:
            return "B"
        if score >= 40:
            return "C"
        if score >= 20:
            return "D"
        return "F"
