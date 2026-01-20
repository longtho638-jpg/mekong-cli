"""
Tests for antigravity.core.ab_testing module.

Tests the A/B testing engine including:
- Module imports (legacy and modular paths)
- Test creation with multivariate variants
- Metrics updates
- Analytics and summary generation
- Statistical models and enums
"""

from antigravity.core.ab_testing import (
    ABVariant,
    AdvancedABTestEngine,
    AllocationStrategy,
    StatisticalTest,
    TestResult,
    advanced_ab_engine,
    create_multivariate_test,
    get_active_tests_summary,
    get_test_analytics,
    update_test_metrics,
)

import pytest


class TestModuleImports:
    """Test that both import paths work correctly."""

    def test_legacy_import_path(self):
        """Verify legacy import path (ab_testing_engine) works."""
        from antigravity.core.ab_testing_engine import (
            ABVariant as LegacyABVariant,
        )
        from antigravity.core.ab_testing_engine import (
            AdvancedABTestEngine as LegacyEngine,
        )
        from antigravity.core.ab_testing_engine import (
            AllocationStrategy as LegacyAllocationStrategy,
        )
        from antigravity.core.ab_testing_engine import (
            StatisticalAnalyzer,
            TrafficAllocator,
        )
        from antigravity.core.ab_testing_engine import (
            StatisticalTest as LegacyStatisticalTest,
        )
        from antigravity.core.ab_testing_engine import (
            TestResult as LegacyTestResult,
        )
        from antigravity.core.ab_testing_engine import (
            advanced_ab_engine as legacy_engine,
        )
        from antigravity.core.ab_testing_engine import (
            create_multivariate_test as legacy_create,
        )
        from antigravity.core.ab_testing_engine import (
            get_active_tests_summary as legacy_summary,
        )
        from antigravity.core.ab_testing_engine import (
            get_test_analytics as legacy_analytics,
        )
        from antigravity.core.ab_testing_engine import (
            update_test_metrics as legacy_update,
        )

        assert LegacyEngine is not None
        assert legacy_engine is not None
        assert LegacyStatisticalTest is not None
        assert LegacyABVariant is not None
        assert StatisticalAnalyzer is not None
        assert TrafficAllocator is not None
        assert LegacyTestResult is not None
        assert LegacyAllocationStrategy is not None
        assert legacy_create is not None
        assert legacy_update is not None
        assert legacy_analytics is not None
        assert legacy_summary is not None

    def test_modular_import_path(self):
        """Verify modular import path (ab_testing) works."""
        from antigravity.core.ab_testing import (
            ABVariant as ModularABVariant,
        )
        from antigravity.core.ab_testing import (
            AdvancedABTestEngine as ModularEngine,
        )
        from antigravity.core.ab_testing import (
            AllocationStrategy as ModularAllocationStrategy,
        )
        from antigravity.core.ab_testing import (
            StatisticalAnalyzer,
            TrafficAllocator,
        )
        from antigravity.core.ab_testing import (
            StatisticalTest as ModularStatisticalTest,
        )
        from antigravity.core.ab_testing import (
            TestResult as ModularTestResult,
        )
        from antigravity.core.ab_testing import (
            advanced_ab_engine as modular_engine,
        )
        from antigravity.core.ab_testing import (
            create_multivariate_test as modular_create,
        )
        from antigravity.core.ab_testing import (
            get_active_tests_summary as modular_summary,
        )
        from antigravity.core.ab_testing import (
            get_test_analytics as modular_analytics,
        )
        from antigravity.core.ab_testing import (
            update_test_metrics as modular_update,
        )

        assert ModularEngine is not None
        assert modular_engine is not None
        assert ModularStatisticalTest is not None
        assert ModularABVariant is not None
        assert StatisticalAnalyzer is not None
        assert TrafficAllocator is not None
        assert ModularTestResult is not None
        assert ModularAllocationStrategy is not None
        assert modular_create is not None
        assert modular_update is not None
        assert modular_analytics is not None
        assert modular_summary is not None

    def test_import_paths_resolve_to_same_objects(self):
        """Verify both import paths resolve to the same objects."""
        from antigravity.core.ab_testing import AdvancedABTestEngine as ModularEngine
        from antigravity.core.ab_testing import advanced_ab_engine as modular_instance
        from antigravity.core.ab_testing_engine import AdvancedABTestEngine as LegacyEngine
        from antigravity.core.ab_testing_engine import advanced_ab_engine as legacy_instance

        assert LegacyEngine is ModularEngine
        assert legacy_instance is modular_instance


