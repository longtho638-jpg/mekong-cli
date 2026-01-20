"""
ML Module - AI-Powered Pricing Intelligence.
=============================================

Modular ML optimization system for pricing intelligence:
- models.py: Data structures, enums, model factories
- training.py: Feature extraction, A/B testing, training utilities
- inference.py: Prediction and inference pipeline
- optimizer.py: Main MLOptimizer orchestration class

Usage:
    from antigravity.core.ml import MLOptimizer, calculate_ai_optimized_price
"""

from .inference import (
    calculate_statistical_optimization,
    predict_conversion_rate_ml,
)
from .scoring import (
    calculate_performance_score,
    calculate_viral_multiplier,
)
from .analytics import (
    create_default_metrics,
    generate_analytics_report,
    update_metrics,
)
from .models import (
    ML_AVAILABLE,
    TF_AVAILABLE,
    TORCH_AVAILABLE,
    ABTestAdvanced,
    AIPricingAgent,
    ConversionPredictor,
    GameChangingFeature,
    MLOptimizationResult,
    PricingMode,
    QuantumOptimizer,
    create_ensemble_model,
    create_pytorch_model,
    create_sklearn_model,
    create_tensorflow_model,
)
from .optimizer import MLOptimizer
from .training import (
    analyze_market_conditions,
    calculate_immediate_reward,
    create_ab_test,
    create_polynomial_features,
    extract_enhanced_features,
    get_recent_performance,
)

# Global ML optimizer instance
ml_optimizer = MLOptimizer()


# Convenience functions (delegate to global instance)
def calculate_ai_optimized_price(base_price, features, context=None):
    """Calculate AI-optimized price."""
    return ml_optimizer.calculate_ai_optimized_price(base_price, features, context)


def create_advanced_ab_test(test_id, name, control_price, variant_configs, duration_days=7):
    """Create advanced A/B test."""
    return ml_optimizer.create_advanced_ab_test(
        test_id, name, control_price, variant_configs, duration_days
    )


def update_game_changing_metrics(feature, value):
    """Update game-changing metrics."""
    ml_optimizer.update_game_changing_metrics(feature, value)


def get_game_changing_analytics():
    """Get game-changing analytics."""
    return ml_optimizer.get_game_changing_analytics()


__all__ = [
    # Main class
    "MLOptimizer",
    "ml_optimizer",
    # Convenience functions
    "calculate_ai_optimized_price",
    "create_advanced_ab_test",
    "update_game_changing_metrics",
    "get_game_changing_analytics",
    # Models and dataclasses
    "MLOptimizationResult",
    "ABTestAdvanced",
    "ConversionPredictor",
    "GameChangingFeature",
    "PricingMode",
    "QuantumOptimizer",
    "AIPricingAgent",
    # Model factories
    "create_tensorflow_model",
    "create_pytorch_model",
    "create_sklearn_model",
    "create_ensemble_model",
    # Training utilities
    "extract_enhanced_features",
    "create_polynomial_features",
    "get_recent_performance",
    "analyze_market_conditions",
    "calculate_immediate_reward",
    "create_ab_test",
    # Inference utilities
    "predict_conversion_rate_ml",
    "calculate_viral_multiplier",
    "calculate_statistical_optimization",
    "calculate_performance_score",
    # Availability flags
    "ML_AVAILABLE",
    "TF_AVAILABLE",
    "TORCH_AVAILABLE",
]
