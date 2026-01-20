"""
Revenue Module
==============

The operational heart of the Agency OS financial system. Combines:
- RevenueEngine: Invoice tracking, MRR/ARR calculations, milestone monitoring
- RevenueAI: AI-driven churn prediction, upsell detection, pricing optimization
"""

from typing import List, Optional

from .engine import RevenueEngine
from .ai import RevenueAI
from .models import (
    ChurnPrediction,
    ChurnRisk,
    CustomerProfile,
    PricingRecommendation,
    RevenueMetrics,
    UpsellOpportunity,
    UpsellRecommendation,
)

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
    # Engine
    "RevenueEngine",
    # AI
    "RevenueAI",
    # Models
    "CustomerProfile",
    "ChurnPrediction",
    "UpsellRecommendation",
    "PricingRecommendation",
    "RevenueMetrics",
    "ChurnRisk",
    "UpsellOpportunity",
    # Convenience functions
    "get_revenue_ai",
    "predict_churn",
    "detect_upsell",
    "get_revenue_metrics",
]
