"""
Antigravity Kit - Revenue Engine Module
Wrapper around Core Finance
"""
from typing import Dict
from core.modules.finance import FinancialReportsService

class RevenueEngine:
    """Powering the cash flow."""

    def __init__(self):
        self.finance = FinancialReportsService("Agency")

    def ignite(self) -> str:
        return "🚀 Revenue Engine Ignited!"

    def get_stats(self) -> Dict[str, float]:
        """Dashboard ready stats."""
        # Mock logic based on finance service
        if not self.finance.pnl_history:
            return {"mrr": 0.0, "arr": 0.0}

        latest = self.finance.pnl_history[0]
        return {
            "mrr": latest.revenue,
            "arr": latest.revenue * 12,
            "margin": (latest.net_income / latest.revenue * 100) if latest.revenue else 0
        }

    def get_goal_dashboard(self) -> Dict:
        """Visual goal tracking."""
        stats = self.get_stats()
        goal = 1000000 # 1M ARR
        return {
            "current_arr": stats['arr'],
            "goal_arr": goal,
            "progress_percent": (stats['arr'] / goal) * 100
        }
