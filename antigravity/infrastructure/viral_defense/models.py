"""
Viral Defense Models.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Optional


class DefenseLevel(Enum):
    """Defense levels for degradation."""

    NORMAL = 0  # All features enabled
    YELLOW = 1  # Disable heavy features
    ORANGE = 2  # Core features only
    RED = 3  # Emergency static mode


class ScaleAction(Enum):
    """Scaling actions."""

    SCALE_UP = "scale_up"
    SCALE_DOWN = "scale_down"
    ADD_WORKERS = "add_workers"
    REMOVE_WORKERS = "remove_workers"
    ENABLE_CDN = "enable_cdn"
    STATIC_FALLBACK = "static_fallback"


@dataclass
class ScaleTrigger:
    """Auto-scale trigger configuration."""

    name: str
    metric: str
    threshold: float
    action: ScaleAction
    cooldown_seconds: int = 60
    last_triggered: Optional[datetime] = None

    def can_trigger(self) -> bool:
        """Check if trigger is ready (cooldown passed)."""
        if not self.last_triggered:
            return True
        elapsed = (datetime.now() - self.last_triggered).seconds
        return elapsed >= self.cooldown_seconds


@dataclass
class DegradationRule:
    """Feature degradation rule."""

    feature: str
    disable_at_level: DefenseLevel
    fallback_value: Any = None
    description: str = ""
