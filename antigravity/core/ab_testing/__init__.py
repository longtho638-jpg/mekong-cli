"""
AB Testing Module - Advanced A/B testing with statistical significance.

This module provides a comprehensive A/B testing framework with:
- Multivariate testing with adaptive traffic allocation
- Bayesian and frequentist statistical analysis
- Early stopping with error control rates
- Real-time performance monitoring

Usage:
    from antigravity.core.ab_testing import (
        create_multivariate_test,
        update_test_metrics,
        get_test_analytics,
        get_active_tests_summary,
    )
"""

from .analysis import StatisticalAnalyzer
from .engine import AdvancedABTestEngine, advanced_ab_engine
from .experiments import EarlyWinnerPredictor, ExperimentManager
from .models import ABVariant, AllocationStrategy, StatisticalTest, TestResult
from .reporting import (
    calculate_final_metrics,
    generate_active_tests_summary,
    generate_test_analytics,
)
from .time_utils import (
    SECONDS_PER_DAY,
    SECONDS_PER_WEEK,
    is_early_stopped,
    seconds_to_days,
)
from .traffic import TrafficAllocator


# Convenience functions using global engine
def create_multivariate_test(
    test_id: str,
    name: str,
    variants: dict,
    duration_days: int = 14,
    allocation_strategy: AllocationStrategy = AllocationStrategy.ADAPTIVE,
) -> StatisticalTest:
    """Create advanced multivariate A/B test."""
    return advanced_ab_engine.create_multivariate_test(
        test_id, name, variants, duration_days, allocation_strategy
    )


def update_test_metrics(
    test_id: str,
    variant_name: str,
    conversion: bool,
    revenue: float = 0.0,
    user_id: str = None,
) -> None:
    """Update test metrics with real-time analysis."""
    advanced_ab_engine.update_test_metrics(test_id, variant_name, conversion, revenue, user_id)


def get_test_analytics(test_id: str) -> dict:
    """Get comprehensive test analytics."""
    return advanced_ab_engine.get_test_analytics(test_id)


def get_active_tests_summary() -> dict:
    """Get summary of all active tests."""
    return advanced_ab_engine.get_active_tests_summary()


__all__ = [
    # Classes
    "AdvancedABTestEngine",
    "advanced_ab_engine",
    "StatisticalTest",
    "ABVariant",
    "StatisticalAnalyzer",
    "TrafficAllocator",
    "ExperimentManager",
    "EarlyWinnerPredictor",
    # Enums
    "TestResult",
    "AllocationStrategy",
    # Time utilities
    "SECONDS_PER_DAY",
    "SECONDS_PER_WEEK",
    "seconds_to_days",
    "is_early_stopped",
    # Functions
    "create_multivariate_test",
    "update_test_metrics",
    "get_test_analytics",
    "get_active_tests_summary",
    "calculate_final_metrics",
    "generate_test_analytics",
    "generate_active_tests_summary",
]
