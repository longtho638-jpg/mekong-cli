"""
Metrics Collector.
"""
import threading
from typing import Dict, Optional

from .enums import MetricType
from .models import Metric


class MetricsCollector:
    """
    👁️ Prometheus-compatible metrics collector

    Collects and exposes metrics for monitoring.
    """

    def __init__(self):
        self.metrics: Dict[str, Metric] = {}
        self._lock = threading.Lock()

        # Initialize core metrics
        self._init_core_metrics()

    def _init_core_metrics(self):
        """Initialize core business metrics."""
        core = [
            Metric("requests_total", MetricType.COUNTER),
            Metric("requests_per_second", MetricType.GAUGE),
            Metric("active_users", MetricType.GAUGE),
            Metric("revenue_daily", MetricType.GAUGE),
            Metric("error_rate", MetricType.GAUGE),
            Metric("response_time_avg", MetricType.GAUGE),
            Metric("response_time_p99", MetricType.GAUGE),
            Metric("gumroad_purchases", MetricType.COUNTER),
            Metric("leads_qualified", MetricType.COUNTER),
            Metric("emails_sent", MetricType.COUNTER),
            Metric("webhooks_processed", MetricType.COUNTER),
            Metric("queue_depth", MetricType.GAUGE),
            Metric("cpu_usage", MetricType.GAUGE),
            Metric("memory_usage", MetricType.GAUGE),
        ]

        for m in core:
            self.metrics[m.name] = m

    def increment(self, name: str, amount: float = 1, labels: Dict = None):
        """Increment counter metric."""
        with self._lock:
            if name not in self.metrics:
                self.metrics[name] = Metric(name, MetricType.COUNTER)
            self.metrics[name].increment(amount)

    def set_gauge(self, name: str, value: float, labels: Dict = None):
        """Set gauge metric value."""
        with self._lock:
            if name not in self.metrics:
                self.metrics[name] = Metric(name, MetricType.GAUGE)
            self.metrics[name].set(value)

    def get(self, name: str) -> Optional[float]:
        """Get metric value."""
        metric = self.metrics.get(name)
        return metric.value if metric else None

    def get_all(self) -> Dict[str, float]:
        """Get all metric values."""
        return {name: m.value for name, m in self.metrics.items()}

    def to_prometheus(self) -> str:
        """Export metrics in Prometheus format."""
        lines = []
        for name, metric in self.metrics.items():
            type_str = metric.type.value.upper()
            lines.append(f"# TYPE {name} {type_str}")
            lines.append(f"{name} {metric.value}")
        return "\n".join(lines)
