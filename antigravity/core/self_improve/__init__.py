"""
🧠 Self-Improve Engine - AI Auto-Refactoring
=============================================

Continuous self-improvement through learning from metrics and errors.
Auto-refactors code based on performance data.

Binh Pháp: "Tri kỷ tri bỉ" - Know yourself, know your enemy
"""

from .decorators import self_improving
from .engine import SelfImproveEngine, get_self_improve_engine
from .types import (
    ImprovementSuggestion,
    ImprovementType,
    LearningEntry,
    LearningSource,
    PerformanceProfile,
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
