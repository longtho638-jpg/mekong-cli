"""
Tests for Antigravity Algorithm Core.
"""
from antigravity.core.algorithm.core import MaxLevelAntigravityAlgorithm
from antigravity.core.algorithm.types import EnhancedPricingContext, PricingStrategy

import pytest


@pytest.fixture
def algo():
    return MaxLevelAntigravityAlgorithm()

def test_initialization(algo):
    assert algo.ml_engine is not None
    assert algo.ab_engine is not None
    assert algo.analytics_engine is not None
    assert algo.pricing_history == []

def test_calculate_optimized_price_defaults(algo):
    base_price = 100.0
    result = algo.calculate_optimized_price(base_price)

    assert result["base_price"] == 100.0
    assert result["final_price"] > 0
    assert "confidence" in result
    assert "strategy" in result

def test_calculate_traditional_viral(algo):
    base_price = 100.0
    context = EnhancedPricingContext(
        base_price,
        features={
            "viral_coefficient": 1.5,
            "time_factor": 1.0,
            "demand_factor": 0.0
        }
    )

    result = algo.calculate_optimized_price(
        base_price,
        context=context,
        strategy=PricingStrategy.VIRAL_COEFFICIENT
    )

    # Viral boost: 1 + (1.5 - 1) * 0.7 = 1.35
    # Price = 100 * 1.35 = 135
    assert result["strategy"] == PricingStrategy.VIRAL_COEFFICIENT.value
    assert result["final_price"] == 135.0

def test_calculate_penetration_pricing(algo):
    base_price = 100.0
    context = EnhancedPricingContext(
        base_price,
        features={
            "competitor_price": 90.0
        }
    )

    result = algo.calculate_optimized_price(
        base_price,
        context=context,
        strategy=PricingStrategy.PENETRATION
    )

    # Min(90 * 0.9, 100) = 81
    assert result["final_price"] == 81.0

def test_track_conversion(algo):
    algo.track_conversion(
        price_point=100.0,
        converted=True,
        user_segment="test",
        traffic_source="direct"
    )

    assert len(algo.conversion_data) == 1
    assert algo.conversion_data[0].conversion is True

def test_analytics_integration(algo):
    # Add some history
    algo.calculate_optimized_price(100.0)

    analytics = algo.get_optimization_analytics()
    assert "pricing_optimization" in analytics
    assert analytics["pricing_optimization"]["total_calculations"] == 1
