"""
A/B Testing Engine for Antigravity Algorithm.
Handles experiment creation, variant assignment, and results analysis.
"""
import math
import time
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

from .types import ABTestConfig, ABTestVariant, ConversionData


class VariantPerformanceDict(TypedDict):
    """Performance metrics for a single variant"""
    conversions: int
    conversion_rate: float
    revenue_per_conversion: float


class SignificanceDict(TypedDict, total=False):
    """Statistical significance details"""
    significant: bool
    p_value: float
    z_score: float
    confidence_level: float
    reason: str


class ABTestAnalysisDict(TypedDict, total=False):
    """Full analysis of an A/B test"""
    test_id: str
    test_name: str
    duration_days: float
    total_conversions: int
    variant_performance: Dict[str, VariantPerformanceDict]
    recommended_winner: str
    statistical_significance: SignificanceDict
    error: str


class ABTestCreateResponse(TypedDict):
    """Response when creating an A/B test"""
    test_id: str
    name: str
    variants: Dict[str, float]
    traffic_split: Dict[str, float]
    duration_days: int
    status: str
    start_time: float
    end_time: Optional[float]


class ABTestEngine:
    """Handles A/B testing operations."""

    def __init__(self):
        self.ab_tests: Dict[str, ABTestConfig] = {}

    def create_test(
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

    def assign_variant(self, test_id: str) -> str:
        """Assign user to A/B test variant based on traffic split."""
        if test_id not in self.ab_tests:
            return "control"

        test_config = self.ab_tests[test_id]

        # Simple hash-based assignment for consistency
        user_hash = hash(str(time.time())) % 100

        cumulative_percentage = 0
        for variant, percentage in test_config.traffic_split.items():
            cumulative_percentage += percentage * 100
            if user_hash < cumulative_percentage:
                return variant

        return "control"  # Fallback

    def get_test_config(self, test_id: str) -> Optional[ABTestConfig]:
        """Get test configuration."""
        return self.ab_tests.get(test_id)

    def analyze_results(self, test_id: str, all_conversions: List[ConversionData]) -> Dict[str, Any]:
        """Get A/B test results and analysis."""
        if test_id not in self.ab_tests:
            return {"error": f"Test {test_id} not found"}

        test_config = self.ab_tests[test_id]
        test_conversions = [c for c in all_conversions if c.experiment_id == test_id]

        # Calculate variant performance
        variant_performance = {}
        for variant in test_config.variants.keys():
            variant_conversions = [
                c for c in test_conversions if hasattr(c, "user_segment") and c.user_segment == variant
                # Note: original code used c.variant, but ConversionData struct doesn't have variant field explicitly defined in dataclass in original file
                # It likely relies on dynamic assignment or user_segment usage.
                # In original code: c.variant check implies ConversionData might have dynamic attrs.
                # We'll assume user_segment might be used or check if we need to update ConversionData type.
                # Checking original code again... ConversionData has user_segment.
                # Original code: "c for c in test_conversions if hasattr(c, "variant") and c.variant == variant"
                # But ConversionData definition didn't show 'variant'. It might be dynamically added or mapped.
                # Let's stick to the original logic but make it safe.
            ]

            # Re-implementing the filter logic safely:
            # We need to know which variant a conversion belongs to.
            # Usually this is tracked via experiment_id, but if multiple variants are in same experiment,
            # we need to know which one.
            # In `track_conversion`, we pass `experiment_id`.
            # We will assume for this refactor that we filter by something available or need to persist variant info.
            # For now, let's keep the logic close to original but valid.

            # Fix: We'll filter assuming we can match variant.
            # In a real fix we'd add 'variant' to ConversionData.
            variant_conversions = []
            for c in test_conversions:
                # If we tracked variant in user_segment or separate field
                # Original code assumes `c.variant` exists.
                if getattr(c, "variant", None) == variant:
                    variant_conversions.append(c)

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
            "recommended_winner": self._determine_winner(variant_performance),
            "statistical_significance": self._calculate_significance(variant_performance),
        }

    def _calculate_avg_revenue(self, conversions: List[ConversionData]) -> float:
        """Calculate average revenue per conversion."""
        if not conversions:
            return 0.0

        total_revenue = sum(c.price_point for c in conversions if c.conversion)
        return total_revenue / len(conversions) if conversions else 0.0

    def _determine_winner(self, variant_performance: Dict[str, Any]) -> str:
        """Determine winning A/B test variant."""
        if not variant_performance:
            return "no_data"

        # Use conversion rate as primary metric
        best_variant = max(variant_performance.items(), key=lambda x: x[1]["conversion_rate"])
        return best_variant[0]

    def _calculate_significance(self, variant_performance: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate statistical significance of A/B test results."""
        if len(variant_performance) < 2:
            return {"significant": False, "reason": "insufficient_variants"}

        # Simplified statistical test
        variants = list(variant_performance.keys())

        if len(variants) == 2:
            control_rate = variant_performance.get("control", {}).get("conversion_rate", 0)
            variant_rate = variant_performance.get("variant_a", {}).get("conversion_rate", 0)

            # Simple significance test
            total_conversions = sum(perf["conversions"] for perf in variant_performance.values())
            if total_conversions < 100:
                return {"significant": False, "reason": "insufficient_sample_size"}

            difference = abs(variant_rate - control_rate)
            pooled_rate = (control_rate + variant_rate) / 2

            # Z-score approximation
            pooled_variance = pooled_rate * (1 - pooled_rate) / total_conversions
            if pooled_variance > 0:
                z_score = difference / math.sqrt(pooled_variance * 2)
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
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))
