"""
Revenue forecasting logic for Analytics.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List


def calculate_revenue_forecast(
    mrr_data: Dict[str, Any], months: int = 6
) -> List[Dict[str, Any]]:
    """Dự báo revenue dựa trên MRR hiện tại và growth."""
    current_mrr = mrr_data["mrr"]
    # Cap growth rate cho realistic forecast
    growth_rate = max(0.0, min(0.2, mrr_data["growth_percent"] / 100))

    forecasts = []
    now = datetime.now()

    for i in range(1, months + 1):
        # Apply growth rate
        projected_mrr = current_mrr * ((1 + growth_rate) ** i)
        one_time_estimate = projected_mrr * 0.3  # Assume 30% của revenue là one-time

        forecasts.append(
            {
                "month": (now + timedelta(days=30 * i)).strftime("%B %Y"),
                "projected_mrr": projected_mrr,
                "projected_one_time": one_time_estimate,
                "projected_total": projected_mrr + one_time_estimate,
                "confidence": max(50, 95 - (i * 5)),
            }
        )

    return forecasts
