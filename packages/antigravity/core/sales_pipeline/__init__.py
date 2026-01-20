"""
Sales Pipeline Facade.
"""
from typing import Dict, List

from .engine import SalesPipeline as BasePipeline
from .models import DealStage, DealTier, StartupDeal, WinCheck, WinType


class SalesPipeline(BasePipeline):
    def get_stats(self) -> Dict:
        won = len([d for d in self.deals if d.stage == DealStage.CLOSED_WON])
        lost = len([d for d in self.deals if d.stage == DealStage.CLOSED_LOST])
        total_arr = sum(d.get_annual_retainer() for d in self.deals if d.stage == DealStage.CLOSED_WON)
        return {
            "total_deals": len(self.deals),
            "won_deals": won,
            "lost_deals": lost,
            "total_arr": total_arr,
        }

__all__ = ['SalesPipeline', 'DealTier', 'DealStage', 'WinType', 'WinCheck', 'StartupDeal']
