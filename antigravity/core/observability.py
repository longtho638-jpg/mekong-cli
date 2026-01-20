"""
👁️ Observability Stack - Metrics, Alerts, Dashboard
=====================================================

Prometheus metrics, viral alerts, real-time monitoring.
Detect viral traffic before it overwhelms the system.

Binh Pháp: "Dụng Gián" - Intelligence and early warning

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.observability package.
"""

from antigravity.core.observability import (
    Alert,
    AlertEvent,
    AlertManager,
    AlertSeverity,
    Metric,
    MetricsCollector,
    MetricType,
    ObservabilityStack,
    get_metrics,
    get_observability,
    get_prometheus,
    record_purchase,
    record_request,
)

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
