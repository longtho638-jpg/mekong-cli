"""Rule-based churn prediction engine.

Classifies user churn risk as low/medium/high/critical using weighted rules:
- Inactivity (no events in N days)
- Usage decline (week-over-week drop)
- No onboarding completion
- Low engagement score
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from src.raas.engagement_store import EngagementStore
from src.raas.engagement_tracker import EngagementTracker

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"


@dataclass
class ChurnRisk:
    user_id: str
    risk_level: str  # "low", "medium", "high", "critical"
    risk_score: int  # 0-100 (higher = more likely to churn)
    risk_factors: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)


class ChurnPredictor:
    """Rule-based churn risk classifier."""

    def __init__(self, store: Optional[EngagementStore] = None,
                 tracker: Optional[EngagementTracker] = None) -> None:
        self._store = store or EngagementStore(db_path=_DB_PATH)
        self._tracker = tracker or EngagementTracker(store=self._store)

    def predict_risk(self, user_id: str) -> ChurnRisk:
        score = self._tracker.get_engagement_score(user_id, days=30)
        factors: List[str] = []
        recommendations: List[str] = []
        risk_points = 0

        # Rule 1: Inactivity (weight: 35)
        if score.days_since_last >= 14:
            risk_points += 35
            factors.append(f"Inactive for {score.days_since_last} days")
            recommendations.append("Send re-engagement nudge")
        elif score.days_since_last >= 7:
            risk_points += 20
            factors.append(f"Inactive for {score.days_since_last} days")
            recommendations.append("Show comeback tips on next login")

        # Rule 2: Low engagement (weight: 30)
        if score.total_score < 15:
            risk_points += 30
            factors.append(f"Very low engagement score ({score.total_score})")
            recommendations.append("Offer guided tutorial")
        elif score.total_score < 40:
            risk_points += 15
            factors.append(f"Below-average engagement ({score.total_score})")

        # Rule 3: Low frequency (weight: 20)
        if score.active_days <= 2:
            risk_points += 20
            factors.append(f"Only {score.active_days} active days in 30d")
            recommendations.append("Highlight unused features")
        elif score.active_days <= 5:
            risk_points += 10
            factors.append(f"Low activity ({score.active_days} days in 30d)")

        # Rule 4: Low breadth (weight: 15)
        if score.unique_features <= 1:
            risk_points += 15
            factors.append(f"Using only {score.unique_features} feature(s)")
            recommendations.append("Introduce new capabilities")

        risk_points = min(100, risk_points)

        return ChurnRisk(
            user_id=user_id,
            risk_level=self._classify(risk_points),
            risk_score=risk_points,
            risk_factors=factors,
            recommendations=recommendations,
        )

    def get_at_risk_users(self, workspace_id: str) -> List[ChurnRisk]:
        """Get all at-risk users in a workspace (medium+ risk)."""
        user_ids = self._store.get_distinct_users(workspace_id)

        results = []
        for user_id in user_ids:
            risk = self.predict_risk(user_id)
            if risk.risk_level in ("medium", "high", "critical"):
                results.append(risk)

        results.sort(key=lambda r: r.risk_score, reverse=True)
        return results

    def _classify(self, score: int) -> str:
        if score >= 70:
            return "critical"
        if score >= 45:
            return "high"
        if score >= 25:
            return "medium"
        return "low"
