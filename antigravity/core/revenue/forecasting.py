"""
Revenue Forecasting Logic.
"""
from datetime import datetime, timedelta
from typing import List

from ..config import DEFAULT_GROWTH_RATE
from ..models.invoice import Forecast


class RevenueForecasting:
    """Calculates future revenue projections."""

    def forecast_growth(self, current_mrr: float, months: int = 6) -> List[Forecast]:
        """Projects future revenue based on current MRR and default growth rates."""
        forecasts = []
        current = datetime.now()

        for i in range(1, months + 1):
            target_date = current + timedelta(days=30 * i)
            # Compounding growth formula
            projected = current_mrr * ((1 + DEFAULT_GROWTH_RATE) ** i)
            forecasts.append(Forecast(month=target_date.strftime("%Y-%m"), projected=projected))

        return forecasts
