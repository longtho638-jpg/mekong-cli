"""
Algorithm Utilities
===================

Helper functions for algorithm analytics and data building.
"""

import time
from typing import TYPE_CHECKING, Any, Dict, List

if TYPE_CHECKING:
    from .ab_testing import ABTestEngine
    from .analytics import AnalyticsEngine
    from .ml_engine import MLEngine
    from .types import ConversionData


def build_ml_models_data(ml_engine: "MLEngine") -> Dict[str, Any]:
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


def build_ab_tests_data(ab_engine: "ABTestEngine") -> Dict[str, Any]:
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
) -> Dict[str, Any]:
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
    pricing_history: List[Dict],
    analytics_engine: "AnalyticsEngine"
) -> Dict[str, Any]:
    """Build pricing optimization analytics data."""
    return {
        "total_calculations": len(pricing_history),
        "avg_confidence": sum(c.get("confidence_score", 0.5) for c in pricing_history)
        / max(len(pricing_history), 1),
        "strategy_performance": analytics_engine.analyze_strategy_performance(pricing_history),
    }
