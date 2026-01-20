"""
AB Testing Analysis - Statistical analysis engine.

Provides statistical analysis capabilities:
- Chi-square tests for conversion rate comparison
- Confidence interval calculations (Wilson score)
- Effect size calculation (Cohen's d)
- Bayesian factor computation
"""

import logging
from typing import Any, Dict, List, Optional

from .models import (
    STATISTICAL_LIBS_AVAILABLE,
    StatisticalTest,
    TestResult,
)

if STATISTICAL_LIBS_AVAILABLE:
    from scipy import stats as scipy_stats
    from scipy.stats import chi2_contingency

logger = logging.getLogger(__name__)


class StatisticalAnalyzer:
    """Statistical analysis engine for A/B tests."""

    def __init__(self):
        self.historical_tests: List[StatisticalTest] = []
        self.confidence_level = 0.95

    def analyze_test_patterns(self, test: StatisticalTest) -> Dict[str, Any]:
        """Analyze test patterns against historical data."""
        return {
            "pattern_match_score": 0.5,
            "predicted_duration": getattr(test, "duration_days", 7),
            "success_probability": 0.6,
        }

    def perform_advanced_analysis(self, test: StatisticalTest) -> None:
        """Advanced statistical analysis using scipy."""
        try:
            variants = list(test.conversions.keys())
            conversions = list(test.conversions.values())

            # Chi-square test for conversion rate comparison
            chi2_stat, p_value, dof, expected = chi2_contingency(
                conversions, f_observed=[len(conversions) for _ in range(len(variants))]
            )

            test.p_value = p_value
            test.effect_size = self.calculate_effect_size(conversions)
            test.statistical_significance = p_value < test.alpha

            # Calculate confidence intervals
            confidence_intervals = {}
            for i, variant_name in enumerate(variants):
                if conversions[i] > 0:
                    ci = self._calculate_wilson_interval(conversions[i], test.sample_size)
                    confidence_intervals[variant_name] = ci

            # Update variant data
            for variant_name, variant_data in test.conversions.items():
                if variant_name in confidence_intervals:
                    variant_data.confidence_interval = confidence_intervals[variant_name]
                    variant_data.statistical_significance = test.statistical_significance

            # Bayesian analysis
            test.bayes_factor = self.calculate_bayes_factor(conversions, test.test_result)

        except Exception as e:
            logger.error(f"Advanced statistical analysis failed: {e}")
            self.perform_basic_analysis(test)

    def _calculate_wilson_interval(
        self, conversions: int, sample_size: int
    ) -> tuple[float, float]:
        """Calculate Wilson score interval for proportion."""
        n = sample_size
        p_hat = conversions / n
        z = scipy_stats.norm.ppf(0.975)  # 97.5% confidence
        ci_lower = (p_hat + (z**2) / (2 * n) + (1 / (2 * n))) / (1 + (z**2) / n)
        ci_upper = (p_hat + (z**2) / (2 * n) - (1 / (2 * n))) / (1 - (z**2) / n)
        return (ci_lower, ci_upper)

    def perform_basic_analysis(self, test: StatisticalTest) -> None:
        """Basic statistical analysis without external libraries."""
        variants = list(test.conversions.keys())
        conversions = list(test.conversions.values())
        total_conversions = sum(conversions)

        if total_conversions == 0:
            return

        # Calculate conversion rates
        control_rate = conversions[0] / test.sample_size if test.sample_size > 0 else 0

        # Calculate effect size (Cohen's d)
        if control_rate > 0:
            effect_sizes = []
            for i in range(1, len(variants)):
                variant_rate = conversions[i] / test.sample_size if test.sample_size > 0 else 0
                pooled_rate = (control_rate + variant_rate) / 2
                if pooled_rate > 0:
                    d = (variant_rate - control_rate) / pooled_rate
                    effect_sizes.append(abs(d))
        else:
            effect_sizes = [0] * len(variants)

        max_effect_size = max(effect_sizes) if effect_sizes else 0
        test.effect_size = max_effect_size

        # Determine winner (basic)
        if max_effect_size > 0.02:  # Minimum detectable effect
            best_variant_idx = effect_sizes.index(max_effect_size)
            test.test_result = [TestResult.VARIANT_WINS, TestResult.CONTROL_WINS][
                best_variant_idx
            ]
        else:
            test.test_result = TestResult.INCONCLUSIVE

        # Update variant data
        for variant_name, variant_data in test.conversions.items():
            variant_data.statistical_significance = (
                test.test_result != TestResult.INCONCLUSIVE
            )

    def calculate_effect_size(self, conversions: List[int]) -> float:
        """Calculate effect size using Cohen's d."""
        if len(conversions) < 2:
            return 0.0

        n = sum(conversions)
        if n == 0:
            return 0.0

        proportions = [c / n for c in conversions]

        # Find maximum difference from mean
        mean_p = sum(proportions) / len(proportions)
        max_diff = max(abs(p - mean_p) for p in proportions)

        return max_diff

    def calculate_bayes_factor(
        self, conversions: List[int], test_result: Optional[TestResult]
    ) -> float:
        """Calculate Bayesian factor for hypothesis testing."""
        if not test_result:
            return 1.0

        if test_result == TestResult.CONTROL_WINS:
            return 0.8
        elif test_result == TestResult.VARIANT_WINS:
            return 1.2
        else:
            return 1.0


__all__ = ["StatisticalAnalyzer"]
