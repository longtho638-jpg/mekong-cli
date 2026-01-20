"""
Bid Manager Models
"""
from dataclasses import dataclass
from enum import Enum

class BidStrategyType(Enum):
    MANUAL_CPC = "manual_cpc"
    TARGET_CPA = "target_cpa"
    TARGET_ROAS = "target_roas"
    MAXIMIZE_CLICKS = "maximize_clicks"
    MAXIMIZE_CONVERSIONS = "maximize_conversions"

class OptimizationStatus(Enum):
    LEARNING = "learning"
    OPTIMIZED = "optimized"
    LIMITED = "limited_budget"

@dataclass
class BidStrategy:
    """Bidding strategy configuration"""
    id: str
    campaign_id: str
    strategy_type: BidStrategyType
    target_value: float = 0
    status: OptimizationStatus = OptimizationStatus.LEARNING
    current_adjustment: float = 0
    days_learning: int = 0

    @property
    def is_learning(self) -> bool:
        return self.days_learning < 7

@dataclass
class AuctionInsight:
    """Competitive landscape insight"""
    domain: str
    impression_share: float
    overlap_rate: float
    position_above_rate: float
    top_of_page_rate: float
