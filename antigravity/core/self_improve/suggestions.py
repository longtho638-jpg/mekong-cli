"""
Suggestion Management Logic.

Handles filtering, sorting, and applying improvement suggestions.
"""
import time
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

from .types import ImprovementSuggestion, ImprovementType


class OptimizationHistoryEntryDict(TypedDict):
    """Entry in optimization history log"""
    id: str
    type: str
    target: str
    applied_at: float


def get_filtered_suggestions(
    suggestions_map: Dict[str, ImprovementSuggestion],
    type_filter: Optional[ImprovementType] = None,
    min_confidence: float = 0.0,
) -> List[ImprovementSuggestion]:
    """
    Filter and sort improvement suggestions.

    Args:
        suggestions_map: Dictionary of suggestion_id -> ImprovementSuggestion.
        type_filter: Optional filter by improvement type.
        min_confidence: Minimum confidence threshold (0.0 to 1.0).

    Returns:
        List of suggestions sorted by impact_score (descending).
    """
    suggestions = list(suggestions_map.values())

    if type_filter:
        suggestions = [s for s in suggestions if s.type == type_filter]

    suggestions = [s for s in suggestions if s.confidence >= min_confidence]

    return sorted(suggestions, key=lambda s: s.impact_score, reverse=True)


def apply_suggestion_logic(
    suggestions_map: Dict[str, ImprovementSuggestion],
    suggestion_id: str,
) -> Optional[OptimizationHistoryEntryDict]:
    """
    Apply a suggestion and return optimization history entry.

    Args:
        suggestions_map: Dictionary of suggestion_id -> ImprovementSuggestion.
        suggestion_id: ID of suggestion to apply.

    Returns:
        Dictionary with optimization history entry if found, None otherwise.
        Entry contains: id, type, target, applied_at.
    """
    suggestion = suggestions_map.get(suggestion_id)
    if not suggestion:
        return None

    # Mark suggestion as applied
    suggestion.applied = True

    # Return history entry
    return {
        "id": suggestion_id,
        "type": suggestion.type.value,
        "target": suggestion.target,
        "applied_at": time.time(),
    }