class TestEnums:
    """Test enum classes."""

    def test_test_result_enum_values(self):
        """TestResult enum has expected values."""
        assert hasattr(TestResult, "CONTROL_WINS")
        assert hasattr(TestResult, "VARIANT_WINS")
        assert hasattr(TestResult, "INCONCLUSIVE")
        assert hasattr(TestResult, "ERROR")
        assert hasattr(TestResult, "EARLY_STOP")

        assert TestResult.CONTROL_WINS.value == "control_wins"
        assert TestResult.VARIANT_WINS.value == "variant_wins"

    def test_allocation_strategy_enum_values(self):
        """AllocationStrategy enum has expected values."""
        assert hasattr(AllocationStrategy, "EQUAL_RANDOM")
        assert hasattr(AllocationStrategy, "THOMPSON_SAMPLING")
        assert hasattr(AllocationStrategy, "BANDIT")
        assert hasattr(AllocationStrategy, "ADAPTIVE")

        assert AllocationStrategy.ADAPTIVE.value == "adaptive"


class TestModels:
    """Test data model classes."""

    def test_ab_variant_creation(self):
        """ABVariant can be created with defaults."""
        variant = ABVariant(
            variant_id="test_variant",
            name="Test Variant",
            config={"color": "blue"},
        )

        assert variant.variant_id == "test_variant"
        assert variant.name == "Test Variant"
        assert variant.config == {"color": "blue"}
        assert variant.traffic_allocation == 0.0
        assert variant.conversion_rate == 0.0

    def test_statistical_test_creation(self):
        """StatisticalTest can be created with defaults."""
        test = StatisticalTest(
            test_id="test_123",
            name="Sample Test",
            hypothesis="Variant performs better than control",
        )

        assert test.test_id == "test_123"
        assert test.name == "Sample Test"
        assert test.alpha == 0.05
        assert test.power == 0.8
        assert test.conversions == {}
        assert test.revenue == {}


class TestABTestEngine:
    """Test AdvancedABTestEngine class."""

    @pytest.fixture
    def engine(self):
        """Create fresh engine for each test."""
        return AdvancedABTestEngine()

    def test_engine_initialization(self, engine):
        """Engine initializes with empty test dictionaries."""
        assert engine.active_tests == {}
        assert engine.completed_tests == {}
        assert engine.traffic_allocator is not None
        assert engine.statistical_analyzer is not None
        assert engine.experiment_manager is not None

    def test_create_multivariate_test(self, engine):
        """Can create multivariate A/B test."""
        test = engine.create_multivariate_test(
            test_id="test_mv_1",
            name="Multivariate Test",
            variants={
                "control": {"price": 100},
                "treatment_a": {"price": 110},
                "treatment_b": {"price": 120},
            },
        )

        assert test is not None
        assert test.test_id == "test_mv_1"
        assert test.name == "Multivariate Test"
        assert "test_mv_1" in engine.active_tests

    def test_update_test_metrics_conversion(self, engine):
        """Can update test metrics with conversion."""
        engine.create_multivariate_test(
            test_id="test_update_1",
            name="Update Test",
            variants={
                "control": {"button": "blue"},
                "treatment": {"button": "green"},
            },
        )

        engine.update_test_metrics(
            test_id="test_update_1",
            variant_name="control",
            conversion=True,
            revenue=50.0,
        )

        test = engine.active_tests["test_update_1"]
        assert test.conversions["control"] == 1
        assert test.revenue["control"] == 50.0
        assert test.sample_size == 1

    def test_update_test_metrics_no_conversion(self, engine):
        """Metrics update works without conversion."""
        engine.create_multivariate_test(
            test_id="test_update_2",
            name="Update Test",
            variants={
                "control": {"button": "blue"},
                "treatment": {"button": "green"},
            },
        )

        engine.update_test_metrics(
            test_id="test_update_2",
            variant_name="control",
            conversion=False,
            revenue=0.0,
        )

        test = engine.active_tests["test_update_2"]
        assert test.conversions["control"] == 0
        assert test.sample_size == 1

    def test_update_nonexistent_test_no_error(self, engine):
        """Updating nonexistent test logs warning but doesn't crash."""
        # Should not raise exception
        engine.update_test_metrics(
            test_id="nonexistent_test",
            variant_name="control",
            conversion=True,
        )

    def test_get_test_analytics_active_test(self, engine):
        """Can get analytics for active test."""
        engine.create_multivariate_test(
            test_id="test_analytics_1",
            name="Analytics Test",
            variants={
                "control": {"layout": "A"},
                "treatment": {"layout": "B"},
            },
        )

        analytics = engine.get_test_analytics("test_analytics_1")

        assert "error" not in analytics
        assert analytics.get("test_id") == "test_analytics_1"
        assert analytics.get("status") == "active"

    def test_get_test_analytics_not_found(self, engine):
        """Analytics for nonexistent test returns error."""
        analytics = engine.get_test_analytics("nonexistent_test")

        assert "error" in analytics

    def test_get_active_tests_summary(self, engine):
        """Can get summary of active tests."""
        engine.create_multivariate_test(
            test_id="test_summary_1",
            name="Summary Test 1",
            variants={"A": {}, "B": {}},
        )
        engine.create_multivariate_test(
            test_id="test_summary_2",
            name="Summary Test 2",
            variants={"X": {}, "Y": {}},
        )

        summary = engine.get_active_tests_summary()

        assert summary is not None
        assert summary.get("total_active_tests") == 2


