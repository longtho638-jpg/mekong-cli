"""
Observability Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional

from .enums import AlertSeverity, MetricType


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
