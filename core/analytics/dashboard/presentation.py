"""
Presentation and formatting logic for Analytics Dashboard.
"""
from typing import Any, Dict

from .client import ClientAnalytics
from .entities_proxy import MetricPeriod
from .revenue import RevenueAnalytics


class PresentationOps(RevenueAnalytics, ClientAnalytics):
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get comprehensive dashboard summary."""
        revenue_month = self.get_revenue(MetricPeriod.MONTH)
        mrr_data = self.get_mrr()
        client_overview = self.get_client_overview()
        forecast = self.get_revenue_forecast(3)

        return {
            "agency": self.agency_name,
            "generated_at": self.repository.get_data_summary()["cache_info"].get(
                "timestamp", "Unknown"
            ),
            "revenue": {
                "this_month": revenue_month["total"],
                "growth": revenue_month["growth_percent"],
                "mrr": mrr_data["mrr"],
                "arr": mrr_data["arr"],
            },
            "clients": {
                "total": client_overview.get("total_clients", 0),
                "at_risk": client_overview.get("at_risk_count", 0),
                "avg_ltv": client_overview.get("avg_lifetime_value", 0),
            },
            "forecast": {
                "next_month": forecast[0]["projected_total"] if forecast else 0,
                "quarter": sum(f["projected_total"] for f in forecast[:3]),
            },
            "health_indicators": {
                "revenue_trend": "🟢 Growing"
                if revenue_month["growth_percent"] > 0
                else "🔴 Declining",
                "client_health": "🟢 Healthy"
                if client_overview.get("avg_health_score", 0) >= 80
                else "🟡 Needs Attention",
                "forecast_confidence": "🟢 High"
                if forecast and forecast[0]["confidence"] >= 80
                else "🟡 Medium",
            },
        }

    def format_dashboard_text(self) -> str:
        dashboard_data = self.get_dashboard_summary()
        return self.presenter.format_dashboard_text(dashboard_data)

    def format_revenue_report(self, period: MetricPeriod = MetricPeriod.MONTH) -> str:
        revenue_data = self.get_revenue(period)
        return self.presenter.format_revenue_report(revenue_data)

    def format_mrr_report(self) -> str:
        mrr_data = self.get_mrr()
        return self.presenter.format_mrr_report(mrr_data)

    def format_client_overview(self) -> str:
        client_data = self.get_client_overview()
        return self.presenter.format_client_overview(client_data)

    def format_forecast_report(self, months: int = 6) -> str:
        forecasts = self.get_revenue_forecast(months)
        return self.presenter.format_forecast_report(forecasts)

    def format_anomaly_report(self, threshold_multiplier: float = 2.0) -> str:
        anomalies = self.identify_anomalies(threshold_multiplier)
        return self.presenter.format_anomaly_report(anomalies)

    def format_growth_trend(self, months: int = 12) -> str:
        trends = self.get_growth_trend(months)
        return self.presenter.format_growth_trend(trends)

    def format_revenue_breakdown(self, period: MetricPeriod = MetricPeriod.MONTH) -> str:
        breakdown = self.get_revenue_breakdown(period)
        return self.presenter.format_revenue_breakdown(breakdown)

    def get_performance_metrics(self) -> Dict[str, Any]:
        return self.repository.get_data_summary()

    def format_performance_metrics(self) -> str:
        metrics = self.get_performance_metrics()
        return self.presenter.format_performance_metrics(metrics)
