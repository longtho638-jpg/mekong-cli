"""
Alert Manager.
"""

import logging
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from typing_extensions import TypedDict

from .collector import MetricsCollector
from .enums import AlertSeverity
from .models import Alert, AlertEvent

logger = logging.getLogger(__name__)


class AlertStatusItemDict(TypedDict):
    fired: bool
    severity: str
    threshold: float
    last_fired: Optional[str]


class AlertManagerStatusDict(TypedDict):
    """Summary of all alert statuses"""

    alerts: Dict[str, AlertStatusItemDict]
    history_count: int


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

    def get_status(self) -> AlertManagerStatusDict:
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
