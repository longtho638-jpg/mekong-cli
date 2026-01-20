"""
AB Testing Engine - Core orchestration engine.

Advanced A/B testing with real-time statistical significance:
- Multivariate testing with adaptive traffic allocation
- Bayesian statistical analysis for faster results
- Early stopping with error control rates
- Real-time performance monitoring and adjustment
"""

import logging
import time
from typing import Any, Dict

from .analysis import StatisticalAnalyzer
from .experiments import ExperimentManager
from .models import STATISTICAL_LIBS_AVAILABLE, AllocationStrategy, StatisticalTest
from .reporting import (
    calculate_final_metrics,
    generate_active_tests_summary,
    generate_test_analytics,
)
from .time_utils import MIN_ANALYSIS_DAYS, seconds_to_days
from .traffic import TrafficAllocator

logger = logging.getLogger(__name__)


class AdvancedABTestEngine:
    """Advanced A/B testing engine with real-time statistics."""

    def __init__(self):
        self.active_tests: Dict[str, StatisticalTest] = {}
        self.completed_tests: Dict[str, StatisticalTest] = {}
        self.traffic_allocator = TrafficAllocator()
        self.statistical_analyzer = StatisticalAnalyzer()
        self.experiment_manager = ExperimentManager()

    def create_multivariate_test(
        self,
        test_id: str,
        name: str,
        variants: Dict[str, Dict[str, Any]],
        duration_days: int = 14,
        allocation_strategy: AllocationStrategy = AllocationStrategy.ADAPTIVE,
    ) -> StatisticalTest:
        """Create multivariate A/B test with advanced allocation."""
        test, variants_data = self.experiment_manager.create_test(
            test_id, name, variants, duration_days
        )

        self.active_tests[test_id] = test
        self.traffic_allocator.setup_test(test_id, variants_data, allocation_strategy)

        return test

    def update_test_metrics(
        self,
        test_id: str,
        variant_name: str,
        conversion: bool,
        revenue: float = 0.0,
        user_id: str = None,
    ) -> None:
        """Update test metrics and perform real-time analysis."""
        if test_id not in self.active_tests:
            logger.warning(f"Test {test_id} not found")
            return

        test = self.active_tests[test_id]

        # Update conversions and revenue
        if conversion:
            test.conversions[variant_name] += 1
        test.revenue[variant_name] += revenue
        test.sample_size += 1

        # Perform real-time statistical analysis
        self._perform_realtime_analysis(test)

        # Check early stopping conditions
        if self.experiment_manager.early_stopping_rules["early_stopping_enabled"]:
            if self.experiment_manager.check_early_stopping(test):
                self._early_stop_test(test, reason="Statistical significance achieved")

        logger.info(f"Updated metrics for test {test_id}, variant {variant_name}")

    def _perform_realtime_analysis(self, test: StatisticalTest) -> None:
        """Perform real-time statistical analysis."""
        days_elapsed = seconds_to_days(time.time() - test.start_time)

        if test.sample_size < 20 or days_elapsed < MIN_ANALYSIS_DAYS:
            return  # Need more data

        if STATISTICAL_LIBS_AVAILABLE:
            self.statistical_analyzer.perform_advanced_analysis(test)
        else:
            self.statistical_analyzer.perform_basic_analysis(test)

        # Update allocation strategy
        self.traffic_allocator.update_performance(test.test_id, test.conversions)

    def _early_stop_test(self, test: StatisticalTest, reason: str) -> None:
        """Early stop the test and declare winner."""
        test.end_time = time.time()
        test.test_result = self.experiment_manager.determine_early_winner(test)

        # Calculate final metrics
        final_metrics = calculate_final_metrics(test)

        # Move to completed tests
        self.completed_tests[test.test_id] = test
        del self.active_tests[test.test_id]

        logger.info(f"Early stopped test {test.test_id}: {reason}")
        logger.info(f"Final winner: {test.test_result}")
        logger.info(f"Final metrics: {final_metrics}")

    def get_test_analytics(self, test_id: str) -> Dict[str, Any]:
        """Get comprehensive test analytics."""
        if test_id in self.active_tests:
            test = self.active_tests[test_id]
            is_active = True
        elif test_id in self.completed_tests:
            test = self.completed_tests[test_id]
            is_active = False
        else:
            return {"error": f"Test {test_id} not found"}

        return generate_test_analytics(test, is_active, self.traffic_allocator)

    def get_active_tests_summary(self) -> Dict[str, Any]:
        """Get summary of all active tests."""
        return generate_active_tests_summary(self.active_tests, self.traffic_allocator)


# Global advanced A/B testing engine
advanced_ab_engine = AdvancedABTestEngine()


__all__ = ["AdvancedABTestEngine", "advanced_ab_engine"]
