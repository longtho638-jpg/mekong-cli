"""
Analytics Calculation Engine (Facade)
"""
import logging
from typing import Any, Dict, List

from .calculations.anomalies import identify_anomalies
from .calculations.client import calculate_client_overview
from .calculations.forecast import calculate_revenue_forecast
from .calculations.revenue import calculate_mrr, calculate_period_revenue
from .calculations.trends import calculate_growth_trend, calculate_revenue_breakdown
from .models import ClientMetrics, MetricPeriod, RevenueEntry

logger = logging.getLogger(__name__)

class AnalyticsCalculationEngine:
    """
    Core calculation engine cho analytics.
    Modularized implementation delegating to specialized calculation modules.
    """

    def __init__(self):
        logger.info("Analytics calculation engine initialized")

    def calculate_period_revenue(self, revenue_entries: List[RevenueEntry], period: MetricPeriod) -> Dict[str, Any]:
        return calculate_period_revenue(revenue_entries, period)

    def calculate_mrr(self, revenue_entries: List[RevenueEntry]) -> Dict[str, Any]:
        return calculate_mrr(revenue_entries)

    def calculate_revenue_forecast(self, mrr_data: Dict[str, Any], months: int = 6) -> List[Dict[str, Any]]:
        return calculate_revenue_forecast(mrr_data, months)

    def calculate_client_overview(self, client_metrics: Dict[str, ClientMetrics]) -> Dict[str, Any]:
        return calculate_client_overview(client_metrics)

    def calculate_growth_trend(self, revenue_entries: List[RevenueEntry], months: int = 12) -> List[Dict[str, Any]]:
        return calculate_growth_trend(revenue_entries, months)

    def calculate_revenue_breakdown(self, revenue_entries: List[RevenueEntry], period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        return calculate_revenue_breakdown(revenue_entries, period)

    def identify_anomalies(self, revenue_entries: List[RevenueEntry], threshold_multiplier: float = 2.0) -> List[Dict[str, Any]]:
        return identify_anomalies(revenue_entries, threshold_multiplier)
