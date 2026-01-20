"""
Confidence scoring logic.
"""
from typing import Any, Dict

from .types import ModelConfidence


class ConfidenceScorer:
    """Calculator for prediction confidence."""

    def calculate_confidence(
        self, result: Dict[str, Any], conversion_sample_size: int = 0
    ) -> ModelConfidence:
        """Calculate confidence score for prediction."""
        confidence_score = 0.0

        # ML-based confidence
        if result.get("optimization_type") == "ml_optimized":
            ml_data = result.get("ml_optimization", {})
            if ml_data:
                predicted_conversion = ml_data.get("predicted_conversion", 0.5)
                confidence_score = min(
                    predicted_conversion * 2, 1.0
                )  # Convert to confidence

        # A/B test confidence based on sample size
        elif result.get("ab_test"):
            ab_data = result.get("ab_test", {})
            if ab_data:
                # Higher confidence with more data
                confidence_score = min(conversion_sample_size / 100, 1.0)

        # Traditional pricing confidence
        else:
            # Based on feature completeness
            features = result.get("strategy_factors", {})
            feature_completeness = len([v for v in features.values() if v > 0])
            confidence_score = min(feature_completeness / 4, 1.0)

        # Map to confidence levels
        if confidence_score >= 0.9:
            return ModelConfidence.VERY_HIGH
        elif confidence_score >= 0.8:
            return ModelConfidence.HIGH
        elif confidence_score >= 0.65:
            return ModelConfidence.MEDIUM
        elif confidence_score >= 0.5:
            return ModelConfidence.LOW
        else:
            return ModelConfidence.VERY_LOW

    def confidence_to_numeric(self, confidence: ModelConfidence) -> float:
        """Convert confidence enum to numeric score."""
        confidence_map = {
            ModelConfidence.VERY_LOW: 0.25,
            ModelConfidence.LOW: 0.5,
            ModelConfidence.MEDIUM: 0.75,
            ModelConfidence.HIGH: 0.85,
            ModelConfidence.VERY_HIGH: 0.95,
        }
        return confidence_map.get(confidence, 0.5)
