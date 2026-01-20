"""Contract models for guardian agent"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class TermSheetTerms(BaseModel):
    """Extracted term sheet terms"""
    valuation_pre_money: float = 0
    valuation_post_money: float = 0
    investment_amount: float = 0
    equity_percentage: float = 0
    liquidation_preference: float = 1.0
    participation: bool = False
    participating_cap: Optional[float] = None
    anti_dilution: str = "weighted_average"
    board_seats_investor: int = 0
    board_seats_founder: int = 0
    board_seats_independent: int = 0
    vesting_schedule: str = "4-year-1-cliff"
    pro_rata_rights: bool = True
    drag_along: bool = False
    pay_to_play: bool = False
    option_pool: float = 0
    no_shop_period_days: int = 30


class RedFlag(BaseModel):
    """Red flag detected in term sheet"""
    type: str
    severity: str
    message: str
    binh_phap: str


class CounterOffer(BaseModel):
    """Counter-offer suggestion"""
    term: str
    current: Any
    proposed: Any
    rationale: str
    priority: str


class MarketComparison(BaseModel):
    """Market comparison result"""
    term: str
    status: str
    benchmark: str


class ContractAnalysis(BaseModel):
    """Complete contract analysis result"""
    terms: Dict[str, Any]
    red_flags: List[RedFlag]
    counter_offers: List[CounterOffer]
    market_comparison: List[MarketComparison]
    risk_score: int
    rating: str
    recommendation: str
    analyzed_at: str