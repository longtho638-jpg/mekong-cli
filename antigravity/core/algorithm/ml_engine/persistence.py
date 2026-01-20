"""
ML Engine Persistence - Model save/load operations.
"""

import json
import logging
import os
from typing import Dict, Optional

from ..types import MLModel

logger = logging.getLogger(__name__)


class ModelPersistence:
    """Handles ML model save/load operations."""

    def __init__(self, model_save_path: str):
        self.model_save_path = model_save_path
        os.makedirs(self.model_save_path, exist_ok=True)

    def save_model(self, model_name: str, model: MLModel):
        """Save ML model to disk."""
        try:
            import joblib
        except ImportError:
            logger.warning("joblib not available, cannot save models")
            return

        try:
            model_path = os.path.join(self.model_save_path, f"{model_name}.joblib")
            joblib.dump(model.model, model_path)

            # Save metadata
            metadata = {
                "model_type": model.model_type,
                "features": model.features,
                "target": model.target,
                "last_trained": model.last_trained,
                "accuracy": model.accuracy,
            }

            metadata_path = os.path.join(self.model_save_path, f"{model_name}_metadata.json")
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"Model {model_name} saved to {model_path}")

        except Exception as e:
            logger.error(f"Failed to save model {model_name}: {e}")

    def load_models(self) -> Dict[str, MLModel]:
        """Load existing ML models from disk."""
        models = {}

        if not os.path.exists(self.model_save_path):
            return models

        try:
            import joblib
        except ImportError:
            return models

        for filename in os.listdir(self.model_save_path):
            if filename.endswith(".joblib"):
                model_name = filename.replace(".joblib", "")
                model = self._load_single_model(model_name, joblib)
                if model:
                    models[model_name] = model

        return models

    def _load_single_model(self, model_name: str, joblib) -> Optional[MLModel]:
        """Load a single model from disk."""
        try:
            model_path = os.path.join(self.model_save_path, f"{model_name}.joblib")
            model = joblib.load(model_path)

            # Load metadata
            metadata_path = os.path.join(self.model_save_path, f"{model_name}_metadata.json")
            metadata = {}
            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)

            ml_model = MLModel(
                model_type=metadata.get("model_type", "unknown"),
                features=metadata.get("features", []),
                target=metadata.get("target", "unknown"),
                model=model,
                last_trained=metadata.get("last_trained", 0.0),
                accuracy=metadata.get("accuracy", 0.0),
            )

            logger.info(f"Loaded ML model: {model_name}")
            return ml_model

        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            return None
