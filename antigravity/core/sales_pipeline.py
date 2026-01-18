"""
🧲 SalesPipeline - High-Growth Client Management
================================================

Orchestrates the acquisition and relationship management of startup clients.
Enforces engagement tiers (Warrior → General → Tướng Quân) and tracks
aggregate portfolio value including equity and success fees.

Binh Pháp: 🧲 Thế Trận (Strategic Configuration) - Building momentum through partnerships.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Union

from .base import BaseEngine
from .config import DealTier
from .models.deal import DealStage, StartupDeal

# Configure logging
logger = logging.getLogger(__name__)


class SalesPipeline(BaseEngine):
    """
    🧲 Startup CRM & Deal Engine

    The strategic cockpit for managing the agency's most valuable partnerships.
    """

    def __init__(self, data_dir: str = ".antigravity/crm"):
        super().__init__(data_dir)
        self.deals: List[StartupDeal] = []
        self._next_id = 1

    def create_deal(
        self,
        startup_name: str,
        founder_name: str = "",
        email: str = "",
        tier: Union[DealTier, str] = DealTier.WARRIOR,
    ) -> StartupDeal:
        """Initializes a new opportunity in the pipeline."""
        if isinstance(tier, str):
            try:
                tier = DealTier(tier.lower())
            except ValueError:
                tier = DealTier.WARRIOR

        deal = StartupDeal(
            id=self._next_id,
            startup_name=startup_name,
            founder_name=founder_name,
            email=email,
            tier=tier,
        )
        self.deals.append(deal)
        self._next_id += 1
        logger.info(f"Deal registered: {startup_name} ({tier.value})")
        return deal

    def advance_stage(self, deal_id: int, new_stage: Union[DealStage, str]) -> StartupDeal:
        """Moves a deal to the next phase of the engagement lifecycle."""
        deal = self._find_deal(deal_id)

        if isinstance(new_stage, str):
            new_stage = DealStage(new_stage.lower())

        deal.stage = new_stage
        if not deal.is_active():
            deal.closed_at = datetime.now()

        logger.debug(f"Deal #{deal_id} advanced to {new_stage.value}")
        return deal

    def close_deal(self, deal_id: int, won: bool = True) -> StartupDeal:
        """Terminates the sales cycle with a WON or LOST outcome."""
        stage = DealStage.CLOSED_WON if won else DealStage.CLOSED_LOST
        return self.advance_stage(deal_id, stage)

    def _find_deal(self, deal_id: int) -> StartupDeal:
        """Helper to locate a deal in the active roster."""
        deal = next((d for d in self.deals if d.id == deal_id), None)
        if not deal:
            raise ValueError(f"Deal ID {deal_id} not found in pipeline.")
        return deal

    def get_active_deals(self) -> List[StartupDeal]:
        """Returns all deals currently in negotiation or discovery."""
        return [d for d in self.deals if d.is_active()]

    def get_pipeline_breakdown(self) -> Dict[str, Any]:
        """Calculates aggregate financial metrics for the current pipeline."""
        active = self.get_active_deals()
        won = [d for d in self.deals if d.is_won()]

        return {
            "funnel": {
                "active_count": len(active),
                "won_count": len(won),
                "conversion_rate": (len(won) / len(self.deals) * 100) if self.deals else 0,
            },
            "financials": {
                "current_arr": sum(d.get_annual_retainer() for d in won),
                "equity_paper_value": sum(d.get_equity_value() for d in won),
                "potential_success_fees": sum(d.get_success_fee_value() for d in active),
            },
        }

    def get_stats(self) -> Dict[str, Any]:
        """Engine-standard performance statistics."""
        breakdown = self.get_pipeline_breakdown()
        return {
            "total_deals": len(self.deals),
            "active_deals": breakdown["funnel"]["active_count"],
            "won_deals": breakdown["funnel"]["won_count"],
            "total_arr": breakdown["financials"]["current_arr"],
            "equity_value": breakdown["financials"]["equity_paper_value"],
            "pipeline_by_tier": self._group_by_tier(self.deals),
        }

    def _group_by_tier(self, deals: List[StartupDeal]) -> Dict[str, int]:
        """Helper to count deals per engagement tier."""
        counts = {tier.value: 0 for tier in DealTier}
        for d in deals:
            counts[d.tier.value] += 1
        return counts

    def print_pipeline_report(self):
        """Visualizes the full startup sales funnel."""
        stats = self.get_stats()
        f = self.get_pipeline_breakdown()["financials"]

        print("\n" + "═" * 65)
        print("║" + "🧲 STARTUP SALES PIPELINE - STRATEGIC OVERVIEW".center(63) + "║")
        print("═" * 65)

        print(f"\n  🏆 PORTFOLIO VALUE: $ {(f['current_arr'] + f['equity_paper_value']):,.0f} USD")
        print(f"     └─ Cash ARR:     ${f['current_arr']:,.0f}")
        print(f"     └─ Equity Value: ${f['equity_paper_value']:,.0f}")

        print("\n  📂 PIPELINE STATUS:")
        for tier_id, count in stats["pipeline_by_tier"].items():
            print(f"     • {tier_id.upper():<12} : {count} deals")

        print("\n" + "─" * 65)
        print(f"  🚀 SUCCESS FEES PENDING: ${f['potential_success_fees']:,.0f} USD")
        print("═" * 65 + "\n")


# Global Interface
sales_pipeline = SalesPipeline()
