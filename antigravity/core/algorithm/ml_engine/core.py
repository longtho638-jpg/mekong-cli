"""
ML Engine Core - Main MLEngine class for pricing optimization (Facade).
"""
import logging
from typing import Any, Dict, List

from ..types import EnhancedPricingContext
from .inference import InferenceEngine
from .model_registry import ModelRegistry
from .persistence import ModelPersistence
from .training import ModelTrainer

logger = logging.getLogger(__name__)

class MLEngine:
    """Handles Machine Learning operations for pricing optimization."""

    def __init__(self, model_save_path: str = "data/antigravity_models"):
        self.persistence = ModelPersistence(model_save_path)
        self.models = self.persistence.load_models()
        self.registry = ModelRegistry(self.models)
        self.inference = InferenceEngine(self.registry)
        self.trainer = ModelTrainer(self.models, self.persistence)

    def predict_conversion(self, context: EnhancedPricingContext) -> float:
        """Predict conversion rate for a given context."""
        return self.inference.predict_conversion(context)

    def calculate_optimized_price(self, context: EnhancedPricingContext) -> Dict[str, Any]:
        """Calculate price using ML optimization."""
        return self.inference.calculate_optimized_price(context)

    def retrain_models(self, conversion_data: List[Any]):
        """Retrain ML models with new conversion data."""
        self.trainer.retrain_models(conversion_data)
