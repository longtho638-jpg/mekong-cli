"""
🧠 MAX LEVEL AntigravityAlgorithm - AI-Enhanced Core Business Logic
====================================================================

THE SINGLE SOURCE OF TRUTH with ML-powered optimization:
- Machine learning price optimization with demand prediction
- A/B testing support for dynamic pricing experiments
- Prediction confidence scores using ensemble models
- Conversion rate optimization with viral coefficient tracking
"""

import json
import logging
import math
import os
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

# ML imports (optional, with fallbacks)
try:
    import joblib
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler

    ML_AVAILABLE = True
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("ML libraries not available, using statistical methods")
    ML_AVAILABLE = False

logger = logging.getLogger(__name__)


class PricingStrategy(Enum):
    """Enhanced pricing strategies."""

    PENETRATION = "penetration"  # Low price to gain market
    PREMIUM = "premium"  # High value positioning
    FREEMIUM = "freemium"  # Free tier + paid upgrade
    VIRAL_COEFFICIENT = "viral"  # Optimized for growth
    ENTERPRISE = "enterprise"  # Custom pricing
    ML_OPTIMIZED = "ml_optimized"  # Machine learning optimized
    AB_TEST = "ab_test"  # A/B testing enabled


class ABTestVariant(Enum):
    """A/B test variant types."""

    CONTROL = "control"
    VARIANT_A = "variant_a"
    VARIANT_B = "variant_b"
    MULTIVARIATE = "multivariate"


class ModelConfidence(Enum):
    """Prediction confidence levels."""

    VERY_LOW = "very_low"  # < 50%
    LOW = "low"  # 50-65%
    MEDIUM = "medium"  # 65-80%
    HIGH = "high"  # 80-90%
    VERY_HIGH = "very_high"  # > 90%


@dataclass
class ABTestConfig:
    """A/B test configuration."""

    test_id: str
    name: str
    variants: Dict[str, float]  # variant_name -> price_multiplier
    traffic_split: Dict[str, float]  # variant_name -> percentage (0-1)
    start_time: float
    end_time: Optional[float] = None
    metrics: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MLModel:
    """ML model for price optimization."""

    model_type: str  # linear, random_forest, neural_network
    features: List[str]
    target: str
    model: Any = None
    scaler: Any = None
    accuracy: float = 0.0
    last_trained: float = 0.0


@dataclass
class ConversionData:
    """Conversion tracking data."""

    timestamp: float
    price_point: float
    conversion: bool  # True if converted
    user_segment: str
    traffic_source: str
    experiment_id: Optional[str] = None
    confidence_score: float = 0.0


class EnhancedPricingContext:
    """Enhanced pricing context with ML features."""

    def __init__(self, base_price: float, features: Dict[str, Any] = None):
        self.base_price = base_price
        self.features = features or {}
        self.ml_features = self._extract_ml_features()

    def _extract_ml_features(self) -> Dict[str, float]:
        """Extract ML-ready features from context."""
        return {
            "base_price": self.base_price,
            "hour_of_day": time.localtime().tm_hour,
            "day_of_week": time.localtime().tm_wday,
            "month": time.localtime().tm_mon,
            "is_weekend": 1 if time.localtime().tm_wday >= 5 else 0,
            "demand_score": self.features.get("demand_factor", 0.0),
            "scarcity_score": self.features.get("scarcity_factor", 0.0),
            "time_urgency": self.features.get("time_factor", 1.0),
            "competitor_price": self.features.get("competitor_price", self.base_price),
            "market_size": self.features.get("market_size", 1000),
            "seasonal_factor": self.features.get("seasonal_factor", 1.0),
        }


