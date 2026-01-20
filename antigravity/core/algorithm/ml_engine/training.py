"""
ML Engine Training - Model training operations.
"""

import logging
import time
from typing import Any, Dict, List

from ..types import MLModel
from .persistence import ModelPersistence

logger = logging.getLogger(__name__)

# Check for ML availability
try:
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False


class ModelTrainer:
    """Handles ML model training operations."""

    def __init__(self, models: Dict[str, MLModel], persistence: ModelPersistence):
        self.models = models
        self.persistence = persistence

    def retrain_models(self, conversion_data: List[Any]):
        """Retrain ML models with new conversion data."""
        if not ML_AVAILABLE or len(conversion_data) < 50:
            return

        logger.info(f"Retraining ML models with {len(conversion_data)} data points")

        # Prepare training data
        features, targets = self._prepare_training_data(conversion_data)

        if len(features) < 10:
            return

        try:
            features_array = np.array(features)
            targets_array = np.array(targets)

            # Retrain price optimization model
            if "price_optimization" in self.models:
                self._retrain_model("price_optimization", features_array, targets_array)

        except Exception as e:
            logger.error(f"Model retraining failed: {e}")

    def _prepare_training_data(self, conversion_data: List[Any]) -> tuple:
        """Prepare training data from conversion history."""
        features = []
        targets = []

        # Use last 1000 conversions
        recent_data = conversion_data[-1000:]

        for conversion in recent_data:
            feature_vector = [
                conversion.price_point,
                conversion.timestamp,
                conversion.confidence_score,
            ]
            features.append(feature_vector)
            targets.append(1.0 if conversion.conversion else 0.0)

        return features, targets

    def _retrain_model(self, model_name: str, features: Any, targets: Any):
        """Retrain a single model."""
        model = self.models[model_name]
        try:
            model.model.fit(features, targets)
            model.last_trained = time.time()
            self.persistence.save_model(model_name, model)
            logger.info(f"{model_name} model retrained")
        except Exception as fit_err:
            logger.warning(f"Could not fit model (dimension mismatch likely): {fit_err}")
