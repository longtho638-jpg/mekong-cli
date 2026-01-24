"""
ML Models - Data Classes.
=========================

Result dataclasses for ML operations.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class MLOptimizationResult:
    """ML optimization result."""

    optimal_price: float
    confidence_score: float
    predicted_conversion_rate: float
    viral_multiplier: float
    strategy_used: str
    optimization_features: List[str]
    quantum_fingerprint: Optional[str] = None
    training_data_points: int = 0


@dataclass
class ABTestAdvanced:
    """Advanced A/B testing configuration."""

    test_id: str
    name: str
    variants: Dict[str, Dict[str, Any]]  # variant_name -> config
    traffic_split: Dict[str, float]
    duration_days: int
    statistical_power: float = 0.8  # 80% power
    significance_level: float = 0.05  # 5% significance
    multivariate: bool = True
    adaptive_traffic: bool = True
    early_stopping: bool = True


@dataclass
class ConversionPredictor:
    """Advanced conversion rate predictor."""

    model_type: str
    features: List[str]
    model: Any = None
    scaler: Any = None
    accuracy: float = 0.0
    prediction_intervals: Optional[List[float]] = None  # Confidence intervals
    last_trained: float = 0.0
    ensemble_models: Optional[List[Any]] = None  # For ensemble methods
