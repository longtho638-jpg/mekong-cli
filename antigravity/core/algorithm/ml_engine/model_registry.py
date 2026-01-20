"""
ML Model Registry - Default model definitions and registration logic.
"""
import logging
from typing import Dict

from ..types import MLModel

logger = logging.getLogger(__name__)

# ML imports (optional, with fallbacks)
try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

class ModelRegistry:
    """Manages the lifecycle and defaults of ML models."""

    def __init__(self, models: Dict[str, MLModel]):
        self.models = models
        if ML_AVAILABLE:
            self._initialize_default_models()

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

    def get_model(self, name: str) -> MLModel:
        """Retrieve a model by name."""
        return self.models.get(name)

    def has_model(self, name: str) -> bool:
        """Check if a model exists."""
        return name in self.models
