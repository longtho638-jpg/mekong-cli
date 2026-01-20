"""
AB Testing Reporting - Reports and analytics generation.

Provides comprehensive test reporting:
- Individual test analytics
- Active tests summary
- Final metrics calculation
"""

import time
from typing import Any, Dict

from .models import StatisticalTest, TestResult
from .time_utils import is_early_stopped, seconds_to_days
from .traffic import TrafficAllocator


def calculate_final_metrics(test: StatisticalTest) -> Dict[str, Any]:
    """Calculate final metrics for completed test."""
    total_conversions = sum(test.conversions.values())
    total_sample_size = test.sample_size
    total_revenue = sum(test.revenue.values())
    test_duration = (test.end_time or time.time()) - test.start_time

    # Winner metrics
    winner_variants = []
    if test.test_result:
        if isinstance(test.test_result, (list, tuple)):
            for result_type in test.test_result:
                if result_type in [TestResult.CONTROL_WINS, TestResult.VARIANT_WINS]:
                    winner_variants.append(result_type)
        elif test.test_result in [TestResult.CONTROL_WINS, TestResult.VARIANT_WINS]:
            winner_variants.append(test.test_result)

    return {
        "total_conversions": total_conversions,
        "total_sample_size": total_sample_size,
        "total_revenue": total_revenue,
        "test_duration_days": seconds_to_days(test_duration),
        "conversion_rate": total_conversions / total_sample_size if total_sample_size > 0 else 0,
        "revenue_per_user": total_revenue / total_sample_size if total_sample_size > 0 else 0.0,
        "winner": winner_variants[0] if winner_variants else None,
        "statistical_significance": test.statistical_significance,
        "effect_size": test.effect_size,
        "confidence_intervals": {
            variant: getattr(test.conversions.get(variant, {}), "confidence_interval", None)
            for variant in test.conversions.keys()
        },
        "early_stopped": is_early_stopped(test.start_time, test.end_time),
    }


def generate_test_analytics(
    test: StatisticalTest,
    is_active: bool,
    traffic_allocator: TrafficAllocator = None,
) -> Dict[str, Any]:
    """Generate comprehensive analytics for a test."""
    return {
        "test_id": test.test_id,
        "name": test.name,
        "status": "active" if is_active else "completed",
        "sample_size": test.sample_size,
        "conversions": test.conversions,
        "revenue": test.revenue,
        "conversion_rate": sum(test.conversions.values()) / test.sample_size
        if test.sample_size > 0
        else 0,
        "duration_days": seconds_to_days(time.time() - test.start_time),
        "statistical_significance": test.statistical_significance,
        "effect_size": test.effect_size,
        "test_result": test.test_result,
        "confidence_intervals": {
            variant: getattr(variant_data, "confidence_interval", None)
            for variant, variant_data in test.conversions.items()
            if hasattr(variant_data, "confidence_interval")
        },
        "p_value": test.p_value,
        "bayes_factor": test.bayes_factor,
        "traffic_allocation_performance": traffic_allocator.get_performance(test.test_id)
        if traffic_allocator
        else None,
        "early_stopped": is_early_stopped(test.start_time, test.end_time),
    }


def generate_active_tests_summary(
    active_tests: Dict[str, StatisticalTest],
    traffic_allocator: TrafficAllocator = None,
) -> Dict[str, Any]:
    """Generate summary of all active tests."""
    active_summary = {}
    for test_id, test in active_tests.items():
        active_summary[test_id] = {
            "name": test.name,
            "sample_size": test.sample_size,
            "conversions": test.conversions,
            "duration_days": seconds_to_days(time.time() - test.start_time),
            "statistical_significance": test.statistical_significance,
            "status": "active",
        }

    return {
        "total_active_tests": len(active_tests),
        "total_sample_size": sum(test.sample_size for test in active_tests.values()),
        "tests": active_summary,
        "performance_metrics": traffic_allocator.get_overall_performance()
        if traffic_allocator
        else None,
    }


__all__ = [
    "calculate_final_metrics",
    "generate_test_analytics",
    "generate_active_tests_summary",
]
