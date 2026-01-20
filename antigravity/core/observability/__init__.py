"""
Observability Package.
"""
from typing import Dict

from .alerts import AlertManager
from .collector import MetricsCollector
from .enums import AlertSeverity, MetricType
from .models import Alert, AlertEvent, Metric
from .stack import ObservabilityStack, _observability, get_observability


# Convenience functions
def record_request(duration_ms: float, error: bool = False):
    get_observability().record_request(duration_ms, error)


def record_purchase(product: str, amount: float):
    get_observability().record_purchase(product, amount)


def get_metrics() -> Dict[str, float]:
    return get_observability().metrics.get_all()


def get_prometheus() -> str:
    return get_observability().get_prometheus_metrics()


__all__ = [
    "AlertSeverity",
    "MetricType",
    "Metric",
    "Alert",
    "AlertEvent",
    "MetricsCollector",
    "AlertManager",
    "ObservabilityStack",
    "get_observability",
    "record_request",
    "record_purchase",
    "get_metrics",
    "get_prometheus",
]
