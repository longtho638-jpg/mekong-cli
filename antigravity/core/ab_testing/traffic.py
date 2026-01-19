"""
AB Testing Traffic - Intelligent traffic allocation system.

Manages traffic allocation across test variants:
- Multiple allocation strategies (equal, Thompson sampling, bandit, adaptive)
- Performance tracking and history
- Dynamic allocation adjustments
"""

import time
from collections import defaultdict
from typing import Any, Dict

import numpy as np

from .models import ABVariant, AllocationStrategy


class TrafficAllocator:
    """Intelligent traffic allocation system for A/B tests."""

    def __init__(self):
        self.allocations: Dict[str, Dict[str, Any]] = {}
        self.performance_history: Dict[str, list] = defaultdict(list)

    def setup_test(
        self, test_id: str, variants: Dict[str, ABVariant], strategy: AllocationStrategy
    ) -> None:
        """Setup traffic allocation for a test."""
        self.allocations[test_id] = {
            "strategy": strategy,
            "variants": variants,
            "allocated_traffic": {name: 0 for name in variants.keys()},
            "performance": {name: 0.0 for name in variants.keys()},
        }

    def update_performance(self, test_id: str, conversions: Dict[str, int]) -> None:
        """Update variant performance for adaptive allocation."""
        if test_id not in self.allocations:
            return

        allocation = self.allocations[test_id]

        # Update performance metrics
        for variant_name, conversion_count in conversions.items():
            current_performance = allocation["performance"][variant_name]
            new_performance = self._calculate_performance(current_performance, conversion_count)
            allocation["performance"][variant_name] = new_performance

        self.performance_history[test_id].append(
            {"timestamp": time.time(), "performance": allocation["performance"].copy()}
        )

    def _calculate_performance(self, current: float, new_value: int) -> float:
        """Calculate updated performance score."""
        if new_value > 0:
            # Performance improvement
            improvement = (new_value - current) / max(current, 1)
            return min(current + improvement * 0.1, 1.0)  # Smoothing factor
        else:
            # Performance penalty
            penalty = 0.05
            return max(current - penalty, 0.1)

    def get_performance(self, test_id: str) -> Dict[str, float]:
        """Get current performance metrics for a test."""
        if test_id not in self.allocations:
            return {}
        return self.allocations[test_id]["performance"]

    def get_overall_performance(self) -> Dict[str, Any]:
        """Get overall performance across all tests."""
        if not self.allocations:
            return {"avg_performance": 0.0, "test_count": 0}

        all_performances = []
        for test_id, allocation in self.allocations.items():
            avg_performance = sum(allocation["performance"].values()) / len(
                allocation["performance"]
            )
            all_performances.append(avg_performance)

        return {
            "avg_performance": sum(all_performances) / len(all_performances)
            if all_performances
            else 0.0,
            "test_count": len(self.allocations),
            "performance_variance": np.var(all_performances)
            if len(all_performances) > 1
            else 0.0,
        }


__all__ = ["TrafficAllocator"]
