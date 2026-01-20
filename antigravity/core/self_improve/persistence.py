"""
Self-Improvement Persistence - Load and save learnings.

Handles file I/O for learning entries to persist knowledge across sessions.
"""
import json
import logging
import os
from typing import Dict

from .types import LearningEntry, LearningSource

logger = logging.getLogger(__name__)

# Default storage path
DEFAULT_LEARNINGS_PATH = os.path.expanduser("~/.antigravity/learnings.json")


def load_learnings(path: str = DEFAULT_LEARNINGS_PATH) -> Dict[str, LearningEntry]:
    """
    Load learnings from file.

    Args:
        path: Path to the learnings JSON file.

    Returns:
        Dictionary mapping learning IDs to LearningEntry objects.
    """
    learnings: Dict[str, LearningEntry] = {}

    if not os.path.exists(path):
        return learnings

    try:
        with open(path, "r") as f:
            data = json.load(f)
            for item in data:
                # Convert source string back to enum
                if isinstance(item.get("source"), str):
                    item["source"] = LearningSource(item["source"])
                learning = LearningEntry(**item)
                learnings[learning.id] = learning
        logger.info(f"Loaded {len(learnings)} learnings from {path}")
    except Exception as e:
        logger.error(f"Failed to load learnings: {e}")

    return learnings


def save_learnings(
    learnings: Dict[str, LearningEntry],
    path: str = DEFAULT_LEARNINGS_PATH,
) -> bool:
    """
    Save learnings to file.

    Args:
        learnings: Dictionary of learning entries to save.
        path: Path to the learnings JSON file.

    Returns:
        True if save was successful, False otherwise.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)

    try:
        data = [
            {
                "id": entry.id,
                "source": entry.source.value,
                "pattern": entry.pattern,
                "solution": entry.solution,
                "confidence": entry.confidence,
                "occurrences": entry.occurrences,
                "created_at": entry.created_at,
                "last_applied": entry.last_applied,
            }
            for entry in learnings.values()
        ]
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        logger.debug(f"Saved {len(learnings)} learnings to {path}")
        return True
    except Exception as e:
        logger.error(f"Failed to save learnings: {e}")
        return False
