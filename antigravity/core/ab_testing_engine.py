"""
AB Testing Engine - Backward Compatibility Facade
===================================================

This module provides backward compatibility for code importing from
`antigravity.core.ab_testing_engine`. All functionality has been moved
to the modular `antigravity.core.ab_testing` package.

Usage (preferred):
    from antigravity.core.ab_testing import create_multivariate_test

Usage (legacy, still supported):
    from antigravity.core.ab_testing_engine import create_multivariate_test
"""

# Re-export everything from the modular ab_testing package
from antigravity.core.ab_testing import (
    ABVariant,
    # Classes
    AdvancedABTestEngine,
    AllocationStrategy,
    EarlyWinnerPredictor,
    ExperimentManager,
    StatisticalAnalyzer,
    StatisticalTest,
    # Enums
    TestResult,
    TrafficAllocator,
    advanced_ab_engine,
    calculate_final_metrics,
    # Functions
    create_multivariate_test,
    generate_active_tests_summary,
    generate_test_analytics,
    get_active_tests_summary,
    get_test_analytics,
    update_test_metrics,
)

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
    # Functions
    "create_multivariate_test",
    "update_test_metrics",
    "get_test_analytics",
    "get_active_tests_summary",
    "calculate_final_metrics",
    "generate_test_analytics",
    "generate_active_tests_summary",
]
