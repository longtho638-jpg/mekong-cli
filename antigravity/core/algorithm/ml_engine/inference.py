"""
ML Inference - Prediction and price optimization logic.
"""
import logging
from typing import Any, Dict

from ..types import EnhancedPricingContext
from .model_registry import ModelRegistry

logger = logging.getLogger(__name__)

# ML imports (optional, with fallbacks)
try:
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

class InferenceEngine:
    """Handles inference and optimization logic."""

    def __init__(self, registry: ModelRegistry):
        self.registry = registry

    def predict_conversion(self, context: EnhancedPricingContext) -> float:
        """Predict conversion rate for a given context."""
        if not ML_AVAILABLE or not self.registry.has_model("price_optimization"):
            return 0.5

        model = self.registry.get_model("price_optimization")
        features = np.array([list(context.ml_features.values())])

        try:
            return model.model.predict(features.reshape(1, -1))[0]
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return 0.5

    def calculate_optimized_price(self, context: EnhancedPricingContext) -> Dict[str, Any]:
        """Calculate price using ML optimization."""
        if not ML_AVAILABLE or not self.registry.has_model("price_optimization"):
            return {}

        try:
            predicted_conversion = self.predict_conversion(context)
            price_candidates = np.linspace(context.base_price * 0.5, context.base_price * 3.0, 50)

            best_price = context.base_price
            best_score = 0

            for price in price_candidates:
                score = self._calculate_price_score(price, predicted_conversion, context)
                if score > best_score:
                    best_score = score
                    best_price = price

            return {
                "final_price": float(best_price),
                "ml_optimization": {
                    "predicted_conversion": float(predicted_conversion),
                    "price_candidates_tested": len(price_candidates),
                    "optimization_score": float(best_score),
                },
                "optimization_type": "ml_optimized",
            }

        except Exception as e:
            logger.error(f"ML optimization failed: {e}")
            return {}

    def _calculate_price_score(
        self, price: float, predicted_conversion: float, context: EnhancedPricingContext
    ) -> float:
        """Calculate optimization score for price selection."""
        conversion_score = min(predicted_conversion, 1.0)
        revenue_score = (price / context.base_price) * conversion_score
        viral_bonus = context.features.get("viral_coefficient", 1.0) * 0.1
        return revenue_score + viral_bonus
