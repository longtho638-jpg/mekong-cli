"""
Revenue Goal Tracking Logic.
"""
import math
from typing import Any, Dict

from ..config import ARR_TARGET_2026, DEFAULT_GROWTH_RATE


class GoalTracker:
    """Tracks progress toward revenue milestones."""

    def get_goal_summary(self, current_arr: float) -> Dict[str, Any]:
        """Aggregates all metrics relevant to the $1M ARR target."""
        progress = min((current_arr / ARR_TARGET_2026) * 100, 100)
        gap = max(ARR_TARGET_2026 - current_arr, 0)

        return {
            "current_arr": current_arr,
            "target_arr": ARR_TARGET_2026,
            "progress_percent": round(progress, 1),
            "gap_usd": gap,
            "months_to_goal": self._calculate_months_to_goal(current_arr),
        }

    def _calculate_months_to_goal(self, current_arr: float) -> int:
        """Estimates time to milestone based on growth velocity."""
        if current_arr >= ARR_TARGET_2026:
            return 0
        if current_arr <= 0:
            return -1  # Undefined

        # log(target / current) / log(1 + growth)
        return math.ceil(
            math.log(ARR_TARGET_2026 / current_arr) / math.log(1 + DEFAULT_GROWTH_RATE)
        )
