"""
Analytics Engine for Antigravity Algorithm.
Handles performance analysis and reporting.
"""
from typing import Any, Dict, List

from .types import ABTestConfig, ConversionData, MLModel


class AnalyticsEngine:
    """Handles analytics and reporting."""

    def analyze_strategy_performance(self, pricing_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance by pricing strategy."""
        strategy_performance = {}

        for calculation in pricing_history[-100:]:  # Last 100 calculations
            strategy = calculation.get("strategy", "unknown")
            confidence = calculation.get("confidence_score", 0.5)

            if strategy not in strategy_performance:
                strategy_performance[strategy] = {
                    "count": 0,
                    "avg_confidence": 0.0,
                    "revenue_impact": [],
                }

            strategy_performance[strategy]["count"] += 1
            strategy_performance[strategy]["avg_confidence"] += confidence

            # Calculate revenue impact (simplified)
            base_price = calculation.get("base_price", 0)
            final_price = calculation.get("final_price", 0)
            price_change = (final_price - base_price) / base_price if base_price > 0 else 0

            strategy_performance[strategy]["revenue_impact"].append(price_change)

        # Calculate averages and best strategy
        for strategy, data in strategy_performance.items():
            if data["count"] > 0:
                data["avg_confidence"] /= data["count"]
                data["avg_revenue_impact"] = sum(data["revenue_impact"]) / len(
                    data["revenue_impact"]
                )
            else:
                data["avg_confidence"] = 0.0
                data["avg_revenue_impact"] = 0.0

        # Find best performing strategy
        best_strategy = (
            max(strategy_performance.items(), key=lambda x: x[1]["avg_revenue_impact"])
            if strategy_performance
            else None
        )

        return {
            "strategy_performance": strategy_performance,
            "best_strategy": best_strategy[0] if best_strategy else "none",
            "best_performance": best_strategy[1] if best_strategy else None,
        }

    def calculate_avg_revenue(self, conversions: List[ConversionData]) -> float:
        """Calculate average revenue per conversion."""
        if not conversions:
            return 0.0

        total_revenue = sum(c.price_point for c in conversions if c.conversion)
        return total_revenue / len(conversions) if conversions else 0.0
