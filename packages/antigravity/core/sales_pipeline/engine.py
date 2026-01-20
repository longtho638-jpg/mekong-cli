"""
Sales Pipeline engine and pricing logic.
"""
from datetime import datetime
from typing import Dict, List

from .models import DealStage, DealTier, StartupDeal

TIER_PRICING = {
    DealTier.WARRIOR: {"retainer": 2000, "equity_range": (5, 8), "success_fee": 2.0, "description": "Pre-Seed/Seed Stage"},
    DealTier.GENERAL: {"retainer": 5000, "equity_range": (3, 5), "success_fee": 1.5, "description": "Series A Support"},
    DealTier.TUONG_QUAN: {"retainer": 0, "equity_range": (15, 30), "success_fee": 0, "description": "Venture Studio Co-Founder"},
}

class SalesPipeline:
    def __init__(self):
        self.deals: List[StartupDeal] = []
        self._next_id = 1

    def create_deal(self, startup_name: str, founder_name: str = "", email: str = "", tier: DealTier = DealTier.WARRIOR) -> StartupDeal:
        pricing = TIER_PRICING[tier]
        deal = StartupDeal(id=self._next_id, startup_name=startup_name, founder_name=founder_name, email=email, tier=tier, retainer_monthly=pricing["retainer"], equity_percent=pricing["equity_range"][0], success_fee_percent=pricing["success_fee"])
        self.deals.append(deal)
        self._next_id += 1
        return deal

    def qualify_deal(self, deal: StartupDeal, funding_target: float = 0.0, valuation: float = 0.0) -> StartupDeal:
        deal.funding_target = funding_target
        deal.estimated_valuation = valuation if valuation else funding_target * 4
        deal.stage = DealStage.DISCOVERY
        return deal

    def check_win_win_win(self, deal: StartupDeal, anh_win: str, agency_win: str, startup_win: str) -> bool:
        deal.win_check.anh_win = anh_win
        deal.win_check.agency_win = agency_win
        deal.win_check.startup_win = startup_win
        return deal.win_check.validate()

    def advance_stage(self, deal: StartupDeal, stage: DealStage) -> StartupDeal:
        deal.stage = stage
        if stage == DealStage.CLOSED_WON: deal.closed_at = datetime.now()
        return deal
