"""
Revenue AI - Intelligent Revenue Optimization
==============================================

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.revenue package.
"""

from antigravity.core.revenue import (
    RevenueAI,
    CustomerProfile,
    ChurnPrediction,
    UpsellRecommendation,
    PricingRecommendation,
    RevenueMetrics,
    ChurnRisk,
    UpsellOpportunity,
    get_revenue_ai,
    predict_churn,
    detect_upsell,
    get_revenue_metrics,
)

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
