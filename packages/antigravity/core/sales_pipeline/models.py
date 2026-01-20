"""
Data models and Enums for Sales Pipeline.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class DealTier(Enum):
    """Agency tier levels (Binh Pháp structure)."""
    WARRIOR = "warrior"
    GENERAL = "general"
    TUONG_QUAN = "tuong_quan"

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
    ANH = "anh"
    AGENCY = "agency"
    STARTUP = "startup"

@dataclass
class WinCheck:
    """WIN-WIN-WIN alignment verification."""
    anh_win: str = ""
    agency_win: str = ""
    startup_win: str = ""
    is_aligned: bool = False

    def validate(self) -> bool:
        self.is_aligned = all([bool(self.anh_win), bool(self.agency_win), bool(self.startup_win)])
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
    retainer_monthly: float = 0.0
    equity_percent: float = 0.0
    success_fee_percent: float = 0.0
    funding_target: float = 0.0
    estimated_valuation: float = 0.0
    win_check: WinCheck = field(default_factory=WinCheck)
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None

    def get_annual_retainer(self) -> float: return self.retainer_monthly * 12
    def get_equity_value(self) -> float: return self.estimated_valuation * (self.equity_percent / 100)
    def get_success_fee(self) -> float: return self.funding_target * (self.success_fee_percent / 100)
    def get_total_deal_value(self) -> float: return self.get_annual_retainer() + self.get_equity_value() + self.get_success_fee()
