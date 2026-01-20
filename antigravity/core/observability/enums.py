"""
Observability Enums.
"""
from enum import Enum


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
