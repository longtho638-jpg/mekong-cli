"""Risk models for guardian agent"""

from typing import List
from enum import Enum


class RiskLevel(str, Enum):
    WALK_AWAY = "walk_away"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SAFE = "safe"


class RiskAssessment(BaseModel):
    """Risk assessment result"""
    score: int
    rating: str
    factors: List[str]
    recommendation: str
    calculated_at: str


class RiskThresholds(BaseModel):
    """Risk threshold configuration"""
    liquidation_preference_max: float = 1.5
    equity_max: int = 30
    option_pool_max: int = 15
    no_shop_max_days: int = 45