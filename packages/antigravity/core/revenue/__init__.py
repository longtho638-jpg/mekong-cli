"""
Revenue Engine Facade.
"""
from typing import Dict, List

from .engine import ARR_TARGET_2026, RevenueEngineLogic
from .models import Currency, Forecast, Invoice, InvoiceStatus


class RevenueEngine(RevenueEngineLogic):
    """Refactored Revenue Engine."""
    def __init__(self):
        super().__init__()

    def get_stats(self) -> Dict:
        return {
            "total_invoices": len(self.invoices),
            "total_revenue_usd": self.get_total_revenue(),
            "mrr": self.get_mrr(),
            "arr": self.get_arr(),
        }

    def get_goal_dashboard(self) -> Dict:
        arr = self.get_arr()
        return {
            "current_arr": arr,
            "target_arr": ARR_TARGET_2026,
            "progress_percent": min((arr / ARR_TARGET_2026) * 100, 100) if ARR_TARGET_2026 else 0,
        }

__all__ = ['RevenueEngine', 'Invoice', 'InvoiceStatus', 'Currency', 'Forecast']
