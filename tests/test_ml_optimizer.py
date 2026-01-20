"""
Tests for ML Optimizer module (antigravity.core.ml).

Tests cover:
- Facade imports and exports
- MLOptimizer initialization
- Core optimization methods
- Global instance functionality
- Graceful handling of missing dependencies
"""

import pytest


class TestMLOptimizerFacadeImports:
    """Test that all expected exports are available from facade."""

    def test_main_class_import(self):
        """Verify MLOptimizer class is importable."""
        from antigravity.core.ml_optimizer import MLOptimizer

        assert MLOptimizer is not None

    def test_global_instance_import(self):
        """Verify global ml_optimizer instance is importable."""
        from antigravity.core.ml_optimizer import ml_optimizer

        assert ml_optimizer is not None

    def test_convenience_functions_import(self):
        """Verify convenience functions are importable."""
        from antigravity.core.ml_optimizer import (
            calculate_ai_optimized_price,
            create_advanced_ab_test,
            get_game_changing_analytics,
            update_game_changing_metrics,
        )

        assert calculate_ai_optimized_price is not None
        assert create_advanced_ab_test is not None
        assert update_game_changing_metrics is not None
        assert get_game_changing_analytics is not None

    def test_dataclasses_import(self):
        """Verify dataclasses are importable."""
        from antigravity.core.ml_optimizer import (
            ABTestAdvanced,
            GameChangingFeature,
            MLOptimizationResult,
            PricingMode,
        )

        assert MLOptimizationResult is not None
        assert ABTestAdvanced is not None
        assert GameChangingFeature is not None
        assert PricingMode is not None

    def test_availability_flags_import(self):
        """Verify availability flags are importable."""
        from antigravity.core.ml_optimizer import ML_AVAILABLE

        # Should be a boolean
        assert isinstance(ML_AVAILABLE, bool)

    def test_direct_ml_module_import(self):
        """Verify direct import from antigravity.core.ml works."""
        from antigravity.core.ml import MLOptimizer, ml_optimizer

        assert MLOptimizer is not None
        assert ml_optimizer is not None


class TestMLOptimizerInstantiation:
    """Test MLOptimizer instantiation."""

    def test_instantiation_succeeds(self):
        """Verify MLOptimizer can be instantiated."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()

        assert optimizer is not None

    def test_has_models_attribute(self):
        """Verify models attribute exists."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()

        assert hasattr(optimizer, "models")
        assert isinstance(optimizer.models, dict)

    def test_has_game_changing_metrics(self):
        """Verify game_changing_metrics attribute exists."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()

        assert hasattr(optimizer, "game_changing_metrics")
        assert isinstance(optimizer.game_changing_metrics, dict)

    def test_has_core_methods(self):
        """Verify core methods exist."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()

        assert hasattr(optimizer, "calculate_ai_optimized_price")
        assert hasattr(optimizer, "create_advanced_ab_test")
        assert hasattr(optimizer, "update_game_changing_metrics")
        assert hasattr(optimizer, "get_game_changing_analytics")


