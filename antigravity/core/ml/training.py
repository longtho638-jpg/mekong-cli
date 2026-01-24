"""
ML Training - Feature extraction, A/B testing, and training utilities.
======================================================================

Contains:
- Feature extraction and engineering
- A/B test creation and management
- Training data handling
- Market analysis utilities
"""

import logging
import time
from typing import Any, Dict, TypedDict

import numpy as np

from .models import ABTestAdvanced

logger = logging.getLogger(__name__)


# Type aliases
class MarketConditionsDict(TypedDict, total=False):
    market_trend: str
    competition_level: str
    economic_indicator: str


class VariantConfigDict(TypedDict, total=False):
    price_multiplier: float
    strategy: str
    features: Dict[str, Any]


# Optional sklearn import with fallback
try:
    from sklearn.preprocessing import PolynomialFeatures

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("sklearn not available, using fallback polynomial features")


def extract_enhanced_features(base_price: float, features: Dict[str, Any]) -> np.ndarray:
    """
    Extract enhanced features for ML models.

    Args:
        base_price: Base price point
        features: Raw feature dictionary

    Returns:
        Feature vector as numpy array (10 dimensions)
    """
    return np.array(
        [
            base_price,
            features.get("demand_factor", 1.0),
            features.get("scarcity_factor", 1.0),
            features.get("time_factor", 1.0),
            features.get("viral_coefficient", 1.0),
            # Derived features
            base_price / 100,  # Price in hundreds
            np.log1p(max(base_price, 1.0)),  # Log price
            np.sin(time.time() / 86400),  # Time of day
            np.cos(2 * np.pi * time.localtime().tm_hour / 24),  # Day cycle
            len(features.get("competitor_prices", [base_price])),  # Market competition
        ]
    )


def create_polynomial_features(feature_vector: np.ndarray, degree: int = 2) -> np.ndarray:
    """
    Create polynomial features for non-linear relationships.

    Args:
        feature_vector: Input feature vector
        degree: Polynomial degree

    Returns:
        Polynomial feature array
    """
    if SKLEARN_AVAILABLE:
        poly_features = PolynomialFeatures(degree=degree, include_bias=False)
        return poly_features.fit_transform(feature_vector.reshape(1, -1))
    else:
        # Fallback: simple quadratic features (x, x^2)
        x = feature_vector.reshape(1, -1)
        return np.hstack([x, x**2])


def get_recent_performance(training_data: list) -> Dict[str, float]:
    """
    Get recent performance metrics from training data.

    Args:
        training_data: List of training data points

    Returns:
        Performance metrics dictionary
    """
    if len(training_data) < 10:
        return {"avg_conversion": 0.1, "avg_viral_multiplier": 1.0}

    recent_data = training_data[-100:]
    return {
        "avg_conversion": np.mean([d.get("conversion", 0) for d in recent_data]),
        "avg_viral_multiplier": np.mean([d.get("viral_multiplier", 1.0) for d in recent_data]),
    }


def analyze_market_conditions() -> MarketConditionsDict:
    """
    Analyze current market conditions.

    Returns:
        Market condition analysis dictionary
    """
    return {
        "market_trend": "growing",
        "competition_level": "medium",
        "economic_indicator": "positive",
    }


def calculate_immediate_reward(new_price: float, old_price: float) -> float:
    """
    Calculate immediate reward for AI agent based on price change.

    Args:
        new_price: New price after action
        old_price: Original price

    Returns:
        Reward value
    """
    price_change = (new_price - old_price) / old_price if old_price > 0 else 0

    if 0 < price_change <= 0.1:  # Small increase
        return 0.1
    elif 0.1 < price_change <= 0.2:  # Moderate increase
        return 0.2
    elif price_change > 0.2:  # Large increase - penalty
        return -0.1
    elif -0.1 <= price_change <= 0:  # Small decrease
        return 0.05
    else:  # Large decrease
        return 0.0


def create_ab_test(
    test_id: str,
    name: str,
    control_price: float,
    variant_configs: Dict[str, VariantConfigDict],
    duration_days: int = 7,
) -> ABTestAdvanced:
    """
    Create advanced A/B test with statistical power.

    Args:
        test_id: Unique test identifier
        name: Human-readable test name
        control_price: Control group price
        variant_configs: Variant configurations
        duration_days: Test duration in days

    Returns:
        ABTestAdvanced configuration
    """
    variants = {"control": {"price": control_price, "strategy": "fixed"}}

    for variant_name, config in variant_configs.items():
        variants[variant_name] = {
            "price": control_price * config.get("price_multiplier", 1.0),
            "strategy": config.get("strategy", "variable"),
            "features": config.get("features", {}),
        }

    return ABTestAdvanced(
        test_id=test_id,
        name=name,
        variants=variants,
        traffic_split={"control": 0.4, "variant_a": 0.3, "variant_b": 0.3},
        duration_days=duration_days,
        statistical_power=0.8,
        significance_level=0.05,
        multivariate=True,
        adaptive_traffic=True,
        early_stopping=True,
    )
