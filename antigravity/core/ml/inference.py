"""
ML Inference - Prediction and inference pipeline.
=================================================

Contains:
- Conversion rate prediction
- Statistical optimization fallback
"""

import logging
from typing import Any, Dict, List

import numpy as np

from .models import ML_AVAILABLE, TF_AVAILABLE, TORCH_AVAILABLE, MLOptimizationResult
from .scoring import calculate_viral_multiplier
from .training import extract_enhanced_features

logger = logging.getLogger(__name__)

# Optional sklearn imports with fallback
SKLEARN_AVAILABLE = False
PolynomialFeatures = None  # type: ignore
cross_val_score = None  # type: ignore

try:
    from sklearn.model_selection import cross_val_score
    from sklearn.preprocessing import PolynomialFeatures

    SKLEARN_AVAILABLE = True
except ImportError:
    logger.warning("sklearn not available for inference, using fallbacks")


def predict_conversion_rate_ml(
    price: float, features: Dict[str, Any], models: Dict[str, Any]
) -> float:
    """
    Predict conversion rate using ML models.

    Args:
        price: Price point
        features: Feature dictionary
        models: Dictionary of trained models

    Returns:
        Predicted conversion rate
    """
    if not ML_AVAILABLE or "neural_pricing" not in models:
        # Simple heuristic fallback
        return 0.05 + 0.1 * float(features.get("demand_factor", 1.0))

    feature_vector = extract_enhanced_features(price, features)

    try:
        if TF_AVAILABLE:
            model = models["neural_pricing"]
            prediction = model.predict(feature_vector.reshape(1, -1))
            return float(prediction[0][0])
        elif TORCH_AVAILABLE:
            import torch

            model = models["neural_pricing"]
            with torch.no_grad():
                prediction = model(torch.tensor(feature_vector, dtype=torch.float32))
                return float(prediction[0])

    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        return 0.1  # Fallback conversion rate

    return 0.1


def calculate_statistical_optimization(
    base_price: float,
    features: Dict[str, Any],
    models: Dict[str, Any],
    training_data: List[Dict[str, Any]],
) -> MLOptimizationResult:
    """
    Fallback statistical optimization when AI models unavailable.

    Args:
        base_price: Base price point
        features: Feature dictionary
        models: Dictionary of models
        training_data: Historical training data

    Returns:
        MLOptimizationResult with optimization details
    """
    # If sklearn not available, return simple fallback
    if not SKLEARN_AVAILABLE:
        return MLOptimizationResult(
            optimal_price=base_price,
            confidence_score=0.5,
            predicted_conversion_rate=0.1,
            viral_multiplier=calculate_viral_multiplier(features),
            strategy_used="no_sklearn_fallback",
            optimization_features=["basic_features"],
            training_data_points=len(training_data),
        )

    # Enhanced feature engineering
    feature_vector = extract_enhanced_features(base_price, features)

    # Polynomial features for non-linear relationships
    poly_features = PolynomialFeatures(degree=2, include_bias=False)
    feature_poly = poly_features.fit_transform(feature_vector.reshape(1, -1))

    # Use ensemble model
    if "ensemble" in models:
        try:
            X = np.hstack([feature_vector.reshape(1, -1), feature_poly])
            y = np.array([features.get("conversion_rate", 0.1)])

            # Cross-validation for robustness (requires at least 10 samples)
            min_samples_for_cv = 10
            if len(training_data) >= min_samples_for_cv:
                # Build dataset from training data for CV
                X_train_list = [X]
                y_train_list = [y[0]]
                for record in training_data[-min_samples_for_cv:]:
                    record_features = record.get("features", {})
                    record_price = record.get("price", base_price)
                    record_fv = extract_enhanced_features(record_price, record_features)
                    record_poly = poly_features.transform(record_fv.reshape(1, -1))
                    X_train_list.append(np.hstack([record_fv.reshape(1, -1), record_poly]))
                    y_train_list.append(record.get("conversion_rate", 0.1))
                X_cv = np.vstack(X_train_list)
                y_cv = np.array(y_train_list)
                scores = cross_val_score(models["ensemble"], X_cv, y_cv, cv=5, scoring="r2")
            else:
                # Not enough samples for CV, use default score
                logger.debug(
                    f"Skipping CV: only {len(training_data)} samples (need {min_samples_for_cv})"
                )
                scores = np.array([0.5])  # Default moderate confidence

            # Fit on full dataset
            models["ensemble"].fit(X, y)

            # Predict optimal price
            test_prices = np.linspace(base_price * 0.5, base_price * 2.0, 20)
            X_test = np.hstack(
                [
                    test_prices.reshape(-1, 1),
                    poly_features.transform(test_prices.reshape(-1, 1)),
                ]
            )

            predictions = models["ensemble"].predict(X_test)
            optimal_idx = np.argmax(predictions)
            optimal_price = test_prices[optimal_idx]

            return MLOptimizationResult(
                optimal_price=float(optimal_price),
                confidence_score=float(np.mean(scores)),
                predicted_conversion_rate=float(predictions[optimal_idx]),
                viral_multiplier=calculate_viral_multiplier(features),
                strategy_used="ensemble_statistical",
                optimization_features=[
                    "polynomial_features",
                    "cross_validation",
                    "ensemble_model",
                ],
                training_data_points=len(training_data),
            )

        except Exception as e:
            logger.error(f"Statistical optimization failed: {e}")
            return MLOptimizationResult(
                optimal_price=base_price,
                confidence_score=0.5,
                predicted_conversion_rate=0.1,
                viral_multiplier=1.0,
                strategy_used="fallback_simple",
                optimization_features=["basic_optimization"],
                training_data_points=0,
            )

    return MLOptimizationResult(
        optimal_price=base_price,
        confidence_score=0.5,
        predicted_conversion_rate=0.1,
        viral_multiplier=1.0,
        strategy_used="statistical_fallback",
        optimization_features=["basic_features"],
        training_data_points=0,
    )
