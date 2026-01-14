"""
Deal models for SalesPipeline.

Extracted from sales_pipeline.py for clean architecture.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum

from ..config import DealTier, TIER_PRICING, get_tier_pricing


class DealStage(Enum):
    """Deal pipeline stages."""
    LEAD = "lead"
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


@dataclass
class StartupDeal:
    """A startup client deal."""
    id: Optional[int] = None
    startup_name: str = ""
    founder_name: str = ""
    email: str = ""
    tier: DealTier = DealTier.WARRIOR
    stage: DealStage = DealStage.LEAD
    
    # Financials
    retainer_monthly: float = 0.0
    equity_percent: float = 0.0
    success_fee_percent: float = 0.0
    
    # Funding
    funding_target: float = 0.0
    valuation: float = 0.0
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None
    
    # Notes
    notes: str = ""

    def __post_init__(self):
        """Set tier pricing if not specified."""
        if self.retainer_monthly == 0:
            pricing = get_tier_pricing(self.tier)
            self.retainer_monthly = pricing["retainer"]
            self.equity_percent = sum(pricing["equity_range"]) / 2
            self.success_fee_percent = pricing["success_fee"]

    def get_annual_retainer(self) -> float:
        """Calculate annual retainer revenue."""
        return self.retainer_monthly * 12

    def get_equity_value(self) -> float:
        """Calculate equity value at current valuation."""
        return self.valuation * (self.equity_percent / 100)

    def get_success_fee(self) -> float:
        """Calculate potential success fee."""
        return self.funding_target * (self.success_fee_percent / 100)

    def get_total_deal_value(self) -> float:
        """Calculate total deal value."""
        return (
            self.get_annual_retainer() +
            self.get_equity_value() +
            self.get_success_fee()
        )

    def is_won(self) -> bool:
        """Check if deal is won."""
        return self.stage == DealStage.CLOSED_WON

    def is_active(self) -> bool:
        """Check if deal is still active."""
        return self.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "startup_name": self.startup_name,
            "founder_name": self.founder_name,
            "email": self.email,
            "tier": self.tier.value,
            "stage": self.stage.value,
            "retainer_monthly": self.retainer_monthly,
            "equity_percent": self.equity_percent,
            "success_fee_percent": self.success_fee_percent,
            "funding_target": self.funding_target,
            "valuation": self.valuation,
            "total_value": self.get_total_deal_value(),
            "created_at": self.created_at.isoformat()
        }
