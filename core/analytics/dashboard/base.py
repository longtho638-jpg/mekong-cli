"""
Initialization and layers for Analytics Dashboard.
"""
import logging

from .entities_proxy import (
    AnalyticsCalculationEngine,
    AnalyticsPresenter,
    AnalyticsRepository,
    MetricPeriod,
)

logger = logging.getLogger(__name__)

class BaseAnalyticsDashboard:
    """Base logic for Analytics Dashboard layers and state."""
    def __init__(self, agency_name: str = "Nova Digital", demo_mode: bool = True):
        self.agency_name = agency_name
        self.calculation_engine = AnalyticsCalculationEngine()
        self.repository = AnalyticsRepository()
        self.presenter = AnalyticsPresenter(agency_name)

        # Load data
        self.revenue_entries = self.repository.load_revenue_entries()
        self.client_metrics = self.repository.load_client_metrics()

        if demo_mode and not self.revenue_entries:
            self.repository.generate_demo_data()
            self.revenue_entries = self.repository.load_revenue_entries()
            self.client_metrics = self.repository.load_client_metrics()

        logger.info(f"Analytics Dashboard initialized for {agency_name}")

    def refresh_data(self) -> None:
        """Refresh data từ repository và invalidate cache."""
        self.revenue_entries = self.repository.load_revenue_entries()
        self.client_metrics = self.repository.load_client_metrics()
        self.repository.invalidate_cache()
        logger.info("Analytics data refreshed")
