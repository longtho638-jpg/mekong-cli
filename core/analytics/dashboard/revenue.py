"""
Revenue analytics methods for the dashboard.
"""
from typing import Any, Dict, List

from .base import BaseAnalyticsDashboard
from .entities_proxy import MetricPeriod, RevenueEntry


class RevenueAnalytics(BaseAnalyticsDashboard):
    def get_revenue(self, period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        """Get revenue cho một khoảng thời gian với caching."""
        cached_result = self.repository.get_cached_result("get_revenue", period=period.value)
        if cached_result:
            return cached_result

        result = self.calculation_engine.calculate_period_revenue(self.revenue_entries, period)
        self.repository.cache_result("get_revenue", result, period=period.value)
        return result

    def get_mrr(self) -> Dict[str, Any]:
        """Get Monthly Recurring Revenue với caching."""
        cached_result = self.repository.get_cached_result("get_mrr")
        if cached_result:
            return cached_result

        result = self.calculation_engine.calculate_mrr(self.revenue_entries)
        self.repository.cache_result("get_mrr", result)
        return result

    def get_revenue_forecast(self, months: int = 6) -> List[Dict[str, Any]]:
        """Get revenue forecast với caching."""
        cached_result = self.repository.get_cached_result("get_forecast", months=months)
        if cached_result:
            return cached_result

        mrr_data = self.get_mrr()
        result = self.calculation_engine.calculate_revenue_forecast(mrr_data, months)
        self.repository.cache_result("get_forecast", result, months=months)
        return result

    def get_revenue_breakdown(self, period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        """Get revenue breakdown với caching."""
        cached_result = self.repository.get_cached_result("get_breakdown", period=period.value)
        if cached_result:
            return cached_result

        result = self.calculation_engine.calculate_revenue_breakdown(self.revenue_entries, period)
        self.repository.cache_result("get_breakdown", result, period=period.value)
        return result

    def add_revenue_entry(self, entry: RevenueEntry) -> bool:
        """Add revenue entry mới."""
        success = self.repository.add_revenue_entry(entry)
        if success:
            self.refresh_data()
        return success

    def identify_anomalies(self, threshold_multiplier: float = 2.0) -> List[Dict[str, Any]]:
        """Identify revenue anomalies."""
        return self.calculation_engine.identify_anomalies(
            self.revenue_entries, threshold_multiplier
        )
