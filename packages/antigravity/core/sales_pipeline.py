"""
SalesPipeline - Startup client CRM and deal tracking.

Features:
- Deal stage tracking (Warrior → General → Tướng Quân)
- Revenue forecasting by tier
- Success fee automation
- WIN-WIN-WIN alignment check

🏯 Binh Pháp: Tướng (General) - Leadership and Command
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum


class DealTier(Enum):
    """Agency tier levels (Binh Pháp structure)."""
    WARRIOR = "warrior"           # Pre-Seed/Seed: $2K/mo + 5-8% equity
    GENERAL = "general"           # Series A: $5K/mo + 3-5% additional
    TUONG_QUAN = "tuong_quan"     # Venture Studio: 15-30% co-founder


class DealStage(Enum):
    """Deal pipeline stages."""
    LEAD = "lead"
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class WinType(Enum):
    """WIN-WIN-WIN stakeholder types."""
    ANH = "anh"           # Owner/Founder WIN
    AGENCY = "agency"     # Agency WIN
    STARTUP = "startup"   # Client/Startup WIN


@dataclass
class WinCheck:
    """WIN-WIN-WIN alignment verification."""
    anh_win: str = ""
    agency_win: str = ""
    startup_win: str = ""
    is_aligned: bool = False
    
    def validate(self) -> bool:
        """All 3 parties must WIN for deal to proceed."""
        self.is_aligned = all([
            bool(self.anh_win),
            bool(self.agency_win),
            bool(self.startup_win)
        ])
        return self.is_aligned


@dataclass
class StartupDeal:
    """A startup client deal."""
    id: Optional[int] = None
    startup_name: str = ""
    founder_name: str = ""
    email: str = ""
    tier: DealTier = DealTier.WARRIOR
    stage: DealStage = DealStage.LEAD
    
    # Revenue components
    retainer_monthly: float = 0.0       # Monthly retainer (USD)
    equity_percent: float = 0.0         # Equity stake (%)
    success_fee_percent: float = 0.0    # Success fee on funding (%)
    
    # Deal value
    funding_target: float = 0.0         # Target funding round
    estimated_valuation: float = 0.0    # Pre-money valuation
    
    # WIN-WIN-WIN
    win_check: WinCheck = field(default_factory=WinCheck)
    
    # Metadata
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None
    
    def get_annual_retainer(self) -> float:
        """Calculate annual retainer revenue."""
        return self.retainer_monthly * 12
    
    def get_equity_value(self) -> float:
        """Calculate equity value at current valuation."""
        return self.estimated_valuation * (self.equity_percent / 100)
    
    def get_success_fee(self) -> float:
        """Calculate potential success fee."""
        return self.funding_target * (self.success_fee_percent / 100)
    
    def get_total_deal_value(self) -> float:
        """Calculate total deal value (retainer + equity + success fee)."""
        return (
            self.get_annual_retainer() +
            self.get_equity_value() +
            self.get_success_fee()
        )


# Standard tier pricing
TIER_PRICING = {
    DealTier.WARRIOR: {
        "retainer": 2000,
        "equity_range": (5, 8),
        "success_fee": 2.0,
        "description": "Pre-Seed/Seed Stage"
    },
    DealTier.GENERAL: {
        "retainer": 5000,
        "equity_range": (3, 5),
        "success_fee": 1.5,
        "description": "Series A Support"
    },
    DealTier.TUONG_QUAN: {
        "retainer": 0,  # Deferred
        "equity_range": (15, 30),
        "success_fee": 0,  # Shared exit
        "description": "Venture Studio Co-Founder"
    }
}


class SalesPipeline:
    """
    Startup client CRM and deal tracking.
    
    Example:
        pipeline = SalesPipeline()
        deal = pipeline.create_deal(
            startup_name="HealthTech VN",
            founder_name="Nguyen Van A",
            tier=DealTier.WARRIOR
        )
        pipeline.qualify_deal(deal, funding_target=500000)
        pipeline.check_win_win_win(deal, 
            anh_win="5% equity + cash flow",
            agency_win="Deal flow + knowledge",
            startup_win="Strategic support + network"
        )
    """
    
    def __init__(self):
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
        pricing = TIER_PRICING[tier]
        
        deal = StartupDeal(
            id=self._next_id,
            startup_name=startup_name,
            founder_name=founder_name,
            email=email,
            tier=tier,
            retainer_monthly=pricing["retainer"],
            equity_percent=pricing["equity_range"][0],  # Start with lower end
            success_fee_percent=pricing["success_fee"]
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
        deal.estimated_valuation = valuation if valuation else funding_target * 4  # 25% dilution assumption
        deal.stage = DealStage.DISCOVERY
        return deal
    
    def check_win_win_win(
        self,
        deal: StartupDeal,
        anh_win: str,
        agency_win: str,
        startup_win: str
    ) -> bool:
        """
        Check WIN-WIN-WIN alignment before proceeding.
        Returns False if any party doesn't WIN.
        """
        deal.win_check.anh_win = anh_win
        deal.win_check.agency_win = agency_win
        deal.win_check.startup_win = startup_win
        return deal.win_check.validate()
    
    def advance_stage(self, deal: StartupDeal, stage: DealStage) -> StartupDeal:
        """Move deal to next stage."""
        deal.stage = stage
        if stage == DealStage.CLOSED_WON:
            deal.closed_at = datetime.now()
        return deal
    
    def close_deal(self, deal: StartupDeal, won: bool = True) -> StartupDeal:
        """Close a deal as won or lost."""
        deal.stage = DealStage.CLOSED_WON if won else DealStage.CLOSED_LOST
        deal.closed_at = datetime.now()
        return deal
    
    def upgrade_tier(self, deal: StartupDeal, new_tier: DealTier) -> StartupDeal:
        """Upgrade startup to higher tier (e.g., WARRIOR → GENERAL)."""
        pricing = TIER_PRICING[new_tier]
        deal.tier = new_tier
        deal.retainer_monthly = pricing["retainer"]
        deal.equity_percent += pricing["equity_range"][0]  # Add additional equity
        deal.success_fee_percent = pricing["success_fee"]
        return deal
    
    def get_active_deals(self) -> List[StartupDeal]:
        """Get all active (non-closed) deals."""
        return [d for d in self.deals if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]
    
    def get_pipeline_by_tier(self) -> Dict[DealTier, List[StartupDeal]]:
        """Group active deals by tier."""
        result = {tier: [] for tier in DealTier}
        for deal in self.get_active_deals():
            result[deal.tier].append(deal)
        return result
    
    def get_total_arr(self) -> float:
        """Calculate total ARR from won deals."""
        return sum(
            d.get_annual_retainer()
            for d in self.deals
            if d.stage == DealStage.CLOSED_WON
        )
    
    def get_portfolio_equity_value(self) -> float:
        """Calculate total equity value across portfolio."""
        return sum(
            d.get_equity_value()
            for d in self.deals
            if d.stage == DealStage.CLOSED_WON
        )
    
    def get_pending_success_fees(self) -> float:
        """Calculate potential success fees from active deals."""
        return sum(
            d.get_success_fee()
            for d in self.get_active_deals()
        )
    
    def forecast_annual_revenue(self) -> Dict:
        """
        Forecast annual revenue from all streams.
        Aligned with $1M 2026 target.
        """
        won_deals = [d for d in self.deals if d.stage == DealStage.CLOSED_WON]
        active_deals = self.get_active_deals()
        
        return {
            "retainer_arr": self.get_total_arr(),
            "equity_value": self.get_portfolio_equity_value(),
            "pending_success_fees": self.get_pending_success_fees(),
            "total_pipeline_value": sum(d.get_total_deal_value() for d in active_deals),
            "won_deals_count": len(won_deals),
            "active_deals_count": len(active_deals),
            "target_gap": 1_000_000 - self.get_total_arr()  # Gap to $1M target
        }
    
    def get_stats(self) -> Dict:
        """Get pipeline statistics."""
        total = len(self.deals)
        won = len([d for d in self.deals if d.stage == DealStage.CLOSED_WON])
        lost = len([d for d in self.deals if d.stage == DealStage.CLOSED_LOST])
        
        return {
            "total_deals": total,
            "active_deals": len(self.get_active_deals()),
            "won_deals": won,
            "lost_deals": lost,
            "conversion_rate": (won / (won + lost) * 100) if (won + lost) > 0 else 0.0,
            "total_arr": self.get_total_arr(),
            "portfolio_equity": self.get_portfolio_equity_value(),
            "forecast": self.forecast_annual_revenue()
        }
