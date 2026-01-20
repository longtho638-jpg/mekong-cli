"""
🛡️ ViralDefense - Auto-Scaling & Graceful Degradation
======================================================

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.infrastructure.viral_defense package.
"""

from antigravity.infrastructure.viral_defense import (
    ViralDefense,
    DefenseLevel,
    ScaleAction,
    ScaleTrigger,
    DegradationRule,
    get_defense,
    check_triggers,
    is_feature_enabled,
    get_defense_status,
    degradable,
)

# Re-export for backward compatibility
__all__ = [
    "ViralDefense",
    "DefenseLevel",
    "ScaleAction",
    "ScaleTrigger",
    "DegradationRule",
    "get_defense",
    "check_triggers",
    "is_feature_enabled",
    "get_defense_status",
    "degradable",
]
