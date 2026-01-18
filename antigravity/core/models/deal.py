"""
📋 Deal Models - Startup Opportunities
======================================

Defines the data structures for managing high-growth startup deals within
the Agency OS sales pipeline. Supports automated pricing based on the
Binh Pháp engagement tiers.

Hierarchy:
- DealStage: Pipeline status levels.
- StartupDeal: Comprehensive financial and relationship container.

Binh Pháp: 📋 Hình (Configuration) - Structuring the deal for success.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from ..config import DealTier, get_tier_pricing

# Configure logging
logger = logging.getLogger(__name__)


class DealStage(Enum):
    """Workflow stages for a startup engagement."""

    LEAD = "lead"
    DISCOVERY = "discovery"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


@dataclass
class StartupDeal:
    """
    📋 Startup Engagement Deal

    Captures all strategic and financial parameters of a client relationship.
    Automatically applies tier-based pricing if defaults are not overridden.
    """

    id: Optional[int] = None
    startup_name: str = ""
    founder_name: str = ""
    email: str = ""
    tier: DealTier = field(default=DealTier.WARRIOR)
    stage: DealStage = field(default=DealStage.LEAD)

    # Financial Commitments (USD)
    retainer_monthly: float = 0.0
    equity_percent: float = 0.0
    success_fee_percent: float = 0.0

    # Capital Milestones
    funding_target: float = 0.0
    valuation: float = 0.0

    # Metadata & Tracking
    created_at: datetime = field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None
    notes: str = ""

    def __post_init__(self):
        """Auto-populates financial terms based on the selected tier."""
        if self.retainer_monthly == 0:
            pricing = get_tier_pricing(self.tier)
            # Match the refactored config keys (retainer_usd, success_fee_percent)
            self.retainer_monthly = pricing.get("retainer_usd", 0.0)

            # Default to mid-range of equity
            range_val = pricing.get("equity_range", (0.0, 0.0))
            self.equity_percent = sum(range_val) / 2

            self.success_fee_percent = pricing.get("success_fee_percent", 0.0)

    def get_annual_retainer(self) -> float:
        """Projects yearly cashflow from this deal."""
        return self.retainer_monthly * 12

    def get_equity_value(self) -> float:
        """Estimates current paper value of the equity stake."""
        return self.valuation * (self.equity_percent / 100)

    def get_success_fee_value(self) -> float:
        """Calculates expected fee upon successful funding round."""
        return self.funding_target * (self.success_fee_percent / 100)

    def get_aggregate_value(self) -> float:
        """Estimates total first-year financial impact (LTV)."""
        return self.get_annual_retainer() + self.get_equity_value() + self.get_success_fee_value()

    def is_won(self) -> bool:
        """Returns True if the contract is signed."""
        return self.stage == DealStage.CLOSED_WON

    def is_active(self) -> bool:
        """Returns True if the deal is currently moving through the pipeline."""
        return self.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]

    def to_dict(self) -> Dict[str, Any]:
        """Provides a serializable representation for APIs and storage."""
        return {
            "id": self.id,
            "startup_name": self.startup_name,
            "founder": self.founder_name,
            "tier": self.tier.value,
            "stage": self.stage.value,
            "financials": {
                "mrr": self.retainer_monthly,
                "equity": self.equity_percent,
                "success_fee": self.success_fee_percent,
            },
            "milestones": {"funding": self.funding_target, "valuation": self.valuation},
            "aggregate_value": self.get_aggregate_value(),
            "timestamps": {
                "created": self.created_at.isoformat(),
                "closed": self.closed_at.isoformat() if self.closed_at else None,
            },
        }
