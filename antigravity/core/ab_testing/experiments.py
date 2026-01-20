"""
AB Testing Experiments - Experiment management.

Handles experiment lifecycle:
- Test creation with multivariate support
- Metrics updates with real-time analysis
- Early stopping detection and execution
- Winner determination
"""

import logging
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional

from .models import (
    ABVariant,
    AllocationStrategy,
    STATISTICAL_LIBS_AVAILABLE,
    StatisticalTest,
    TestResult,
)

logger = logging.getLogger(__name__)


class EarlyWinnerPredictor:
    """Predicts early winners based on historical test patterns."""

    def __init__(self):
        self.historical_patterns: List[Dict[str, Any]] = []

    def train(self, historical_tests: List[StatisticalTest]) -> None:
        """Train on historical A/B test patterns."""
        for test in historical_tests:
            if test.test_result and test.conversions:
                pattern = {
                    "test_duration": (test.end_time or 0) - test.start_time,
                    "sample_size": test.sample_size,
                    "effect_size": test.effect_size,
                    "test_result": test.test_result,
                    "traffic_allocation": sum(test.conversions.values()),
                    "variant_performance": test.conversions,
                }
                self.historical_patterns.append(pattern)

    def predict_winner(
        self, current_test: StatisticalTest, days_elapsed: float
    ) -> Optional[str]:
        """Predict early winner based on patterns."""
        if not self.historical_patterns:
            return None

        similar_tests = []
        for pattern in self.historical_patterns:
            if (
                abs(pattern["effect_size"] - (current_test.effect_size or 0)) < 0.05
                and abs(pattern["test_duration"] - days_elapsed) < 2.0
            ):
                similar_tests.append(pattern)

        if not similar_tests:
            return None

        votes: Dict[TestResult, int] = defaultdict(int)
        for pattern in similar_tests:
            votes[pattern["test_result"]] += 1

        if not votes:
            return None

        winner = max(votes.items(), key=lambda x: x[1])
        return winner


class ExperimentManager:
    """Manages A/B test experiments lifecycle."""

    DEFAULT_EARLY_STOPPING_RULES = {
        "min_sample_size": 100,
        "max_error_rate": 0.05,
        "min_effect_size": 0.02,
        "early_stopping_enabled": True,
    }

    def __init__(self):
        self.early_stopping_rules = self.DEFAULT_EARLY_STOPPING_RULES.copy()
        self.early_winner_predictor: Optional[EarlyWinnerPredictor] = None

        if STATISTICAL_LIBS_AVAILABLE:
            self.early_winner_predictor = EarlyWinnerPredictor()

    def create_test(
        self,
        test_id: str,
        name: str,
        variants: Dict[str, Dict[str, Any]],
        duration_days: int = 14,
    ) -> tuple[StatisticalTest, Dict[str, ABVariant]]:
        """Create a new A/B test with variants."""
        variants_data = {}
        for variant_name, config in variants.items():
            variant_data = ABVariant(
                variant_id=f"{test_id}_{variant_name}",
                name=variant_name,
                config=config,
                traffic_allocation=config.get("traffic_allocation", 1.0 / len(variants)),
                conversion_rate=0.0,
                revenue_per_user=0.0,
                confidence_interval=None,
                statistical_significance=False,
                optimal_price=config.get("optimal_price"),
            )
            variants_data[variant_name] = variant_data

        test = StatisticalTest(
            test_id=test_id,
            name=name,
            hypothesis=f"Testing which variant maximizes conversion rate for test: {name}",
            alpha=0.05,
            power=0.8,
            test_statistic="conversion_rate",
            sample_size=0,
            conversions={variant_name: 0 for variant_name in variants.keys()},
            revenue={variant_name: 0.0 for variant_name in variants.keys()},
            start_time=time.time(),
            end_time=None,
            p_value=None,
            confidence_interval=None,
            test_result=None,
            effect_size=None,
            bayes_factor=None,
            variants=variants_data,
        )

        logger.info(f"Created multivariate A/B test: {test_id} with {len(variants)} variants")
        return test, variants_data

    def check_early_stopping(self, test: StatisticalTest) -> bool:
        """Check if test should be stopped early."""
        rules = self.early_stopping_rules

        if test.sample_size < rules["min_sample_size"]:
            return False

        if test.statistical_significance:
            return True

        if test.effect_size and test.effect_size > rules["min_effect_size"]:
            return True

        if test.sample_size > 100:
            min_conversions = min(test.conversions.values())
            max_conversions = max(test.conversions.values())

            if max_conversions > 10 * min_conversions and min_conversions / max_conversions < 0.1:
                return True

        return False

    def determine_early_winner(self, test: StatisticalTest) -> TestResult:
        """Determine early winner based on current data."""
        variants = list(test.conversions.keys())
        conversions = list(test.conversions.values())

        if not conversions or sum(conversions) == 0:
            return TestResult.INCONCLUSIVE

        best_variant_idx = 0

        if test.statistical_significance and STATISTICAL_LIBS_AVAILABLE:
            best_score = 0.0

            for i in range(len(variants)):
                variant_name = variants[i]
                variant_data = test.variants.get(variant_name)

                if variant_data and variant_data.confidence_interval:
                    ci_width = variant_data.confidence_interval[1] - variant_data.confidence_interval[0]
                    score = 1.0 / ci_width if ci_width > 0 else 0

                    if score > best_score:
                        best_score = score
                        best_variant_idx = i
        else:
            conversion_rates = [
                c / test.sample_size if test.sample_size > 0 else 0 for c in conversions
            ]
            if not conversion_rates:
                return TestResult.INCONCLUSIVE
            best_variant_idx = conversion_rates.index(max(conversion_rates))

        # Assume index 0 is control, others are variants
        # This handles multivariate tests correctly
        if best_variant_idx == 0:
            return TestResult.CONTROL_WINS
        else:
            return TestResult.VARIANT_WINS


__all__ = ["ExperimentManager", "EarlyWinnerPredictor"]
