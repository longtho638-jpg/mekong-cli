"""
💰 Cashflow Analytics Logic
"""
from datetime import datetime, timedelta
from typing import Dict, List

from .models import ARR_TARGET_2026, Revenue, RevenueGoal, RevenueStream


class CashflowAnalytics:
    """Handles calculations and projections for revenue data."""

    def __init__(self):
        self.goals: Dict[RevenueStream, RevenueGoal] = self._init_goals()

    def _init_goals(self) -> Dict[RevenueStream, RevenueGoal]:
        """Distributes the $1M goal across diversified streams."""
        return {
            RevenueStream.WELLNEXUS: RevenueGoal(RevenueStream.WELLNEXUS, 300_000),
            RevenueStream.AGENCY: RevenueGoal(RevenueStream.AGENCY, 400_000),
            RevenueStream.SAAS: RevenueGoal(RevenueStream.SAAS, 200_000),
            RevenueStream.CONSULTING: RevenueGoal(RevenueStream.CONSULTING, 80_000),
            RevenueStream.AFFILIATE: RevenueGoal(RevenueStream.AFFILIATE, 20_000),
        }

    def recalculate_progress(self, revenues: List[Revenue]) -> None:
        """Re-evaluates current ARR across all streams based on provided revenues."""
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)

        # Reset current ARR for all goals
        for goal in self.goals.values():
            goal.current_arr = 0.0

        for rev in revenues:
            goal = self.goals.get(rev.stream)
            if not goal:
                continue

            if rev.recurring:
                # Only count recurring if it happened in last 30 days (active)
                if rev.date >= thirty_days_ago:
                    goal.current_arr += rev.amount_usd * 12
            else:
                # One-time revenue counts toward ARR for the current period
                # Note: This logic seems to treat one-time revenue as ARR contribution directly?
                # Keeping consistent with original logic:
                # "One-time revenue counts toward ARR for the current period"
                goal.current_arr += rev.amount_usd

    def get_total_arr(self) -> float:
        """Returns the aggregate ARR across all streams."""
        return sum(g.current_arr for g in self.goals.values())

    def get_progress_percent(self) -> float:
        """Returns overall progress percentage toward $1M."""
        return (self.get_total_arr() / ARR_TARGET_2026) * 100

    def get_required_mrr_growth(self) -> float:
        """
        Calculates the required monthly growth rate to hit $1M by end of 2026.
        Assumes linear compounding growth.
        """
        current_mrr = self.get_total_arr() / 12
        target_mrr = ARR_TARGET_2026 / 12

        # Determine months remaining in 2026
        now = datetime.now()
        if now.year < 2026:
            months_left = 12
        elif now.year == 2026:
            months_left = 12 - now.month + 1
        else:
            months_left = 1  # Already past 2026?

        if current_mrr <= 0:
            return 100.0  # High growth needed

        if current_mrr >= target_mrr:
            return 0.0

        # target = current * (1 + rate)^months
        rate = (target_mrr / current_mrr) ** (1 / months_left) - 1
        return rate * 100