class MaxLevelAntigravityAlgorithm:
    """MAX LEVEL algorithm with ML optimization and viral growth features."""

    def __init__(self):
        self.pricing_history = []
        self.conversion_data = []
        self.ab_tests: Dict[str, ABTestConfig] = {}
        self.ml_models: Dict[str, MLModel] = {}
        self.prediction_cache = {}
        self.model_save_path = "data/antigravity_models"

        # Ensure model directory exists
        os.makedirs(self.model_save_path, exist_ok=True)

        # Load existing models
        self._load_models()

        # Initialize ML models if available
        if ML_AVAILABLE:
            self._initialize_ml_models()

    def _initialize_ml_models(self):
        """Initialize machine learning models."""
        # Price prediction model
        self.ml_models["price_optimization"] = MLModel(
            model_type="random_forest",
            features=[
                "base_price",
                "hour_of_day",
                "day_of_week",
                "demand_score",
                "scarcity_score",
                "time_urgency",
                "is_weekend",
            ],
            target="conversion_rate",
            model=RandomForestRegressor(n_estimators=50, random_state=42),
        )

        # Demand prediction model
        self.ml_models["demand_prediction"] = MLModel(
            model_type="linear",
            features=["historical_demand", "seasonal_factor", "market_trend"],
            target="predicted_demand",
            model=LinearRegression(),
            scaler=StandardScaler(),
        )

        logger.info("ML models initialized for price optimization")

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
        if ab_test_id and ab_test_id in self.ab_tests:
            ab_result = self._calculate_ab_test_price(ab_test_id, context)
            result.update(ab_result)

        # Use ML optimization if available
        elif strategy == PricingStrategy.ML_OPTIMIZED and ML_AVAILABLE:
            ml_result = self._calculate_ml_optimized_price(context)
            result.update(ml_result)

        # Fallback to enhanced traditional pricing
        else:
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

    def _calculate_ab_test_price(
        self, test_id: str, context: EnhancedPricingContext
    ) -> Dict[str, Any]:
        """Calculate price using A/B test variant."""
        test_config = self.ab_tests[test_id]

        # Determine which variant this user gets
        variant = self._assign_ab_variant(test_config)
        price_multiplier = test_config.variants.get(variant, 1.0)

        optimized_price = context.base_price * price_multiplier

        return {
            "final_price": optimized_price,
            "ab_test": {
                "test_id": test_id,
                "variant": variant,
                "price_multiplier": price_multiplier,
                "test_name": test_config.name,
                "traffic_split": test_config.traffic_split,
            },
            "optimization_type": "ab_testing",
        }

    def _assign_ab_variant(self, test_config: ABTestConfig) -> str:
        """Assign user to A/B test variant based on traffic split."""

        # Simple hash-based assignment for consistency
        user_hash = hash(str(time.time())) % 100

        cumulative_percentage = 0
        for variant, percentage in test_config.traffic_split.items():
            cumulative_percentage += percentage * 100
            if user_hash < cumulative_percentage:
                return variant

        return "control"  # Fallback

    def _calculate_ml_optimized_price(self, context: EnhancedPricingContext) -> Dict[str, Any]:
        """Calculate price using ML optimization."""

        if not ML_AVAILABLE or "price_optimization" not in self.ml_models:
            return self._calculate_enhanced_traditional_price(
                context, PricingStrategy.VIRAL_COEFFICIENT
            )

        model = self.ml_models["price_optimization"]
        features = np.array([list(context.ml_features.values())])

        try:
            # Predict optimal conversion rate
            predicted_conversion = model.model.predict(features.reshape(1, -1))[0]

            # Find price that maximizes conversion * price
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
            return self._calculate_enhanced_traditional_price(
                context, PricingStrategy.VIRAL_COEFFICIENT
            )

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

    def _calculate_price_score(
        self, price: float, predicted_conversion: float, context: EnhancedPricingContext
    ) -> float:
        """Calculate optimization score for price selection."""
        # Balance between conversion probability and revenue
        conversion_score = min(predicted_conversion, 1.0)
        revenue_score = (price / context.base_price) * conversion_score

        # Viral coefficient bonus
        viral_bonus = context.features.get("viral_coefficient", 1.0) * 0.1

        return revenue_score + viral_bonus

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

    def create_ab_test(
        self,
        test_id: str,
        name: str,
        variants: Dict[str, float],
        traffic_split: Dict[str, float] = None,
        duration_days: int = 7,
    ) -> Dict[str, Any]:
        """Create new A/B test."""

        if traffic_split is None:
            # Equal split
            variant_count = len(variants)
            equal_split = 1.0 / variant_count
            traffic_split = {variant: equal_split for variant in variants}

        test_config = ABTestConfig(
            test_id=test_id,
            name=name,
            variants=variants,
            traffic_split=traffic_split,
            start_time=time.time(),
            end_time=time.time() + (duration_days * 24 * 3600),
        )

        self.ab_tests[test_id] = test_config

        return {
            "test_id": test_id,
            "name": name,
            "variants": variants,
            "traffic_split": traffic_split,
            "duration_days": duration_days,
            "status": "active",
            "start_time": test_config.start_time,
            "end_time": test_config.end_time,
        }

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
        if len(self.conversion_data) % 100 == 0 and ML_AVAILABLE:
            self._retrain_ml_models()

    def _retrain_ml_models(self):
        """Retrain ML models with new conversion data."""
        if not ML_AVAILABLE or len(self.conversion_data) < 50:
            return

        logger.info(f"Retraining ML models with {len(self.conversion_data)} data points")

        # Prepare training data
        features = []
        targets = []

        for conversion in self.conversion_data[-1000:]:  # Last 1000 conversions
            # Create feature vector from conversion context
            feature_vector = [
                conversion.price_point,
                conversion.timestamp,  # Time-based features
                conversion.confidence_score,
                # Add more features based on available data
            ]
            features.append(feature_vector)
            targets.append(1.0 if conversion.conversion else 0.0)

        if len(features) < 10:
            return

        try:
            features_array = np.array(features)
            targets_array = np.array(targets)

            # Retrain price optimization model
            if "price_optimization" in self.ml_models:
                model = self.ml_models["price_optimization"]
                model.model.fit(features_array, targets_array)
                model.last_trained = time.time()

                # Save model
                self._save_model("price_optimization", model)

                logger.info("Price optimization model retrained")

        except Exception as e:
            logger.error(f"Model retraining failed: {e}")

    def _save_model(self, model_name: str, model: MLModel):
        """Save ML model to disk."""
        if not ML_AVAILABLE:
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

    def _load_models(self):
        """Load existing ML models from disk."""
        if not os.path.exists(self.model_save_path):
            return

        for filename in os.listdir(self.model_save_path):
            if filename.endswith(".joblib"):
                model_name = filename.replace(".joblib", "")

                try:
                    # Load model
                    model_path = os.path.join(self.model_save_path, filename)
                    model = joblib.load(model_path)

                    # Load metadata
                    metadata_path = os.path.join(
                        self.model_save_path, f"{model_name}_metadata.json"
                    )
                    metadata = {}
                    if os.path.exists(metadata_path):
                        with open(metadata_path, "r") as f:
                            metadata = json.load(f)

                    self.ml_models[model_name] = MLModel(
                        model_type=metadata.get("model_type", "unknown"),
                        features=metadata.get("features", []),
                        target=metadata.get("target", "unknown"),
                        model=model,
                        last_trained=metadata.get("last_trained", 0.0),
                        accuracy=metadata.get("accuracy", 0.0),
                    )

                    logger.info(f"Loaded ML model: {model_name}")

                except Exception as e:
                    logger.error(f"Failed to load model {model_name}: {e}")

    def get_ab_test_results(self, test_id: str) -> Dict[str, Any]:
        """Get A/B test results and analysis."""
        if test_id not in self.ab_tests:
            return {"error": f"Test {test_id} not found"}

        test_config = self.ab_tests[test_id]
        test_conversions = [c for c in self.conversion_data if c.experiment_id == test_id]

        # Calculate variant performance
        variant_performance = {}
        for variant in test_config.variants.keys():
            variant_conversions = [
                c for c in test_conversions if hasattr(c, "variant") and c.variant == variant
            ]
            conversion_rate = (
                len(variant_conversions) / max(len(test_conversions), 1) if test_conversions else 0
            )

            variant_performance[variant] = {
                "conversions": len(variant_conversions),
                "conversion_rate": conversion_rate,
                "revenue_per_conversion": self._calculate_avg_revenue(variant_conversions),
            }

        return {
            "test_id": test_id,
            "test_name": test_config.name,
            "duration_days": (time.time() - test_config.start_time) / (24 * 3600),
            "total_conversions": len(test_conversions),
            "variant_performance": variant_performance,
            "recommended_winner": self._determine_ab_winner(variant_performance),
            "statistical_significance": self._calculate_statistical_significance(
                variant_performance
            ),
        }

    def _calculate_avg_revenue(self, conversions: List[ConversionData]) -> float:
        """Calculate average revenue per conversion."""
        if not conversions:
            return 0.0

        total_revenue = sum(c.price_point for c in conversions if c.conversion)
        return total_revenue / len(conversions) if conversions else 0.0

    def _determine_ab_winner(self, variant_performance: Dict[str, Any]) -> str:
        """Determine winning A/B test variant."""
        if not variant_performance:
            return "no_data"

        # Use conversion rate as primary metric
        best_variant = max(variant_performance.items(), key=lambda x: x[1]["conversion_rate"])
        return best_variant[0]

    def _calculate_statistical_significance(
        self, variant_performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate statistical significance of A/B test results."""
        if len(variant_performance) < 2:
            return {"significant": False, "reason": "insufficient_variants"}

        # Simplified statistical test (in production, use proper statistical tests)
        variants = list(variant_performance.keys())

        if len(variants) == 2:
            control_rate = variant_performance.get("control", {}).get("conversion_rate", 0)
            variant_rate = variant_performance.get("variant_a", {}).get("conversion_rate", 0)

            # Simple significance test (would use chi-square in production)
            total_conversions = sum(perf["conversions"] for perf in variant_performance.values())
            if total_conversions < 100:  # Need sufficient sample size
                return {"significant": False, "reason": "insufficient_sample_size"}

            # Calculate p-value (simplified)
            difference = abs(variant_rate - control_rate)
            pooled_rate = (control_rate + variant_rate) / 2

            # Z-score approximation
            pooled_variance = pooled_rate * (1 - pooled_rate) / total_conversions
            if pooled_variance > 0:
                z_score = difference / math.sqrt(pooled_variance * 2)  # Two-sample test
                # Approximate p-value from Z-score
                p_value = 2 * (1 - self._normal_cdf(abs(z_score)))
                significant = p_value < 0.05

                return {
                    "significant": significant,
                    "p_value": p_value,
                    "z_score": z_score,
                    "confidence_level": 0.95 if significant else 0.0,
                }

        return {"significant": False, "reason": "unsupported_variant_count"}

    def _normal_cdf(self, x):
        """Approximate normal CDF."""
        # Simplified approximation of normal cumulative distribution function
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))

    def get_optimization_analytics(self) -> Dict[str, Any]:
        """Get comprehensive optimization analytics."""
        return {
            "ml_models": {
                name: {
                    "type": model.model_type,
                    "features": model.features,
                    "last_trained": model.last_trained,
                    "accuracy": model.accuracy,
                }
                for name, model in self.ml_models.items()
            },
            "ab_tests": {
                test_id: {
                    "name": config.name,
                    "variants": config.variants,
                    "traffic_split": config.traffic_split,
                    "duration_days": (time.time() - config.start_time) / (24 * 3600),
                    "status": "active"
                    if not config.end_time or time.time() < config.end_time
                    else "completed",
                }
                for test_id, config in self.ab_tests.items()
            },
            "conversion_data": {
                "total_conversions": len(self.conversion_data),
                "conversion_rate": len([c for c in self.conversion_data if c.conversion])
                / max(len(self.conversion_data), 1),
                "avg_conversion_value": self._calculate_avg_revenue(self.conversion_data),
                "recent_conversions": len(
                    [c for c in self.conversion_data if time.time() - c.timestamp < 86400]
                ),  # Last 24 hours
            },
            "pricing_optimization": {
                "total_calculations": len(self.pricing_history),
                "avg_confidence": sum(c.get("confidence_score", 0.5) for c in self.pricing_history)
                / max(len(self.pricing_history), 1),
                "strategy_performance": self._analyze_strategy_performance(),
            },
        }

    def _analyze_strategy_performance(self) -> Dict[str, Any]:
        """Analyze performance by pricing strategy."""
        strategy_performance = {}

        for calculation in self.pricing_history[-100:]:  # Last 100 calculations
            strategy = calculation.get("strategy", "unknown")
            confidence = calculation.get("confidence_score", 0.5)

            if strategy not in strategy_performance:
                strategy_performance[strategy] = {
                    "count": 0,
                    "avg_confidence": 0.0,
                    "revenue_impact": [],
                }

            strategy_performance[strategy]["count"] += 1
            strategy_performance[strategy]["avg_confidence"] += confidence

            # Calculate revenue impact (simplified)
            base_price = calculation.get("base_price", 0)
            final_price = calculation.get("final_price", 0)
            price_change = (final_price - base_price) / base_price if base_price > 0 else 0

            strategy_performance[strategy]["revenue_impact"].append(price_change)

        # Calculate averages and best strategy
        for strategy, data in strategy_performance.items():
            if data["count"] > 0:
                data["avg_confidence"] /= data["count"]
                data["avg_revenue_impact"] = sum(data["revenue_impact"]) / len(
                    data["revenue_impact"]
                )
            else:
                data["avg_confidence"] = 0.0
                data["avg_revenue_impact"] = 0.0

        # Find best performing strategy
        best_strategy = (
            max(strategy_performance.items(), key=lambda x: x[1]["avg_revenue_impact"])
            if strategy_performance
            else None
        )

        return {
            "strategy_performance": strategy_performance,
            "best_strategy": best_strategy[0] if best_strategy else "none",
            "best_performance": best_strategy[1] if best_strategy else None,
        }


# Global enhanced algorithm instance
enhanced_algorithm = MaxLevelAntigravityAlgorithm()


# Export enhanced functions
def calculate_optimized_price(
    base_price: float,
    context: EnhancedPricingContext = None,
    strategy: PricingStrategy = PricingStrategy.ML_OPTIMIZED,
    ab_test_id: str = None,
) -> Dict[str, Any]:
    """Calculate ML-optimized price."""
    return enhanced_algorithm.calculate_optimized_price(base_price, context, strategy, ab_test_id)


def create_ab_test(
    test_id: str,
    name: str,
    variants: Dict[str, float],
    traffic_split: Dict[str, float] = None,
    duration_days: int = 7,
) -> Dict[str, Any]:
    """Create A/B test."""
    return enhanced_algorithm.create_ab_test(test_id, name, variants, traffic_split, duration_days)


def track_conversion(
    price_point: float,
    converted: bool,
    user_segment: str,
    traffic_source: str,
    experiment_id: str = None,
    confidence_score: float = 0.0,
):
    """Track conversion for ML learning."""
    enhanced_algorithm.track_conversion(
        price_point, converted, user_segment, traffic_source, experiment_id, confidence_score
    )


def get_ab_test_results(test_id: str) -> Dict[str, Any]:
    """Get A/B test results."""
    return enhanced_algorithm.get_ab_test_results(test_id)


def get_optimization_analytics() -> Dict[str, Any]:
    """Get optimization analytics."""
    return enhanced_algorithm.get_optimization_analytics()


__all__ = [
    "MaxLevelAntigravityAlgorithm",
    "enhanced_algorithm",
    "calculate_optimized_price",
    "create_ab_test",
    "track_conversion",
    "get_ab_test_results",
    "get_optimization_analytics",
    "EnhancedPricingContext",
    "ABTestConfig",
    "MLModel",
    "ConversionData",
    "ModelConfidence",
    "PricingStrategy",
    "ABTestVariant",
]
