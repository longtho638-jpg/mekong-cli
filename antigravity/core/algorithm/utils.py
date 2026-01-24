"""
Algorithm Utilities
===================

Helper functions for algorithm analytics and data building.
"""

import time
from typing import TYPE_CHECKING, Any, Dict, List

from typing_extensions import TypedDict

if TYPE_CHECKING:
    from .ab_testing import ABTestEngine
    from .analytics import AnalyticsEngine
    from .ml_engine import MLEngine
    from .types import ConversionData


class MLModelAnalyticsDict(TypedDict):
    """Analytics data for a single ML model"""
    type: str
    features: List[str]
    last_trained: float
    accuracy: float


class ABTestAnalyticsDict(TypedDict):
    """Analytics data for an A/B test"""
    name: str
    variants: Dict[str, float]
    traffic_split: Dict[str, float]
    duration_days: float
    status: str


class ConversionAnalyticsDict(TypedDict):
    """Analytics data for conversions"""
    total_conversions: int
    conversion_rate: float
    avg_conversion_value: float
    recent_conversions: int


class PricingOptimizationAnalyticsDict(TypedDict):
    """Analytics data for pricing optimization"""
    total_calculations: int
    avg_confidence: float
    strategy_performance: Dict[str, Any]


def build_ml_models_data(ml_engine: "MLEngine") -> Dict[str, MLModelAnalyticsDict]:
    """Build ML models analytics data."""
    return {
        name: {
            "type": model.model_type,
            "features": model.features,
            "last_trained": model.last_trained,
            "accuracy": model.accuracy,
        }
        for name, model in ml_engine.models.items()
    }


def build_ab_tests_data(ab_engine: "ABTestEngine") -> Dict[str, ABTestAnalyticsDict]:
    """Build A/B tests analytics data."""
    return {
        test_id: {
            "name": config.name,
            "variants": config.variants,
            "traffic_split": config.traffic_split,
            "duration_days": (time.time() - config.start_time) / (24 * 3600),
            "status": "active"
            if not config.end_time or time.time() < config.end_time
            else "completed",
        }
        for test_id, config in ab_engine.ab_tests.items()
    }


def build_conversion_data(
    conversion_data: List["ConversionData"],
    analytics_engine: "AnalyticsEngine"
) -> ConversionAnalyticsDict:
    """Build conversion analytics data."""
    recent_conversions = len(
        [c for c in conversion_data if time.time() - c.timestamp < 86400]
    )
    return {
        "total_conversions": len(conversion_data),
        "conversion_rate": len([c for c in conversion_data if c.conversion])
        / max(len(conversion_data), 1),
        "avg_conversion_value": analytics_engine.calculate_avg_revenue(conversion_data),
        "recent_conversions": recent_conversions,
    }


def build_pricing_optimization_data(
    pricing_history: List[Dict[str, Any]],
    analytics_engine: "AnalyticsEngine"
) -> PricingOptimizationAnalyticsDict:
    """Build pricing optimization analytics data."""
    return {
        "total_calculations": len(pricing_history),
        "avg_confidence": sum(c.get("confidence_score", 0.5) for c in pricing_history)
        / max(len(pricing_history), 1),
        "strategy_performance": analytics_engine.analyze_strategy_performance(pricing_history),
    }
