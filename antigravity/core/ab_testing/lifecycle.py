"""
AB Testing Lifecycle - Early winner prediction and test lifecycle utilities.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional

from .models import StatisticalTest, TestResult


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