class TestMLOptimizerCoreMethods:
    """Test core MLOptimizer methods."""

    def test_calculate_ai_optimized_price_returns_result(self):
        """Verify calculate_ai_optimized_price returns MLOptimizationResult."""
        from antigravity.core.ml_optimizer import (
            MLOptimizationResult,
            MLOptimizer,
        )

        optimizer = MLOptimizer()
        base_price = 99.99
        features = {
            "demand_factor": 1.2,
            "scarcity_factor": 0.8,
            "viral_coefficient": 1.5,
        }

        result = optimizer.calculate_ai_optimized_price(base_price, features)

        assert isinstance(result, MLOptimizationResult)

    def test_optimal_price_is_positive(self):
        """Verify optimal price is positive."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()
        result = optimizer.calculate_ai_optimized_price(99.99, {"demand_factor": 1.0})

        assert result.optimal_price > 0

    def test_confidence_score_in_valid_range(self):
        """Verify confidence score is between 0 and 1."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()
        result = optimizer.calculate_ai_optimized_price(99.99, {"demand_factor": 1.0})

        assert 0 <= result.confidence_score <= 1

    def test_strategy_used_is_string(self):
        """Verify strategy_used is a non-empty string."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()
        result = optimizer.calculate_ai_optimized_price(99.99, {"demand_factor": 1.0})

        assert isinstance(result.strategy_used, str)
        assert len(result.strategy_used) > 0

    def test_optimization_features_is_list(self):
        """Verify optimization_features is a list."""
        from antigravity.core.ml_optimizer import MLOptimizer

        optimizer = MLOptimizer()
        result = optimizer.calculate_ai_optimized_price(99.99, {"demand_factor": 1.0})

        assert isinstance(result.optimization_features, list)


class TestMLOptimizerGlobalInstance:
    """Test global ml_optimizer instance and convenience functions."""

    def test_global_instance_is_mloptimizer(self):
        """Verify global instance is MLOptimizer type."""
        from antigravity.core.ml_optimizer import MLOptimizer, ml_optimizer

        assert isinstance(ml_optimizer, MLOptimizer)

    def test_get_game_changing_analytics_returns_dict(self):
        """Verify get_game_changing_analytics returns dict."""
        from antigravity.core.ml_optimizer import get_game_changing_analytics

        analytics = get_game_changing_analytics()

        assert isinstance(analytics, dict)

    def test_analytics_has_required_keys(self):
        """Verify analytics dict has required keys."""
        from antigravity.core.ml_optimizer import get_game_changing_analytics

        analytics = get_game_changing_analytics()

        assert "game_changing_features" in analytics
        assert "performance_score" in analytics
        assert "timestamp" in analytics

    def test_convenience_function_calculate_price(self):
        """Verify convenience function delegates to global instance."""
        from antigravity.core.ml_optimizer import (
            MLOptimizationResult,
            calculate_ai_optimized_price,
        )

        result = calculate_ai_optimized_price(50.0, {"demand": 1.0})

        assert isinstance(result, MLOptimizationResult)


class TestMLOptimizerMissingDependencies:
    """Test graceful handling when ML dependencies are missing."""

    def test_works_without_sklearn(self):
        """Verify optimizer works even if sklearn unavailable."""
        from antigravity.core.ml_optimizer import (
            ML_AVAILABLE,
            MLOptimizer,
        )

        optimizer = MLOptimizer()
        result = optimizer.calculate_ai_optimized_price(99.99, {"demand": 1.0})

        # Should still return valid result regardless of ML_AVAILABLE
        assert result.optimal_price > 0
        assert result.confidence_score >= 0

    def test_fallback_strategy_when_no_ml(self):
        """Verify fallback strategy is used when ML unavailable."""
        from antigravity.core.ml_optimizer import ML_AVAILABLE, MLOptimizer

        if not ML_AVAILABLE:
            optimizer = MLOptimizer()
            result = optimizer.calculate_ai_optimized_price(99.99, {"demand": 1.0})

            # Should use a fallback strategy
            assert "fallback" in result.strategy_used or "statistical" in result.strategy_used


class TestMLOptimizerEnums:
    """Test enum values and behavior."""

    def test_pricing_mode_values(self):
        """Verify PricingMode enum has expected values."""
        from antigravity.core.ml_optimizer import PricingMode

        assert PricingMode.QUANTUM_INSPIRED.value == "quantum"
        assert PricingMode.AI_AGENT.value == "ai_agent"
        assert PricingMode.NEURAL_NETWORK.value == "neural_network"

    def test_game_changing_feature_values(self):
        """Verify GameChangingFeature enum has expected values."""
        from antigravity.core.ml_optimizer import GameChangingFeature

        assert GameChangingFeature.VIRAL_EXPANSION.value == "viral_expansion"
        assert GameChangingFeature.QUANTUM_PRICING.value == "quantum_pricing"
        assert GameChangingFeature.AI_AGENTS.value == "ai_agents"


class TestMLOptimizerUpdateMetrics:
    """Test metrics update functionality."""

    def test_update_game_changing_metrics_viral(self):
        """Verify viral expansion metrics can be updated."""
        from antigravity.core.ml_optimizer import (
            GameChangingFeature,
            MLOptimizer,
        )

        optimizer = MLOptimizer()
        initial_value = optimizer.game_changing_metrics["viral_multiplier_achieved"]

        optimizer.update_game_changing_metrics(GameChangingFeature.VIRAL_EXPANSION, 1.5)

        assert (
            optimizer.game_changing_metrics["viral_multiplier_achieved"]
            == initial_value + 1.5
        )

    def test_update_game_changing_metrics_quantum(self):
        """Verify quantum optimization metrics can be updated."""
        from antigravity.core.ml_optimizer import (
            GameChangingFeature,
            MLOptimizer,
        )

        optimizer = MLOptimizer()
        initial_value = optimizer.game_changing_metrics["quantum_optimizations"]

        optimizer.update_game_changing_metrics(GameChangingFeature.QUANTUM_PRICING, 1)

        assert (
            optimizer.game_changing_metrics["quantum_optimizations"]
            == initial_value + 1
        )

    def test_update_increments_total_predictions(self):
        """Verify total_ml_predictions is incremented on update."""
        from antigravity.core.ml_optimizer import (
            GameChangingFeature,
            MLOptimizer,
        )

        optimizer = MLOptimizer()
        initial_value = optimizer.game_changing_metrics["total_ml_predictions"]

        optimizer.update_game_changing_metrics(GameChangingFeature.AI_AGENTS, 1)

        assert (
            optimizer.game_changing_metrics["total_ml_predictions"]
            == initial_value + 1
        )
