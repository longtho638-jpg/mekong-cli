"""
🛡️ Code Guardian Models
======================

Data models and enums for the Code Guardian system.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict


class ThreatLevel(Enum):
    """Threat severity levels."""

    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    INFO = 5


class GuardianAction(Enum):
    """Actions taken by guardian."""

    ALERT = "alert"
    BLOCK = "block"
    ROLLBACK = "rollback"
    QUARANTINE = "quarantine"
    LOG_ONLY = "log_only"


@dataclass
class SecurityThreat:
    """Detected security threat."""

    id: str
    type: str
    level: ThreatLevel
    description: str
    source: str
    action_taken: GuardianAction
    detected_at: float = field(default_factory=time.time)
    resolved: bool = False
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PerformanceAnomaly:
    """Detected performance anomaly."""

    id: str
    metric: str
    expected_value: float
    actual_value: float
    deviation_percent: float
    detected_at: float = field(default_factory=time.time)
    auto_resolved: bool = False


@dataclass
class RollbackPoint:
    """Rollback checkpoint."""

    id: str
    name: str
    timestamp: float
    state_hash: str
    files_snapshot: Dict[str, str]  # file -> hash
    created_at: float = field(default_factory=time.time)
