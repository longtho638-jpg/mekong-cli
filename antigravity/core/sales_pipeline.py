"""
SalesPipeline - Startup client CRM and deal tracking.

Features:
- Deal stage tracking (Warrior → General → Tướng Quân)
- Revenue forecasting by tier
- WIN-WIN-WIN alignment check

🏯 Binh Pháp: Tướng (General) - Leadership and Command
"""

from datetime import datetime
from typing import List, Dict

from .models.deal import StartupDeal, DealStage
from .models.win_check import WinCheck
from .config import DealTier, TIER_PRICING, get_tier_pricing
from .base import BaseEngine


class SalesPipeline(BaseEngine):
    """
    Startup client CRM and deal tracking.
    
    Example:
        pipeline = SalesPipeline()
        deal = pipeline.create_deal(
            startup_name="HealthTech VN",
            founder_name="Nguyen Van A",
            tier=DealTier.WARRIOR
        )
        pipeline.check_win_win_win(deal, "Equity", "Cash", "Strategy")
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.deals: List[StartupDeal] = []
        self._next_id = 1

    def create_deal(
        self,
        startup_name: str,
        founder_name: str = "",
        email: str = "",
        tier: DealTier = DealTier.WARRIOR
    ) -> StartupDeal:
        """Create a new startup deal with tier pricing."""
        deal = StartupDeal(
            id=self._next_id,
            startup_name=startup_name,
            founder_name=founder_name,
            email=email,
            tier=tier
        )
        self.deals.append(deal)
        self._next_id += 1
        return deal

    def qualify_deal(
        self,
        deal: StartupDeal,
        funding_target: float = 0.0,
        valuation: float = 0.0
    ) -> StartupDeal:
        """Qualify deal with funding and valuation data."""
        deal.funding_target = funding_target
        deal.valuation = valuation
        deal.stage = DealStage.DISCOVERY
        return deal

    def check_win_win_win(
        self,
        deal: StartupDeal,
        anh_win: str,
        agency_win: str,
        startup_win: str
    ) -> WinCheck:
        """Check WIN-WIN-WIN alignment before proceeding."""
        check = WinCheck(
            anh_win=anh_win,
            agency_win=agency_win,
            startup_win=startup_win
        )
        check.validate()
        return check

    def advance_stage(self, deal: StartupDeal, stage: DealStage) -> StartupDeal:
        """Move deal to next stage."""
        deal.stage = stage
        return deal

    def close_deal(self, deal: StartupDeal, won: bool = True) -> StartupDeal:
        """Close a deal as won or lost."""
        deal.stage = DealStage.CLOSED_WON if won else DealStage.CLOSED_LOST
        deal.closed_at = datetime.now()
        return deal

    def upgrade_tier(self, deal: StartupDeal, new_tier: DealTier) -> StartupDeal:
        """Upgrade startup to higher tier."""
        deal.tier = new_tier
        pricing = get_tier_pricing(new_tier)
        deal.retainer_monthly = pricing["retainer"]
        deal.equity_percent += sum(pricing["equity_range"]) / 2
        deal.success_fee_percent = pricing["success_fee"]
        return deal

    def get_active_deals(self) -> List[StartupDeal]:
        """Get all active (non-closed) deals."""
        return [d for d in self.deals if d.is_active()]

    def get_pipeline_by_tier(self) -> Dict[str, List[StartupDeal]]:
        """Group active deals by tier."""
        result = {tier.value: [] for tier in DealTier}
        for deal in self.get_active_deals():
            result[deal.tier.value].append(deal)
        return result

    def get_total_arr(self) -> float:
        """Calculate total ARR from won deals."""
        return sum(
            d.get_annual_retainer() for d in self.deals
            if d.is_won()
        )

    def get_portfolio_equity_value(self) -> float:
        """Calculate total equity value across portfolio."""
        return sum(
            d.get_equity_value() for d in self.deals
            if d.is_won()
        )

    def get_pending_success_fees(self) -> float:
        """Calculate potential success fees from active deals."""
        return sum(
            d.get_success_fee() for d in self.get_active_deals()
        )

    def forecast_annual_revenue(self) -> Dict:
        """Forecast annual revenue from all streams."""
        return {
            "retainer_arr": self.get_total_arr(),
            "equity_value": self.get_portfolio_equity_value(),
            "pending_fees": self.get_pending_success_fees(),
            "total_projected": (
                self.get_total_arr() +
                self.get_portfolio_equity_value() +
                self.get_pending_success_fees()
            )
        }

    def get_stats(self) -> Dict:
        """Get pipeline statistics."""
        return {
            "total_deals": len(self.deals),
            "active_deals": len(self.get_active_deals()),
            "won_deals": len([d for d in self.deals if d.is_won()]),
            "total_arr": self.get_total_arr(),
            "equity_value": self.get_portfolio_equity_value(),
            "pipeline_by_tier": {
                k: len(v) for k, v in self.get_pipeline_by_tier().items()
            }
        }
