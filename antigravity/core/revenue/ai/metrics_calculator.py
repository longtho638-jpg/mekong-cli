"""
Revenue AI - Metrics Calculator.
=================================

Revenue metrics calculation.
"""

import time
from typing import Dict, List

from ..models import ChurnPrediction, ChurnRisk, CustomerProfile, RevenueMetrics


class MetricsCalculator:
    """Revenue metrics calculation engine."""

    def calculate(
        self,
        customers: Dict[str, CustomerProfile],
        predictions: Dict[str, ChurnPrediction],
    ) -> RevenueMetrics:
        """Calculate current revenue metrics."""
        total_mrr = sum(c.mrr for c in customers.values())
        total_arr = total_mrr * 12

        # Count at-risk customers
        at_risk = sum(
            1
            for p in predictions.values()
            if p.risk in [ChurnRisk.CRITICAL, ChurnRisk.HIGH]
        )

        # Estimate churn rate from predictions
        high_risk_count = sum(1 for p in predictions.values() if p.probability > 0.5)
        churn_rate = high_risk_count / max(len(customers), 1)

        return RevenueMetrics(
            timestamp=time.time(),
            mrr=total_mrr,
            arr=total_arr,
            churn_rate=churn_rate,
            expansion_rate=0.05,  # Placeholder
            ltv=total_mrr * 24 if churn_rate < 0.1 else total_mrr * 12,
            cac=500,  # Placeholder
            customers_at_risk=at_risk,
        )
