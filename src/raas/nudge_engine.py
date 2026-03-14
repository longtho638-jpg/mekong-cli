"""Re-engagement nudge engine.

Generates nudges for users based on engagement state.
Tracks dismissals to prevent nudge fatigue (max 3 active).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.raas.engagement_store import EngagementStore
from src.raas.engagement_tracker import EngagementTracker

logger = logging.getLogger(__name__)

_DB_PATH = Path.home() / ".mekong" / "raas" / "tenants.db"
MAX_ACTIVE_NUDGES = 3


@dataclass
class Nudge:
    nudge_id: str
    category: str  # "comeback", "feature_discovery", "milestone", "tip"
    title: str
    message: str
    priority: int = 1  # 1=high, 2=medium, 3=low
    action_url: Optional[str] = None
    action_label: Optional[str] = None


class NudgeEngine:
    """Rule-based nudge generation for re-engagement."""

    def __init__(self, store: Optional[EngagementStore] = None,
                 tracker: Optional[EngagementTracker] = None) -> None:
        self._store = store or EngagementStore(db_path=_DB_PATH)
        self._tracker = tracker or EngagementTracker(store=self._store)
        self._catalog = self._build_catalog()

    def get_nudges(self, user_id: str) -> List[Nudge]:
        """Get active nudges for user (max 3, excluding dismissed)."""
        score = self._tracker.get_engagement_score(user_id, days=30)
        dismissed = set(self._store.get_dismissed_nudge_ids(user_id))

        candidates: List[Nudge] = []

        if score.days_since_last >= 7:
            candidates.extend(self._catalog.get("comeback", []))
        if score.unique_features <= 2:
            candidates.extend(self._catalog.get("feature_discovery", []))
        if score.total_events >= 50:
            candidates.extend(self._catalog.get("milestone", []))
        if score.level in ("at_risk", "inactive"):
            candidates.extend(self._catalog.get("tip", []))

        # Filter dismissed, deduplicate, sort by priority, limit
        seen: set[str] = set()
        active: List[Nudge] = []
        for nudge in sorted(candidates, key=lambda n: n.priority):
            if nudge.nudge_id not in dismissed and nudge.nudge_id not in seen:
                active.append(nudge)
                seen.add(nudge.nudge_id)
            if len(active) >= MAX_ACTIVE_NUDGES:
                break

        return active

    def dismiss_nudge(self, user_id: str, nudge_id: str, reason: str = "manual") -> bool:
        return self._store.dismiss_nudge(user_id, nudge_id, reason)

    def _build_catalog(self) -> Dict[str, List[Nudge]]:
        return {
            "comeback": [
                Nudge("comeback_miss_you", "comeback", "We Miss You!",
                      "It's been a while. Pick up where you left off.", 1,
                      "/dashboard", "Go to Dashboard"),
                Nudge("comeback_new_features", "comeback", "New Features Await",
                      "Check out what's new since your last visit.", 2,
                      "/dashboard/changelog", "See What's New"),
            ],
            "feature_discovery": [
                Nudge("discover_analytics", "feature_discovery", "Unlock Analytics",
                      "Track your team's performance with built-in analytics.", 2,
                      "/onboarding/analytics", "View Analytics"),
                Nudge("discover_agents", "feature_discovery", "Try AI Agents",
                      "Automate repetitive tasks with custom AI agents.", 2,
                      "/dashboard/agents", "Explore Agents"),
            ],
            "milestone": [
                Nudge("milestone_50_missions", "milestone", "50 Missions!",
                      "You've completed 50 AI missions. Keep the momentum!", 1),
                Nudge("milestone_power_user", "milestone", "Power User Status",
                      "You're using 5+ features regularly. Impressive!", 2),
            ],
            "tip": [
                Nudge("tip_shortcuts", "tip", "Pro Tip: Keyboard Shortcuts",
                      "Speed up your workflow with mekong CLI shortcuts.", 3),
                Nudge("tip_templates", "tip", "Save Time with Templates",
                      "Create reusable mission templates for common tasks.", 3,
                      "/dashboard/templates", "Create Template"),
            ],
        }
