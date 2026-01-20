"""
Antigravity Algorithm Module.
Exports core classes and functions for price optimization.

This package provides:
- AntigravityAlgorithm: Base algorithm (BANT, WIN-WIN-WIN, pricing)
- MaxLevelAntigravityAlgorithm: Enhanced ML-powered algorithm (A/B testing, ML optimization)
"""
# Enhanced ML-powered algorithm from core.py
from .core import MaxLevelAntigravityAlgorithm

# Base algorithm from engine.py
from .engine import (
    AntigravityAlgorithm,
    calculate_price,
    forecast_revenue,
    get_algorithm,
    score_lead,
    validate_win3,
)
from .types import (
    ABTestConfig,
    ABTestVariant,
    ConversionData,
    EnhancedPricingContext,
    LeadData,
    LeadScore,
    MLModel,
    ModelConfidence,
    PricingContext,
    PricingStrategy,
    WinResult,
    # Merged from models.py
    WinType,
)

# Re-export everything
__all__ = [
    # Classes
    "AntigravityAlgorithm",
    "MaxLevelAntigravityAlgorithm",
    "EnhancedPricingContext",
    "ABTestConfig",
    "MLModel",
    "ConversionData",
    # Enums
    "ModelConfidence",
    "PricingStrategy",
    "ABTestVariant",
    "WinType",
    # Merged from models.py
    "LeadData",
    "LeadScore",
    "PricingContext",
    "WinResult",
    # Base algorithm functions
    "get_algorithm",
    "calculate_price",
    "score_lead",
    "validate_win3",
    "forecast_revenue",
    # Enhanced algorithm functions
    "enhanced_algorithm",
    "calculate_optimized_price",
    "create_ab_test",
    "track_conversion",
    "get_ab_test_results",
    "get_optimization_analytics",
]

# Global enhanced algorithm instance
enhanced_algorithm = MaxLevelAntigravityAlgorithm()


# Enhanced facade functions
def calculate_optimized_price(*args, **kwargs):
    """Calculate optimized price using ML and A/B testing."""
    return enhanced_algorithm.calculate_optimized_price(*args, **kwargs)


def create_ab_test(*args, **kwargs):
    """Create a new A/B test."""
    return enhanced_algorithm.create_ab_test(*args, **kwargs)


def track_conversion(*args, **kwargs):
    """Track conversion for optimization learning."""
    return enhanced_algorithm.track_conversion(*args, **kwargs)


def get_ab_test_results(*args, **kwargs):
    """Get A/B test results."""
    return enhanced_algorithm.get_ab_test_results(*args, **kwargs)


def get_optimization_analytics(*args, **kwargs):
    """Get comprehensive optimization analytics."""
    return enhanced_algorithm.get_optimization_analytics()
