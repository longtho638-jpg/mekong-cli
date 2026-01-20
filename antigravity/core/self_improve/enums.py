"""
Self-Improvement Enums.
"""
from enum import Enum


class ImprovementType(Enum):
    """Types of improvements."""

    PERFORMANCE = "performance"
    SECURITY = "security"
    RELIABILITY = "reliability"
    READABILITY = "readability"
    SCALABILITY = "scalability"


class LearningSource(Enum):
    """Sources of learning data."""

    ERROR_LOGS = "error_logs"
    METRICS = "metrics"
    USER_FEEDBACK = "user_feedback"
    BENCHMARKS = "benchmarks"
    CODE_ANALYSIS = "code_analysis"
