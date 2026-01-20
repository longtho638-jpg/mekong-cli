"""
🧠 Self-Improve Engine - AI Auto-Refactoring
=============================================

Continuous self-improvement through learning from metrics and errors.
Auto-refactors code based on performance data.

Binh Pháp: "Tri kỷ tri bỉ" - Know yourself, know your enemy

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.self_improve package.
"""

from antigravity.core.self_improve import (
    ImprovementSuggestion,
    ImprovementType,
    LearningEntry,
    LearningSource,
    PerformanceProfile,
    SelfImproveEngine,
    get_self_improve_engine,
    self_improving,
)

__all__ = [
    "SelfImproveEngine",
    "LearningEntry",
    "ImprovementSuggestion",
    "PerformanceProfile",
    "ImprovementType",
    "LearningSource",
    "get_self_improve_engine",
    "self_improving",
]
