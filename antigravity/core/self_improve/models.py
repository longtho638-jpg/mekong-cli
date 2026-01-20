"""
Self-Improvement Models.
"""
import time
from dataclasses import dataclass, field
from typing import Optional

from .enums import ImprovementType, LearningSource


@dataclass
class LearningEntry:
    """A learning from experience."""

    id: str
    source: LearningSource
    pattern: str
    solution: str
    confidence: float
    occurrences: int = 1
    created_at: float = field(default_factory=time.time)
    last_applied: Optional[float] = None


@dataclass
class ImprovementSuggestion:
    """Suggested improvement."""

    id: str
    type: ImprovementType
    target: str  # file or function
    description: str
    before_code: Optional[str] = None
    after_code: Optional[str] = None
    confidence: float = 0.0
    impact_score: float = 0.0
    auto_apply: bool = False
    applied: bool = False


@dataclass
class PerformanceProfile:
    """Performance profile for a component."""

    name: str
    avg_execution_time: float = 0.0
    p99_execution_time: float = 0.0
    error_rate: float = 0.0
    call_count: int = 0
    memory_usage: float = 0.0
    cpu_usage: float = 0.0
    last_updated: float = field(default_factory=time.time)
