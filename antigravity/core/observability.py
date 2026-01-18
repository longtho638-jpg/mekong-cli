"""
👁️ Observability Stack - Metrics, Alerts, Dashboard
=====================================================

Prometheus metrics, viral alerts, real-time monitoring.
Detect viral traffic before it overwhelms the system.

Binh Pháp: "Dụng Gián" - Intelligence and early warning
"""

import logging
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """Alert severity levels."""

    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    VIRAL = "viral"  # Special case for viral traffic


class MetricType(Enum):
    """Metric types."""

    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"


@dataclass
class Metric:
    """Single metric."""

    name: str
    type: MetricType
    value: float = 0
    labels: Dict[str, str] = field(default_factory=dict)
    updated_at: datetime = field(default_factory=datetime.now)

    def increment(self, amount: float = 1):
        self.value += amount
        self.updated_at = datetime.now()

    def set(self, value: float):
        self.value = value
        self.updated_at = datetime.now()


@dataclass
class Alert:
    """Alert definition."""

    name: str
    condition: str
    threshold: float
    severity: AlertSeverity
    message: str
    fired: bool = False
    last_fired: Optional[datetime] = None


@dataclass
class AlertEvent:
    """Fired alert event."""

    alert: Alert
    current_value: float
    fired_at: datetime = field(default_factory=datetime.now)


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


class AlertManager:
    """
    🚨 Alert Manager for monitoring thresholds
    """

    VIRAL_THRESHOLD = 10.0  # 10x normal traffic

    def __init__(self, metrics: MetricsCollector):
        self.metrics = metrics
        self.alerts: Dict[str, Alert] = {}
        self.alert_history: List[AlertEvent] = []
        self.callbacks: List[Callable[[AlertEvent], None]] = []

        # Initialize default alerts
        self._init_default_alerts()

    def _init_default_alerts(self):
        """Initialize default alert rules."""
        defaults = [
            Alert(
                "high_error_rate",
                "error_rate > threshold",
                5.0,  # 5% error rate
                AlertSeverity.WARNING,
                "Error rate exceeds 5%",
            ),
            Alert(
                "viral_traffic",
                "requests_per_second > threshold",
                1000.0,  # 10x normal (100 rps baseline)
                AlertSeverity.VIRAL,
                "🚀 VIRAL TRAFFIC DETECTED - 10x normal load",
            ),
            Alert(
                "high_cpu",
                "cpu_usage > threshold",
                80.0,
                AlertSeverity.CRITICAL,
                "CPU usage exceeds 80%",
            ),
            Alert(
                "high_memory",
                "memory_usage > threshold",
                90.0,
                AlertSeverity.CRITICAL,
                "Memory usage exceeds 90%",
            ),
            Alert(
                "queue_backlog",
                "queue_depth > threshold",
                100.0,
                AlertSeverity.WARNING,
                "Task queue backlog exceeds 100",
            ),
            Alert(
                "slow_response",
                "response_time_p99 > threshold",
                500.0,  # 500ms
                AlertSeverity.WARNING,
                "P99 response time exceeds 500ms",
            ),
        ]

        for alert in defaults:
            self.alerts[alert.name] = alert

    def check_alerts(self) -> List[AlertEvent]:
        """Check all alerts and fire if conditions met."""
        fired = []

        for name, alert in self.alerts.items():
            metric_name = alert.condition.split()[0]
            current_value = self.metrics.get(metric_name) or 0

            if current_value > alert.threshold:
                if not alert.fired:
                    alert.fired = True
                    alert.last_fired = datetime.now()

                    event = AlertEvent(alert, current_value)
                    fired.append(event)
                    self.alert_history.append(event)

                    # Log alert
                    log_fn = (
                        logger.critical
                        if alert.severity in [AlertSeverity.CRITICAL, AlertSeverity.VIRAL]
                        else logger.warning
                    )
                    log_fn(
                        f"🚨 ALERT [{alert.severity.value}]: {alert.message} (value={current_value})"
                    )

                    # Call callbacks
                    for callback in self.callbacks:
                        try:
                            callback(event)
                        except Exception as e:
                            logger.error(f"Alert callback failed: {e}")
            else:
                if alert.fired:
                    alert.fired = False
                    logger.info(f"✅ Alert resolved: {alert.name}")

        return fired

    def register_callback(self, callback: Callable[[AlertEvent], None]):
        """Register alert callback."""
        self.callbacks.append(callback)

    def get_status(self) -> Dict[str, Any]:
        """Get alert manager status."""
        return {
            "alerts": {
                name: {
                    "fired": a.fired,
                    "severity": a.severity.value,
                    "threshold": a.threshold,
                    "last_fired": a.last_fired.isoformat() if a.last_fired else None,
                }
                for name, a in self.alerts.items()
            },
            "history_count": len(self.alert_history),
        }


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

    def get_dashboard_data(self) -> Dict[str, Any]:
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


# Convenience functions
def record_request(duration_ms: float, error: bool = False):
    _observability.record_request(duration_ms, error)


def record_purchase(product: str, amount: float):
    _observability.record_purchase(product, amount)


def get_metrics() -> Dict[str, float]:
    return _observability.metrics.get_all()


def get_prometheus() -> str:
    return _observability.get_prometheus_metrics()
