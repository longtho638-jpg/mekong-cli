"""
Core Antigravity Algorithm Logic.
Coordinaties ML, A/B testing, and traditional pricing strategies.
"""
import time
import logging
from typing import Any, Dict, List

from .types import (
    EnhancedPricingContext,
    PricingStrategy,
    ModelConfidence,
    ConversionData
)
from .ml_engine import MLEngine
from .ab_testing import ABTestEngine
from .analytics import AnalyticsEngine
from .strategies import PricingStrategyEngine
from .confidence import ConfidenceScorer
from .utils import (
    build_ab_tests_data,
    build_conversion_data,
    build_ml_models_data,
    build_pricing_optimization_data,
)

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
        self.strategy_engine = PricingStrategyEngine()
        self.confidence_scorer = ConfidenceScorer()

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

        # Use ML optimization if available and no AB test result
        if result.get("optimization_type") == "ab_testing":
            pass
        elif strategy == PricingStrategy.ML_OPTIMIZED:
            ml_result = self.ml_engine.calculate_optimized_price(context)
            if ml_result:
                result.update(ml_result)
            else:
                 # Fallback to traditional if ML fails
                enhanced_result = self.strategy_engine.calculate_price(context, PricingStrategy.VIRAL_COEFFICIENT)
                result.update(enhanced_result)

        # Fallback to enhanced traditional pricing
        elif result.get("optimization_type") is None:
            enhanced_result = self.strategy_engine.calculate_price(context, strategy)
            result.update(enhanced_result)

        # Add confidence scoring
        confidence = self.confidence_scorer.calculate_confidence(
            result,
            conversion_sample_size=len(self.conversion_data)
        )
        result["confidence"] = confidence.value
        result["confidence_score"] = self.confidence_scorer.confidence_to_numeric(confidence)

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

        self.conversion_data.append(conversion)

        # Update ML models periodically
        if len(self.conversion_data) % 100 == 0:
            self.ml_engine.retrain_models(self.conversion_data)

    def get_optimization_analytics(self) -> Dict[str, Any]:
        """Get comprehensive optimization analytics."""
        return {
            "ml_models": build_ml_models_data(self.ml_engine),
            "ab_tests": build_ab_tests_data(self.ab_engine),
            "conversion_data": build_conversion_data(self.conversion_data, self.analytics_engine),
            "pricing_optimization": build_pricing_optimization_data(self.pricing_history, self.analytics_engine),
        }

    # Proxy methods for AB Engine that were originally in this class
    def create_ab_test(self, *args, **kwargs):
        return self.ab_engine.create_test(*args, **kwargs)

    def get_ab_test_results(self, test_id: str):
        return self.ab_engine.analyze_results(test_id, self.conversion_data)