class TestConvenienceFunctions:
    """Test module-level convenience functions."""

    def test_create_multivariate_test_function(self):
        """create_multivariate_test function works."""
        test = create_multivariate_test(
            test_id="func_test_1",
            name="Function Test",
            variants={
                "control": {"feature": False},
                "treatment": {"feature": True},
            },
        )

        assert test is not None
        assert test.test_id == "func_test_1"

    def test_update_test_metrics_function(self):
        """update_test_metrics function works."""
        create_multivariate_test(
            test_id="func_test_update",
            name="Function Update Test",
            variants={"A": {}, "B": {}},
        )

        # Should not raise exception
        update_test_metrics(
            test_id="func_test_update",
            variant_name="A",
            conversion=True,
            revenue=100.0,
        )

    def test_get_test_analytics_function(self):
        """get_test_analytics function works."""
        create_multivariate_test(
            test_id="func_test_analytics",
            name="Function Analytics Test",
            variants={"A": {}, "B": {}},
        )

        analytics = get_test_analytics("func_test_analytics")

        assert analytics is not None
        assert "error" not in analytics

    def test_get_active_tests_summary_function(self):
        """get_active_tests_summary function works."""
        summary = get_active_tests_summary()

        assert summary is not None
        assert "total_active_tests" in summary


class TestIntegration:
    """Integration tests for complete A/B testing workflows."""

    @pytest.fixture
    def fresh_engine(self):
        """Create a fresh engine instance for isolation."""
        return AdvancedABTestEngine()

    def test_complete_ab_test_workflow(self, fresh_engine):
        """Test complete A/B test lifecycle."""
        # 1. Create test
        test = fresh_engine.create_multivariate_test(
            test_id="workflow_test",
            name="Complete Workflow Test",
            variants={
                "control": {"price": 99},
                "treatment": {"price": 79},
            },
            duration_days=7,
            allocation_strategy=AllocationStrategy.ADAPTIVE,
        )

        assert test.test_id == "workflow_test"
        assert "workflow_test" in fresh_engine.active_tests

        # 2. Simulate traffic and conversions
        for i in range(10):
            fresh_engine.update_test_metrics(
                test_id="workflow_test",
                variant_name="control",
                conversion=(i % 3 == 0),
                revenue=99.0 if (i % 3 == 0) else 0.0,
            )
            fresh_engine.update_test_metrics(
                test_id="workflow_test",
                variant_name="treatment",
                conversion=(i % 2 == 0),
                revenue=79.0 if (i % 2 == 0) else 0.0,
            )

        # 3. Get analytics
        analytics = fresh_engine.get_test_analytics("workflow_test")
        assert analytics.get("test_id") == "workflow_test"
        assert analytics.get("sample_size") == 20

        # 4. Get summary
        summary = fresh_engine.get_active_tests_summary()
        assert summary.get("total_active_tests") >= 1

    def test_multiple_concurrent_tests(self, fresh_engine):
        """Can run multiple tests concurrently."""
        test_ids = ["concurrent_1", "concurrent_2", "concurrent_3"]

        for test_id in test_ids:
            fresh_engine.create_multivariate_test(
                test_id=test_id,
                name=f"Concurrent Test {test_id}",
                variants={"A": {"val": 1}, "B": {"val": 2}},
            )

        for test_id in test_ids:
            assert test_id in fresh_engine.active_tests

        summary = fresh_engine.get_active_tests_summary()
        assert summary.get("total_active_tests") == 3
