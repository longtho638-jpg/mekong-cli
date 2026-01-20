"""
🛡️ Code Guardian Module
======================

Live security scanning and performance anomaly detection.
Auto-rollback on critical issues.
"""

from .guardian import (
    CodeGuardian,
    create_rollback_point,
    get_guardian,
    guarded,
    monitor_metric,
    scan_code,
)
from .models import (
    GuardianAction,
    PerformanceAnomaly,
    RollbackPoint,
    SecurityThreat,
    ThreatLevel,
)

__all__ = [
    "CodeGuardian",
    "SecurityThreat",
    "PerformanceAnomaly",
    "RollbackPoint",
    "ThreatLevel",
    "GuardianAction",
    "get_guardian",
    "scan_code",
    "monitor_metric",
    "create_rollback_point",
    "guarded",
]
