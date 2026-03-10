"""Mekong CLI - Telemetry Module.

Backwards-compatible re-export of telemetry components.
"""

from .telemetry_collector import TelemetryCollector
from .telemetry_models import ExecutionTrace, StepTrace
from .tiered_store import TieredTelemetryStore
from .event_bus import EventType

# License monitoring (Phase 2)
from .license_monitor import LicenseMonitor, LicenseFailure, FailureThreshold, get_monitor, record_failure

# Usage anomaly detection (Phase 3)
from .anomaly_detector import (
    Anomaly,
    AnomalyCategory,
    AnomalyType,
    BaselineStats,
    UsageAnomalyDetector,
    get_detector,
)
from .usage_metering import (
    UsageEvent,
    UsageEventType,
    UsageMetering,
    get_metering,
    reset_metering,
)

__all__ = [
    "ExecutionTrace",
    "StepTrace",
    "TelemetryCollector",
    "TieredTelemetryStore",
    "EventType",
    # License monitoring
    "LicenseMonitor",
    "LicenseFailure",
    "FailureThreshold",
    "get_monitor",
    "record_failure",
    # Usage anomaly detection (Phase 3)
    "Anomaly",
    "AnomalyCategory",
    "AnomalyType",
    "BaselineStats",
    "UsageAnomalyDetector",
    "get_detector",
    "UsageEvent",
    "UsageEventType",
    "UsageMetering",
    "get_metering",
    "reset_metering",
]
