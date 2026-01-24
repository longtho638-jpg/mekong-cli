"""
Observability Stack.
"""
import logging
import threading
import time
from datetime import datetime
from typing import Any, Dict, Optional

from .alerts import AlertManager
from .collector import MetricsCollector

logger = logging.getLogger(__name__)


class ObservabilityStack:
    """
    👁️ Complete Observability Stack

    Combines metrics, alerts, and dashboards.
    """

    def __init__(self):
        self.metrics = MetricsCollector()
        self.alerts = AlertManager(self.metrics)
        self._check_interval = 10  # seconds
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """Start background monitoring."""
        self._running = True
        self._thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._thread.start()
        logger.info("👁️ Observability stack started")

    def stop(self):
        """Stop background monitoring."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("👁️ Observability stack stopped")

    def _monitor_loop(self):
        """Background monitoring loop."""
        while self._running:
            try:
                # Collect system metrics
                self._collect_system_metrics()

                # Check alerts
                self.alerts.check_alerts()

            except Exception as e:
                logger.error(f"Monitoring error: {e}")

            time.sleep(self._check_interval)

    def _collect_system_metrics(self):
        """Collect system resource metrics."""
        try:
            import psutil

            self.metrics.set_gauge("cpu_usage", psutil.cpu_percent())
            self.metrics.set_gauge("memory_usage", psutil.virtual_memory().percent)
        except ImportError:
            pass  # psutil not available

    def record_request(self, duration_ms: float, error: bool = False):
        """Record HTTP request."""
        self.metrics.increment("requests_total")
        if error:
            self.metrics.increment("errors_total")

    def record_purchase(self, product: str, amount: float):
        """Record Gumroad purchase."""
        self.metrics.increment("gumroad_purchases")
        self.metrics.increment("revenue_daily", amount)

    def get_dashboard_data(self) -> ObservabilityDashboardDict:
        """Get data for dashboard."""
        return {
            "metrics": self.metrics.get_all(),
            "alerts": self.alerts.get_status(),
            "updated_at": datetime.now().isoformat(),
        }

    def get_prometheus_metrics(self) -> str:
        """Get metrics in Prometheus format."""
        return self.metrics.to_prometheus()


# Global singleton
_observability = ObservabilityStack()


def get_observability() -> ObservabilityStack:
    """Get global observability stack."""
    return _observability
