"""
Revenue forecasting logic.
"""
from typing import Any, Dict


def forecast_revenue_logic(
    period_days: int = 30, current_mrr: float = 0, growth_rate: float = 0.1
) -> Dict[str, Any]:
    """
    Forecast revenue for given period.
    """
    forecasted_mrr = current_mrr * (1 + growth_rate)
    forecasted_arr = forecasted_mrr * 12

    target_1m = 1_000_000
    gap = target_1m - forecasted_arr
    months_to_goal = (
        gap / (forecasted_mrr * growth_rate) if forecasted_mrr > 0 else float("inf")
    )

    return {
        "period_days": period_days,
        "current_mrr": current_mrr,
        "forecasted_mrr": round(forecasted_mrr, 2),
        "forecasted_arr": round(forecasted_arr, 2),
        "growth_rate": growth_rate,
        "target_1m": target_1m,
        "gap_to_1m": round(gap, 2),
        "months_to_1m": round(months_to_goal, 1) if months_to_goal != float("inf") else "∞",
        "on_track": gap <= 0,
    }
