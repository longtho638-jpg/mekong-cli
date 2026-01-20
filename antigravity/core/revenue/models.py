"""
Revenue AI Models.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class ChurnRisk(Enum):
    """Customer churn risk levels."""

    CRITICAL = "critical"  # >80% likely to churn
    HIGH = "high"  # 60-80%
    MEDIUM = "medium"  # 40-60%
    LOW = "low"  # 20-40%
    MINIMAL = "minimal"  # <20%


class UpsellOpportunity(Enum):
    """Types of upsell opportunities."""

    TIER_UPGRADE = "tier_upgrade"
    ADDON_SERVICE = "addon_service"
    VOLUME_INCREASE = "volume_increase"
    ANNUAL_PLAN = "annual_plan"
    REFERRAL_BONUS = "referral_bonus"


@dataclass
class CustomerProfile:
    """Customer profile for AI analysis."""

    id: str
    name: str
    tier: str
    mrr: float  # Monthly Recurring Revenue
    usage_percent: float
    last_active: float
    signup_date: float
    support_tickets: int = 0
    nps_score: Optional[int] = None
    payment_failures: int = 0
    feature_usage: Dict[str, int] = field(default_factory=dict)


@dataclass
class ChurnPrediction:
    """Churn prediction result."""

    customer_id: str
    risk: ChurnRisk
    probability: float
    factors: List[str]
    recommended_actions: List[str]
    predicted_at: float = field(default_factory=time.time)


@dataclass
class UpsellRecommendation:
    """Upsell recommendation."""

    customer_id: str
    opportunity: UpsellOpportunity
    potential_mrr_increase: float
    confidence: float
    reasoning: str
    recommended_at: float = field(default_factory=time.time)


@dataclass
class PricingRecommendation:
    """Dynamic pricing recommendation."""

    product_id: str
    current_price: float
    recommended_price: float
    change_percent: float
    reasoning: str
    confidence: float


@dataclass
class RevenueMetrics:
    """Revenue metrics snapshot."""

    timestamp: float
    mrr: float
    arr: float
    churn_rate: float
    expansion_rate: float
    ltv: float  # Lifetime Value
    cac: float  # Customer Acquisition Cost
    customers_at_risk: int
