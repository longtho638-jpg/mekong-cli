"""
📊 Refactored Analytics Dashboard - Main Interface
==================================================

Main interface sử dụng refactored services với clean architecture.
"""

import logging
from typing import Dict, Any, List, Optional

try:
    from .services.analytics_service import (
        AnalyticsCalculationEngine, MetricPeriod, RevenueType, RevenueEntry
    )
    from .repositories.analytics_repository import AnalyticsRepository
    from .presenters.analytics_presenter import AnalyticsPresenter
except ImportError:
    # Fallback for direct execution
    from services.analytics_service import (
        AnalyticsCalculationEngine, MetricPeriod, RevenueType, RevenueEntry
    )
    from repositories.analytics_repository import AnalyticsRepository
    from presenters.analytics_presenter import AnalyticsPresenter

logger = logging.getLogger(__name__)

class AnalyticsDashboard:
    """
    Refactored Analytics Dashboard với clean architecture.
    
    Sử dụng service layer pattern với clear separation of concerns:
    - Service: Business logic & calculations
    - Repository: Data access & caching
    - Presenter: UI formatting
    """
    
    def __init__(self, agency_name: str = "Nova Digital", demo_mode: bool = True):
        self.agency_name = agency_name
        
        # Khởi tạo layers
        self.calculation_engine = AnalyticsCalculationEngine()
        self.repository = AnalyticsRepository()
        self.presenter = AnalyticsPresenter(agency_name)
        
        # Load data
        self.revenue_entries = self.repository.load_revenue_entries()
        self.client_metrics = self.repository.load_client_metrics()
        
        # Generate demo data nếu needed
        if demo_mode and not self.revenue_entries:
            self.repository.generate_demo_data()
            self.revenue_entries = self.repository.load_revenue_entries()
            self.client_metrics = self.repository.load_client_metrics()
        
        logger.info(f"Analytics Dashboard initialized for {agency_name}")
    
    # ═══════════════════════════════════════════════════════════
    # Revenue Analytics Methods
    # ═══════════════════════════════════════════════════════════
    
    def get_revenue(self, period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        """Get revenue cho một khoảng thời gian với caching."""
        # Check cache
        cached_result = self.repository.get_cached_result("get_revenue", period=period.value)
        if cached_result:
            return cached_result
        
        # Calculate
        result = self.calculation_engine.calculate_period_revenue(
            self.revenue_entries, period
        )
        
        # Cache result
        self.repository.cache_result("get_revenue", result, period=period.value)
        
        return result
    
    def get_mrr(self) -> Dict[str, Any]:
        """Get Monthly Recurring Revenue với caching."""
        # Check cache
        cached_result = self.repository.get_cached_result("get_mrr")
        if cached_result:
            return cached_result
        
        # Calculate
        result = self.calculation_engine.calculate_mrr(self.revenue_entries)
        
        # Cache result
        self.repository.cache_result("get_mrr", result)
        
        return result
    
    def get_revenue_forecast(self, months: int = 6) -> List[Dict[str, Any]]:
        """Get revenue forecast với caching."""
        # Check cache
        cached_result = self.repository.get_cached_result("get_forecast", months=months)
        if cached_result:
            return cached_result
        
        # Get MRR data
        mrr_data = self.get_mrr()
        
        # Calculate forecast
        result = self.calculation_engine.calculate_revenue_forecast(mrr_data, months)
        
        # Cache result
        self.repository.cache_result("get_forecast", result, months=months)
        
        return result
    
    # ═══════════════════════════════════════════════════════════
    # Client Analytics Methods
    # ═══════════════════════════════════════════════════════════
    
    def get_client_overview(self) -> Dict[str, Any]:
        """Get client overview với caching."""
        # Check cache
        cached_result = self.repository.get_cached_result("get_client_overview")
        if cached_result:
            return cached_result
        
        # Calculate
        result = self.calculation_engine.calculate_client_overview(self.client_metrics)
        
        # Cache result
        self.repository.cache_result("get_client_overview", result)
        
        return result
    
    def get_growth_trend(self, months: int = 12) -> List[Dict[str, Any]]:
        """Get growth trend với caching."""
        # Check cache
        cached_result = self.repository.get_cached_result("get_growth_trend", months=months)
        if cached_result:
            return cached_result
        
        # Calculate
        result = self.calculation_engine.calculate_growth_trend(self.revenue_entries, months)
        
        # Cache result
        self.repository.cache_result("get_growth_trend", result, months=months)
        
        return result
    
    def get_revenue_breakdown(self, period: MetricPeriod = MetricPeriod.MONTH) -> Dict[str, Any]:
        """Get revenue breakdown với caching."""
        # Check cache
        cached_result = self.repository.get_cached_result("get_breakdown", period=period.value)
        if cached_result:
            return cached_result
        
        # Calculate
        result = self.calculation_engine.calculate_revenue_breakdown(
            self.revenue_entries, period
        )
        
        # Cache result
        self.repository.cache_result("get_breakdown", result, period=period.value)
        
        return result
    
    # ═══════════════════════════════════════════════════════════
    # Advanced Analytics Methods
    # ═══════════════════════════════════════════════════════════
    
    def identify_anomalies(self, threshold_multiplier: float = 2.0) -> List[Dict[str, Any]]:
        """Identify revenue anomalies."""
        return self.calculation_engine.identify_anomalies(
            self.revenue_entries, threshold_multiplier
        )
    
    # ═══════════════════════════════════════════════════════════
    # Data Management Methods
    # ═══════════════════════════════════════════════════════════
    
    def add_revenue_entry(self, entry: RevenueEntry) -> bool:
        """Add revenue entry mới."""
        success = self.repository.add_revenue_entry(entry)
        if success:
            # Refresh data
            self.revenue_entries = self.repository.load_revenue_entries()
            # Invalidate cache
            self.repository.invalidate_cache()
        
        return success
    
    def update_client_metrics(self, client_id: str, metrics) -> bool:
        """Update client metrics."""
        success = self.repository.update_client_metrics(client_id, metrics)
        if success:
            # Refresh data
            self.client_metrics = self.repository.load_client_metrics()
            # Invalidate cache
            self.repository.invalidate_cache()
        
        return success
    
    def refresh_data(self) -> None:
        """Refresh data từ repository và invalidate cache."""
        self.revenue_entries = self.repository.load_revenue_entries()
        self.client_metrics = self.repository.load_client_metrics()
        self.repository.invalidate_cache()
        logger.info("Analytics data refreshed")
    
    # ═══════════════════════════════════════════════════════════
    # Dashboard Summary Method
    # ═══════════════════════════════════════════════════════════
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get comprehensive dashboard summary."""
        revenue_month = self.get_revenue(MetricPeriod.MONTH)
        mrr_data = self.get_mrr()
        client_overview = self.get_client_overview()
        forecast = self.get_revenue_forecast(3)
        
        return {
            "agency": self.agency_name,
            "generated_at": self.repository.get_data_summary()["cache_info"].get("timestamp", "Unknown"),
            "revenue": {
                "this_month": revenue_month["total"],
                "growth": revenue_month["growth_percent"],
                "mrr": mrr_data["mrr"],
                "arr": mrr_data["arr"]
            },
            "clients": {
                "total": client_overview.get("total_clients", 0),
                "at_risk": client_overview.get("at_risk_count", 0),
                "avg_ltv": client_overview.get("avg_lifetime_value", 0)
            },
            "forecast": {
                "next_month": forecast[0]["projected_total"] if forecast else 0,
                "quarter": sum(f["projected_total"] for f in forecast[:3])
            },
            "health_indicators": {
                "revenue_trend": "🟢 Growing" if revenue_month["growth_percent"] > 0 else "🔴 Declining",
                "client_health": "🟢 Healthy" if client_overview.get("avg_health_score", 0) >= 80 else "🟡 Needs Attention",
                "forecast_confidence": "🟢 High" if forecast and forecast[0]["confidence"] >= 80 else "🟡 Medium"
            }
        }
    
    # ═══════════════════════════════════════════════════════════
    # Presentation Methods
    # ═══════════════════════════════════════════════════════════
    
    def format_dashboard_text(self) -> str:
        """Format dashboard cho text display."""
        dashboard_data = self.get_dashboard_summary()
        return self.presenter.format_dashboard_text(dashboard_data)
    
    def format_revenue_report(self, period: MetricPeriod = MetricPeriod.MONTH) -> str:
        """Format revenue report."""
        revenue_data = self.get_revenue(period)
        return self.presenter.format_revenue_report(revenue_data)
    
    def format_mrr_report(self) -> str:
        """Format MRR report."""
        mrr_data = self.get_mrr()
        return self.presenter.format_mrr_report(mrr_data)
    
    def format_client_overview(self) -> str:
        """Format client overview."""
        client_data = self.get_client_overview()
        return self.presenter.format_client_overview(client_data)
    
    def format_forecast_report(self, months: int = 6) -> str:
        """Format forecast report."""
        forecasts = self.get_revenue_forecast(months)
        return self.presenter.format_forecast_report(forecasts)
    
    def format_anomaly_report(self, threshold_multiplier: float = 2.0) -> str:
        """Format anomaly report."""
        anomalies = self.identify_anomalies(threshold_multiplier)
        return self.presenter.format_anomaly_report(anomalies)
    
    def format_growth_trend(self, months: int = 12) -> str:
        """Format growth trend."""
        trends = self.get_growth_trend(months)
        return self.presenter.format_growth_trend(trends)
    
    def format_revenue_breakdown(self, period: MetricPeriod = MetricPeriod.MONTH) -> str:
        """Format revenue breakdown."""
        breakdown = self.get_revenue_breakdown(period)
        return self.presenter.format_revenue_breakdown(breakdown)
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get performance metrics."""
        return self.repository.get_data_summary()
    
    def format_performance_metrics(self) -> str:
        """Format performance metrics."""
        metrics = self.get_performance_metrics()
        return self.presenter.format_performance_metrics(metrics)