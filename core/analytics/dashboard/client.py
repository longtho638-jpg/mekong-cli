"""
Client analytics methods for the dashboard.
"""
from typing import Any, Dict, List

from .base import BaseAnalyticsDashboard


class ClientAnalytics(BaseAnalyticsDashboard):
    def get_client_overview(self) -> Dict[str, Any]:
        """Get client overview với caching."""
        cached_result = self.repository.get_cached_result("get_client_overview")
        if cached_result:
            return cached_result

        result = self.calculation_engine.calculate_client_overview(self.client_metrics)
        self.repository.cache_result("get_client_overview", result)
        return result

    def get_growth_trend(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get growth trend với caching."""
        cached_result = self.repository.get_cached_result("get_growth_trend", months=months)
        if cached_result:
            return cached_result

        result = self.calculation_engine.calculate_growth_trend(self.revenue_entries, months)
        self.repository.cache_result("get_growth_trend", result, months=months)
        return result

    def update_client_metrics(self, client_id: str, metrics) -> bool:
        """Update client metrics."""
        success = self.repository.update_client_metrics(client_id, metrics)
        if success:
            self.refresh_data()
        return success
