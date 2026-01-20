"""
Core Antigravity Algorithm Logic.
Coordinaties ML, A/B testing, and traditional pricing strategies.
"""
import time
import logging
from typing import Any, Dict, List, Optional

from .types import (
    EnhancedPricingContext,
    PricingStrategy,
    ModelConfidence,
    ConversionData
)
from .ml_engine import MLEngine
from .ab_testing import ABTestEngine
from .analytics import AnalyticsEngine

logger = logging.getLogger(__name__)

class MaxLevelAntigravityAlgorithm:
    """MAX LEVEL algorithm with ML optimization and viral growth features."""

    def __init__(self):
        self.pricing_history = []
        self.conversion_data: List[ConversionData] = []

        # Sub-engines
        self.ml_engine = MLEngine()
        self.ab_engine = ABTestEngine()
        self.analytics_engine = AnalyticsEngine()

    def calculate_optimized_price(
        self,
        base_price: float,
        context: EnhancedPricingContext = None,
        strategy: PricingStrategy = PricingStrategy.ML_OPTIMIZED,
        ab_test_id: str = None,
    ) -> Dict[str, Any]:
        """Calculate optimized price using ML and A/B testing."""

        if context is None:
            context = EnhancedPricingContext(base_price)

        result = {
            "base_price": base_price,
            "final_price": base_price,
            "strategy": strategy.value,
            "optimizations": {},
            "confidence": ModelConfidence.MEDIUM,
            "ab_test": None,
        }

        # Check if A/B test is active
        if ab_test_id:
            test_config = self.ab_engine.get_test_config(ab_test_id)
            if test_config:
                # Logic moved here to delegate to AB Engine properly if needed
                # But AB engine assign_variant returns variant name, we need to calculate price
                variant = self.ab_engine.assign_variant(ab_test_id)
                price_multiplier = test_config.variants.get(variant, 1.0)
                optimized_price = context.base_price * price_multiplier

                ab_result = {
                    "final_price": optimized_price,
                    "ab_test": {
                        "test_id": ab_test_id,
                        "variant": variant,
                        "price_multiplier": price_multiplier,
                        "test_name": test_config.name,
                        "traffic_split": test_config.traffic_split,
                    },
                    "optimization_type": "ab_testing",
                }
                result.update(ab_result)
            else:
                # Fallback if test not found
                pass

        # Use ML optimization if available and no AB test result (or combined?)
        # Original logic: if ab_test_id -> do AB. elif ML -> do ML. else -> traditional.

        if result.get("optimization_type") == "ab_testing":
            pass
        elif strategy == PricingStrategy.ML_OPTIMIZED:
            ml_result = self.ml_engine.calculate_optimized_price(context)
            if ml_result:
                result.update(ml_result)
            else:
                 # Fallback to traditional if ML fails
                enhanced_result = self._calculate_enhanced_traditional_price(context, PricingStrategy.VIRAL_COEFFICIENT)
                result.update(enhanced_result)

        # Fallback to enhanced traditional pricing
        elif result.get("optimization_type") is None:
            enhanced_result = self._calculate_enhanced_traditional_price(context, strategy)
            result.update(enhanced_result)

        # Add confidence scoring
        confidence = self._calculate_prediction_confidence(result)
        result["confidence"] = confidence.value
        result["confidence_score"] = self._confidence_to_numeric(confidence)

        # Store for learning
        self.pricing_history.append(
            {
                "timestamp": time.time(),
                "base_price": base_price,
                "final_price": result["final_price"],
                "strategy": strategy.value,
                "context": context.features,
                "ab_test_id": ab_test_id,
                "confidence": confidence.value,
            }
        )

        return result

    def _calculate_enhanced_traditional_price(
        self, context: EnhancedPricingContext, strategy: PricingStrategy
    ) -> Dict[str, Any]:
        """Calculate price using enhanced traditional methods."""

        base_price = context.base_price
        features = context.features
        price = base_price

        if strategy == PricingStrategy.VIRAL_COEFFICIENT:
            # Enhanced viral coefficient with multiple factors
            viral_boost = 1 + (features.get("viral_coefficient", 1.0) - 1) * 0.7

            # Time-based viral amplification
            time_multiplier = 1.0
            if features.get("time_factor", 1.0) > 1.5:  # High urgency
                time_multiplier *= 1.2

            # Demand-based viral pricing
            demand_multiplier = 1 + features.get("demand_factor", 0.0) * 0.5

            price = base_price * viral_boost * time_multiplier * demand_multiplier

            # Early adopter discount for viral spread
            if features.get("viral_coefficient", 1.0) > 2.0:
                price *= 0.85  # 15% discount to fuel viral growth

        elif strategy == PricingStrategy.PENETRATION:
            # Penetration pricing with competitor awareness
            competitor_price = features.get("competitor_price", base_price)
            if competitor_price > 0:
                price = min(competitor_price * 0.9, base_price)  # 10% cheaper than competitor
            else:
                price = base_price * 0.7  # 30% discount for market entry

        return {
            "final_price": price,
            "optimization_type": "enhanced_traditional",
            "strategy_factors": {
                "viral_coefficient": features.get("viral_coefficient", 1.0),
                "time_factor": features.get("time_factor", 1.0),
                "demand_factor": features.get("demand_factor", 0.0),
            },
        }

    def _calculate_prediction_confidence(self, result: Dict[str, Any]) -> ModelConfidence:
        """Calculate confidence score for prediction."""
        confidence_score = 0.0

        # ML-based confidence
        if result.get("optimization_type") == "ml_optimized":
            ml_data = result.get("ml_optimization", {})
            if ml_data:
                predicted_conversion = ml_data.get("predicted_conversion", 0.5)
                confidence_score = min(predicted_conversion * 2, 1.0)  # Convert to confidence

        # A/B test confidence based on sample size
        elif result.get("ab_test"):
            ab_data = result.get("ab_test", {})
            if ab_data:
                # Higher confidence with more data
                sample_size = len(self.conversion_data)
                confidence_score = min(sample_size / 100, 1.0)

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

    def _confidence_to_numeric(self, confidence: ModelConfidence) -> float:
        """Convert confidence enum to numeric score."""
        confidence_map = {
            ModelConfidence.VERY_LOW: 0.25,
            ModelConfidence.LOW: 0.5,
            ModelConfidence.MEDIUM: 0.75,
            ModelConfidence.HIGH: 0.85,
            ModelConfidence.VERY_HIGH: 0.95,
        }
        return confidence_map.get(confidence, 0.5)

    def track_conversion(
        self,
        price_point: float,
        converted: bool,
        user_segment: str,
        traffic_source: str,
        experiment_id: str = None,
        confidence_score: float = 0.0,
    ):
        """Track conversion for optimization learning."""

        conversion = ConversionData(
            timestamp=time.time(),
            price_point=price_point,
            conversion=converted,
            user_segment=user_segment,
            traffic_source=traffic_source,
            experiment_id=experiment_id,
            confidence_score=confidence_score,
        )

        # We assume c.variant might be needed by AB engine,
        # but in this refactor we keep it simple as per original structure
        # If needed, we would attach variant info to conversion data here
        if experiment_id:
             # Try to find variant from user segment if that was the logic
             # Or just store as is
             pass

        self.conversion_data.append(conversion)

        # Update ML models periodically
        if len(self.conversion_data) % 100 == 0:
            self.ml_engine.retrain_models(self.conversion_data)

    def get_optimization_analytics(self) -> Dict[str, Any]:
        """Get comprehensive optimization analytics."""

        # Gather data from sub-engines
        ml_models_data = {
            name: {
                "type": model.model_type,
                "features": model.features,
                "last_trained": model.last_trained,
                "accuracy": model.accuracy,
            }
            for name, model in self.ml_engine.models.items()
        }

        ab_tests_data = {
            test_id: {
                "name": config.name,
                "variants": config.variants,
                "traffic_split": config.traffic_split,
                "duration_days": (time.time() - config.start_time) / (24 * 3600),
                "status": "active"
                if not config.end_time or time.time() < config.end_time
                else "completed",
            }
            for test_id, config in self.ab_engine.ab_tests.items()
        }

        recent_conversions = len(
            [c for c in self.conversion_data if time.time() - c.timestamp < 86400]
        )

        return {
            "ml_models": ml_models_data,
            "ab_tests": ab_tests_data,
            "conversion_data": {
                "total_conversions": len(self.conversion_data),
                "conversion_rate": len([c for c in self.conversion_data if c.conversion])
                / max(len(self.conversion_data), 1),
                "avg_conversion_value": self.analytics_engine.calculate_avg_revenue(self.conversion_data),
                "recent_conversions": recent_conversions,
            },
            "pricing_optimization": {
                "total_calculations": len(self.pricing_history),
                "avg_confidence": sum(c.get("confidence_score", 0.5) for c in self.pricing_history)
                / max(len(self.pricing_history), 1),
                "strategy_performance": self.analytics_engine.analyze_strategy_performance(self.pricing_history),
            },
        }

    # Proxy methods for AB Engine that were originally in this class
    def create_ab_test(self, *args, **kwargs):
        return self.ab_engine.create_test(*args, **kwargs)

    def get_ab_test_results(self, test_id: str):
        return self.ab_engine.analyze_results(test_id, self.conversion_data)
