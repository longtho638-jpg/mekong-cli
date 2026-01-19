"""
💰 Revenue AI - Intelligent Revenue Optimization
=================================================

AI-driven pricing, churn prediction, and upsell detection.
Maximizes revenue through intelligent automation.

Binh Pháp: "Nhân chi hại nhi lợi" - Turn disadvantage into advantage
"""

import logging
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


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


class RevenueAI:
    """
    💰 AI-Driven Revenue Optimization

    Features:
    - Churn prediction and prevention
    - Upsell opportunity detection
    - Dynamic pricing optimization
    - Revenue forecasting
    """

    # Tier configuration
    TIERS = {
        "warrior": {"price": 2000, "features": 10},
        "general": {"price": 5000, "features": 25},
        "tuong_quan": {"price": 15000, "features": 50},
    }

    def __init__(self, enable_auto_actions: bool = False):
        self.enable_auto_actions = enable_auto_actions

        self.customers: Dict[str, CustomerProfile] = {}
        self.predictions: Dict[str, ChurnPrediction] = {}
        self.recommendations: Dict[str, List[UpsellRecommendation]] = {}

        self._lock = threading.Lock()
        self._metrics_history: List[RevenueMetrics] = []
        self._model_weights = self._initialize_weights()

        logger.info("💰 RevenueAI initialized")

    def _initialize_weights(self) -> Dict[str, float]:
        """Initialize churn prediction model weights."""
        return {
            "usage_decline": 0.25,
            "payment_failures": 0.20,
            "support_tickets": 0.15,
            "days_inactive": 0.20,
            "nps_score": 0.10,
            "feature_usage": 0.10,
        }

    def add_customer(self, profile: CustomerProfile):
        """Add or update customer profile."""
        with self._lock:
            self.customers[profile.id] = profile
        logger.debug(f"👤 Customer added: {profile.name}")

    def predict_churn(self, customer_id: str) -> Optional[ChurnPrediction]:
        """Predict churn risk for a customer."""
        customer = self.customers.get(customer_id)
        if not customer:
            return None

        # Calculate churn probability
        factors = []
        score = 0.0

        # Usage decline factor
        if customer.usage_percent < 30:
            score += self._model_weights["usage_decline"] * 1.0
            factors.append(f"Low usage ({customer.usage_percent:.0f}%)")
        elif customer.usage_percent < 50:
            score += self._model_weights["usage_decline"] * 0.5
            factors.append(f"Moderate usage ({customer.usage_percent:.0f}%)")

        # Payment failures
        if customer.payment_failures > 0:
            failure_score = min(customer.payment_failures * 0.3, 1.0)
            score += self._model_weights["payment_failures"] * failure_score
            factors.append(f"{customer.payment_failures} payment failures")

        # Support tickets (high tickets = frustration)
        if customer.support_tickets > 5:
            score += self._model_weights["support_tickets"] * 0.8
            factors.append(f"High support tickets ({customer.support_tickets})")
        elif customer.support_tickets > 2:
            score += self._model_weights["support_tickets"] * 0.4
            factors.append(f"Moderate support tickets ({customer.support_tickets})")

        # Days inactive
        days_inactive = (time.time() - customer.last_active) / 86400
        if days_inactive > 30:
            score += self._model_weights["days_inactive"] * 1.0
            factors.append(f"Inactive for {days_inactive:.0f} days")
        elif days_inactive > 14:
            score += self._model_weights["days_inactive"] * 0.5
            factors.append(f"Inactive for {days_inactive:.0f} days")

        # NPS score
        if customer.nps_score is not None:
            if customer.nps_score < 6:
                score += self._model_weights["nps_score"] * 1.0
                factors.append(f"Low NPS score ({customer.nps_score})")
            elif customer.nps_score < 8:
                score += self._model_weights["nps_score"] * 0.3

        # Determine risk level
        probability = min(score, 1.0)

        if probability > 0.8:
            risk = ChurnRisk.CRITICAL
        elif probability > 0.6:
            risk = ChurnRisk.HIGH
        elif probability > 0.4:
            risk = ChurnRisk.MEDIUM
        elif probability > 0.2:
            risk = ChurnRisk.LOW
        else:
            risk = ChurnRisk.MINIMAL

        # Generate recommended actions
        actions = self._generate_retention_actions(customer, risk, factors)

        prediction = ChurnPrediction(
            customer_id=customer_id,
            risk=risk,
            probability=probability,
            factors=factors,
            recommended_actions=actions,
        )

        with self._lock:
            self.predictions[customer_id] = prediction

        logger.info(f"📊 Churn prediction for {customer.name}: {risk.value} ({probability:.0%})")
        return prediction

    def _generate_retention_actions(
        self, customer: CustomerProfile, risk: ChurnRisk, factors: List[str]
    ) -> List[str]:
        """Generate retention actions based on risk factors."""
        actions = []

        if "Low usage" in str(factors):
            actions.append("Schedule onboarding call to increase feature adoption")

        if "payment failures" in str(factors):
            actions.append("Offer payment plan flexibility")

        if "support tickets" in str(factors):
            actions.append("Escalate to customer success for personal attention")

        if "Inactive" in str(factors):
            actions.append("Send re-engagement email with new features")

        if risk in [ChurnRisk.CRITICAL, ChurnRisk.HIGH]:
            actions.append("Offer loyalty discount (10-20%)")
            actions.append("Schedule executive check-in call")

        return actions or ["Monitor customer health metrics"]

    def detect_upsell(self, customer_id: str) -> List[UpsellRecommendation]:
        """Detect upsell opportunities for a customer."""
        customer = self.customers.get(customer_id)
        if not customer:
            return []

        recommendations = []

        # Tier upgrade opportunity
        if customer.usage_percent > 80:
            current_tier = customer.tier
            upgrade_options = {"warrior": "general", "general": "tuong_quan"}

            if current_tier in upgrade_options:
                next_tier = upgrade_options[current_tier]
                price_increase = self.TIERS[next_tier]["price"] - self.TIERS[current_tier]["price"]

                recommendations.append(
                    UpsellRecommendation(
                        customer_id=customer_id,
                        opportunity=UpsellOpportunity.TIER_UPGRADE,
                        potential_mrr_increase=price_increase,
                        confidence=0.7,
                        reasoning=f"Usage at {customer.usage_percent:.0f}% - likely needs more capacity",
                    )
                )

        # Annual plan opportunity
        days_since_signup = (time.time() - customer.signup_date) / 86400
        if days_since_signup > 90 and days_since_signup < 365:
            customer.mrr * 2  # 2 months free

            recommendations.append(
                UpsellRecommendation(
                    customer_id=customer_id,
                    opportunity=UpsellOpportunity.ANNUAL_PLAN,
                    potential_mrr_increase=customer.mrr * 0.17,  # 2/12 months
                    confidence=0.5,
                    reasoning=f"Customer for {days_since_signup:.0f} days - good candidate for annual plan",
                )
            )

        # Feature-based upsell
        if customer.feature_usage:
            most_used = max(customer.feature_usage.items(), key=lambda x: x[1])[0]
            recommendations.append(
                UpsellRecommendation(
                    customer_id=customer_id,
                    opportunity=UpsellOpportunity.ADDON_SERVICE,
                    potential_mrr_increase=500,
                    confidence=0.4,
                    reasoning=f"Heavy usage of {most_used} - offer premium {most_used} addon",
                )
            )

        with self._lock:
            self.recommendations[customer_id] = recommendations

        logger.info(f"💡 Found {len(recommendations)} upsell opportunities for {customer.name}")
        return recommendations

    def optimize_price(
        self,
        product_id: str,
        current_price: float,
        demand_data: Dict[str, float] = None,
    ) -> PricingRecommendation:
        """Optimize pricing using demand data."""
        # Simplified price optimization
        demand_data = demand_data or {}

        # Calculate price elasticity estimate
        avg_demand = sum(demand_data.values()) / len(demand_data) if demand_data else 1.0

        # Price optimization logic
        if avg_demand > 1.2:  # High demand
            recommended_price = current_price * 1.10  # 10% increase
            reasoning = "High demand detected - price can be increased"
        elif avg_demand < 0.8:  # Low demand
            recommended_price = current_price * 0.95  # 5% decrease
            reasoning = "Low demand - consider promotional pricing"
        else:
            recommended_price = current_price
            reasoning = "Demand is stable - maintain current pricing"

        change_percent = ((recommended_price - current_price) / current_price) * 100

        return PricingRecommendation(
            product_id=product_id,
            current_price=current_price,
            recommended_price=recommended_price,
            change_percent=change_percent,
            reasoning=reasoning,
            confidence=0.6,
        )

    def calculate_metrics(self) -> RevenueMetrics:
        """Calculate current revenue metrics."""
        total_mrr = sum(c.mrr for c in self.customers.values())
        total_arr = total_mrr * 12

        # Count at-risk customers
        at_risk = sum(
            1 for p in self.predictions.values() if p.risk in [ChurnRisk.CRITICAL, ChurnRisk.HIGH]
        )

        # Estimate churn rate from predictions
        high_risk_count = sum(1 for p in self.predictions.values() if p.probability > 0.5)
        churn_rate = high_risk_count / max(len(self.customers), 1)

        metrics = RevenueMetrics(
            timestamp=time.time(),
            mrr=total_mrr,
            arr=total_arr,
            churn_rate=churn_rate,
            expansion_rate=0.05,  # Placeholder
            ltv=total_mrr * 24 if churn_rate < 0.1 else total_mrr * 12,
            cac=500,  # Placeholder
            customers_at_risk=at_risk,
        )

        with self._lock:
            self._metrics_history.append(metrics)
            # Keep last 30 days
            if len(self._metrics_history) > 30 * 24:
                self._metrics_history = self._metrics_history[-30 * 24 :]

        return metrics

    def get_status(self) -> Dict[str, Any]:
        """Get RevenueAI status."""
        metrics = self.calculate_metrics()

        return {
            "total_customers": len(self.customers),
            "mrr": metrics.mrr,
            "arr": metrics.arr,
            "customers_at_risk": metrics.customers_at_risk,
            "churn_predictions": len(self.predictions),
            "upsell_opportunities": sum(len(r) for r in self.recommendations.values()),
            "auto_actions_enabled": self.enable_auto_actions,
        }


# Global instance
_revenue_ai: Optional[RevenueAI] = None


def get_revenue_ai() -> RevenueAI:
    """Get global RevenueAI instance."""
    global _revenue_ai
    if _revenue_ai is None:
        _revenue_ai = RevenueAI()
    return _revenue_ai


# Convenience functions
def predict_churn(customer_id: str) -> Optional[ChurnPrediction]:
    """Predict churn for a customer."""
    return get_revenue_ai().predict_churn(customer_id)


def detect_upsell(customer_id: str) -> List[UpsellRecommendation]:
    """Detect upsell opportunities."""
    return get_revenue_ai().detect_upsell(customer_id)


def get_revenue_metrics() -> RevenueMetrics:
    """Get current revenue metrics."""
    return get_revenue_ai().calculate_metrics()


__all__ = [
    "RevenueAI",
    "CustomerProfile",
    "ChurnPrediction",
    "UpsellRecommendation",
    "PricingRecommendation",
    "RevenueMetrics",
    "ChurnRisk",
    "UpsellOpportunity",
    "get_revenue_ai",
    "predict_churn",
    "detect_upsell",
    "get_revenue_metrics",
]
