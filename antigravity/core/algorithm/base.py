"""
Base classes, enums, and dataclasses for the Antigravity Algorithm.
=====================================================================

Contains fundamental types used across all algorithm modules:
- Pricing strategy enums
- A/B test configuration
- ML model definitions
- Conversion tracking data
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class PricingStrategy(Enum):
    """Enhanced pricing strategies.

    Attributes:
        PENETRATION: Low price to gain market share
        PREMIUM: High value positioning
        FREEMIUM: Free tier + paid upgrade
        VIRAL_COEFFICIENT: Optimized for growth
        ENTERPRISE: Custom pricing
        ML_OPTIMIZED: Machine learning optimized
        AB_TEST: A/B testing enabled
    """

    PENETRATION = "penetration"
    PREMIUM = "premium"
    FREEMIUM = "freemium"
    VIRAL_COEFFICIENT = "viral"
    ENTERPRISE = "enterprise"
    ML_OPTIMIZED = "ml_optimized"
    AB_TEST = "ab_test"


class ABTestVariant(Enum):
    """A/B test variant types."""

    CONTROL = "control"
    VARIANT_A = "variant_a"
    VARIANT_B = "variant_b"
    MULTIVARIATE = "multivariate"


class ModelConfidence(Enum):
    """Prediction confidence levels.

    Attributes:
        VERY_LOW: < 50% confidence
        LOW: 50-65% confidence
        MEDIUM: 65-80% confidence
        HIGH: 80-90% confidence
        VERY_HIGH: > 90% confidence
    """

    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class ABTestConfig:
    """A/B test configuration.

    Attributes:
        test_id: Unique test identifier
        name: Human-readable test name
        variants: Mapping of variant_name -> price_multiplier
        traffic_split: Mapping of variant_name -> percentage (0-1)
        start_time: Unix timestamp of test start
        end_time: Optional Unix timestamp of test end
        metrics: Collected test metrics
    """

    test_id: str
    name: str
    variants: Dict[str, float]
    traffic_split: Dict[str, float]
    start_time: float
    end_time: Optional[float] = None
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MLModel:
    """ML model for price optimization.

    Attributes:
        model_type: Type of model (linear, random_forest, neural_network)
        features: List of feature names
        target: Target variable name
        model: Trained model instance
        scaler: Feature scaler instance
        accuracy: Model accuracy score
        last_trained: Unix timestamp of last training
    """

    model_type: str
    features: List[str]
    target: str
    model: Any = None
    scaler: Any = None
    accuracy: float = 0.0
    last_trained: float = 0.0


@dataclass
class ConversionData:
    """Conversion tracking data.

    Attributes:
        timestamp: Unix timestamp of conversion event
        price_point: Price at conversion
        conversion: True if converted
        user_segment: User segment identifier
        traffic_source: Traffic source identifier
        experiment_id: Optional A/B test experiment ID
        confidence_score: Prediction confidence at conversion time
    """

    timestamp: float
    price_point: float
    conversion: bool
    user_segment: str
    traffic_source: str
    experiment_id: Optional[str] = None
    confidence_score: float = 0.0


class EnhancedPricingContext:
    """Enhanced pricing context with ML features.

    Extracts ML-ready features from pricing context for model input.

    Attributes:
        base_price: Base price for calculations
        features: Raw feature dictionary
        ml_features: ML-ready feature dictionary
    """

    def __init__(self, base_price: float, features: Dict[str, Any] = None):
        """Initialize pricing context.

        Args:
            base_price: Base price for calculations
            features: Optional feature dictionary
        """
        self.base_price = base_price
        self.features = features or {}
        self.ml_features = self._extract_ml_features()

    def _extract_ml_features(self) -> Dict[str, float]:
        """Extract ML-ready features from context.

        Returns:
            Dictionary of normalized ML features
        """
        return {
            "base_price": self.base_price,
            "hour_of_day": time.localtime().tm_hour,
            "day_of_week": time.localtime().tm_wday,
            "month": time.localtime().tm_mon,
            "is_weekend": 1 if time.localtime().tm_wday >= 5 else 0,
            "demand_score": self.features.get("demand_factor", 0.0),
            "scarcity_score": self.features.get("scarcity_factor", 0.0),
            "time_urgency": self.features.get("time_factor", 1.0),
            "competitor_price": self.features.get("competitor_price", self.base_price),
            "market_size": self.features.get("market_size", 1000),
            "seasonal_factor": self.features.get("seasonal_factor", 1.0),
        }


__all__ = [
    "PricingStrategy",
    "ABTestVariant",
    "ModelConfidence",
    "ABTestConfig",
    "MLModel",
    "ConversionData",
    "EnhancedPricingContext",
]
