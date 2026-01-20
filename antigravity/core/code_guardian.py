"""
🛡️ Code Guardian - Real-Time Security & Performance Monitor
============================================================

Live security scanning and performance anomaly detection.
Auto-rollback on critical issues.

Binh Pháp: "Tiên phát chế nhân" - Strike first, control the enemy

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.code_guardian package.
"""

from antigravity.core.code_guardian import (
    CodeGuardian,
    GuardianAction,
    PerformanceAnomaly,
    RollbackPoint,
    SecurityThreat,
    ThreatLevel,
    create_rollback_point,
    get_guardian,
    guarded,
    monitor_metric,
    scan_code,
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
