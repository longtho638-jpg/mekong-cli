"""
ML Engine Core - Main MLEngine class for pricing optimization.
"""

import logging
from typing import Any, Dict, List

from ..types import EnhancedPricingContext, MLModel
from .persistence import ModelPersistence
from .training import ModelTrainer

logger = logging.getLogger(__name__)

# ML imports (optional, with fallbacks)
try:
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    ML_AVAILABLE = True
except ImportError:
    logger.warning("ML libraries not available, using statistical methods")
    ML_AVAILABLE = False


class MLEngine:
    """Handles Machine Learning operations for pricing optimization."""

    def __init__(self, model_save_path: str = "data/antigravity_models"):
        self.persistence = ModelPersistence(model_save_path)
        self.models: Dict[str, MLModel] = self.persistence.load_models()

        # Initialize ML models if available and not loaded
        if ML_AVAILABLE:
            self._initialize_default_models()

        self.trainer = ModelTrainer(self.models, self.persistence)

    def _initialize_default_models(self):
        """Initialize default machine learning models if they don't exist."""
        # Price prediction model
        if "price_optimization" not in self.models:
            self.models["price_optimization"] = MLModel(
                model_type="random_forest",
                features=[
                    "base_price", "hour_of_day", "day_of_week",
                    "demand_score", "scarcity_score", "time_urgency", "is_weekend",
                ],
                target="conversion_rate",
                model=RandomForestRegressor(n_estimators=50, random_state=42),
            )
            logger.info("Initialized default price_optimization model")

        # Demand prediction model
        if "demand_prediction" not in self.models:
            self.models["demand_prediction"] = MLModel(
                model_type="linear",
                features=["historical_demand", "seasonal_factor", "market_trend"],
                target="predicted_demand",
                model=LinearRegression(),
                scaler=StandardScaler(),
            )
            logger.info("Initialized default demand_prediction model")

    def predict_conversion(self, context: EnhancedPricingContext) -> float:
        """Predict conversion rate for a given context."""
        if not ML_AVAILABLE or "price_optimization" not in self.models:
            return 0.5

        model = self.models["price_optimization"]
        features = np.array([list(context.ml_features.values())])

        try:
            return model.model.predict(features.reshape(1, -1))[0]
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return 0.5

    def calculate_optimized_price(self, context: EnhancedPricingContext) -> Dict[str, Any]:
        """Calculate price using ML optimization."""
        if not ML_AVAILABLE or "price_optimization" not in self.models:
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

    def retrain_models(self, conversion_data: List[Any]):
        """Retrain ML models with new conversion data."""
        self.trainer.retrain_models(conversion_data)
