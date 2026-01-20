"""
ML Optimizer Facade - Backward Compatibility Layer.
====================================================

This module is a facade that re-exports all ML components from the
modularized `antigravity.core.ml` package.

Migration: The original monolithic ml_optimizer.py (670+ lines) has been
refactored into:
- antigravity/core/ml/models.py: Data structures, enums, model factories
- antigravity/core/ml/training.py: Feature extraction, A/B testing, training
- antigravity/core/ml/inference.py: Prediction and inference pipeline
- antigravity/core/ml/optimizer.py: Main MLOptimizer class

Usage remains unchanged:
    from antigravity.core.ml_optimizer import MLOptimizer, calculate_ai_optimized_price
"""

# Re-export everything from the modular ml package
from antigravity.core.ml import (
    # Availability flags
    ML_AVAILABLE,
    TF_AVAILABLE,
    TORCH_AVAILABLE,
    # Models and dataclasses
    ABTestAdvanced,
    AIPricingAgent,
    ConversionPredictor,
    GameChangingFeature,
    MLOptimizationResult,
    # Main class and instance
    MLOptimizer,
    PricingMode,
    QuantumOptimizer,
    # Training utilities
    analyze_market_conditions,
    # Convenience functions
    calculate_ai_optimized_price,
    calculate_immediate_reward,
    # Inference utilities
    calculate_performance_score,
    calculate_statistical_optimization,
    calculate_viral_multiplier,
    create_ab_test,
    create_advanced_ab_test,
    # Model factories
    create_ensemble_model,
    create_polynomial_features,
    create_pytorch_model,
    create_sklearn_model,
    create_tensorflow_model,
    extract_enhanced_features,
    get_game_changing_analytics,
    get_recent_performance,
    ml_optimizer,
    predict_conversion_rate_ml,
    update_game_changing_metrics,
)

__all__ = [
    # Main class and instance
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
