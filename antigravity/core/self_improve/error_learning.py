"""
Error Learning Logic.

Extracted from engine.py for modularity.
Handles error pattern recognition and solution generation.
"""
import hashlib
import logging
from typing import Any, Dict, Optional

from .types import (
    ImprovementSuggestion,
    ImprovementType,
    LearningEntry,
    LearningSource,
)

logger = logging.getLogger(__name__)


def generate_pattern_key(error: Exception) -> str:
    """
    Generate a unique pattern key for an error.

    Creates an MD5 hash from the error type and message
    to identify recurring error patterns.

    Args:
        error: The exception to generate a key for.

    Returns:
        A 12-character hex string identifying the error pattern.
    """
    error_type = type(error).__name__
    error_msg = str(error)
    return hashlib.md5(f"{error_type}:{error_msg}".encode()).hexdigest()[:12]


def generate_solution(error: Exception, context: Dict[str, Any] = None) -> str:
    """
    Generate solution suggestion for an error.

    Maps common error types to recommended fixes.

    Args:
        error: The exception to generate a solution for.
        context: Optional context about where the error occurred.

    Returns:
        A string describing the recommended solution.
    """
    error_type = type(error).__name__

    solutions = {
        "KeyError": "Add null check or provide default value",
        "TypeError": "Validate input types before operation",
        "ValueError": "Add input validation",
        "AttributeError": "Check object existence before accessing attribute",
        "IndexError": "Validate list bounds before accessing",
        "ZeroDivisionError": "Add zero check before division",
        "TimeoutError": "Increase timeout or add retry logic",
        "ConnectionError": "Add retry with exponential backoff",
    }

    return solutions.get(error_type, f"Handle {error_type} with try-except")


def create_learning_entry(
    pattern_key: str,
    error: Exception,
    context: Dict[str, Any] = None,
) -> LearningEntry:
    """
    Create a learning entry from an error.

    Args:
        pattern_key: The unique key identifying this error pattern.
        error: The exception that occurred.
        context: Optional context about where the error occurred.

    Returns:
        A new LearningEntry with initial confidence of 0.5.
    """
    error_type = type(error).__name__
    error_msg = str(error)

    return LearningEntry(
        id=pattern_key,
        source=LearningSource.ERROR_LOGS,
        pattern=f"{error_type}: {error_msg[:100]}",
        solution=generate_solution(error, context),
        confidence=0.5,
    )


def create_error_improvement_suggestion(
    learning: LearningEntry,
    error: Exception,
    context: Dict[str, Any] = None,
    enable_auto_apply: bool = False,
    min_confidence: float = 0.8,
) -> Optional[ImprovementSuggestion]:
    """
    Create improvement suggestion for a recurring error.

    Calculates confidence based on occurrence count and creates
    a suggestion if the pattern is worth addressing.

    Args:
        learning: The learning entry for this error pattern.
        error: The exception that occurred.
        context: Optional context about where the error occurred.
        enable_auto_apply: Whether to enable auto-apply for high confidence.
        min_confidence: Minimum confidence threshold for auto-apply.

    Returns:
        An ImprovementSuggestion or None if learning is invalid.
    """
    if not learning:
        return None

    # Calculate confidence based on occurrences (caps at 0.95)
    confidence = min(0.5 + (learning.occurrences * 0.1), 0.95)
    learning.confidence = confidence

    error_type = type(error).__name__
    target = context.get("file", "unknown") if context else "unknown"

    suggestion = ImprovementSuggestion(
        id=f"imp_{learning.id}",
        type=ImprovementType.RELIABILITY,
        target=target,
        description=f"Fix recurring {error_type}: {learning.solution}",
        confidence=confidence,
        impact_score=learning.occurrences * 0.2,
        auto_apply=enable_auto_apply and confidence >= min_confidence,
    )

    logger.info(f"Improvement suggested: {suggestion.description}")
    return suggestion
