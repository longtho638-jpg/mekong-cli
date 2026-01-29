"""
Budget Manager Data Models.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List


class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class Alert:
    id: str
    budget_id: str
    level: AlertLevel
    message: str
    threshold: int


@dataclass
class Budget:
    id: str
    name: str
    limit: float
    period: str = "monthly"
    spent: float = 0.0
    alerts_enabled: bool = True
    auto_throttle: bool = False

    @property
    def remaining(self) -> float:
        return max(0.0, self.limit - self.spent)

    @property
    def usage_percent(self) -> float:
        if self.limit == 0:
            return 0.0
        return (self.spent / self.limit) * 100
