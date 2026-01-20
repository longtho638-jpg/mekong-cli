"""
Agent Memory Storage - Persistence Layer (Facade)
=================================================

Handles saving and loading memory data to/from disk using modular backends.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List

from .backends.json_backend import load_from_json, save_to_json
from .compression import compress_memory_data, decompress_memory_data
from .retrieval import parse_memories, parse_patterns

if TYPE_CHECKING:
    from .models import Memory, Pattern

logger = logging.getLogger(__name__)

def save_memories(
    memory_file: Path,
    memories: List["Memory"],
    patterns: Dict[str, List["Pattern"]]
) -> bool:
    """Persists current memory state to disk."""
    try:
        data = {
            "metadata": {"last_updated": datetime.now().isoformat(), "version": "2.1"},
            "memories": [
                {
                    "agent": m.agent,
                    "context": m.context,
                    "outcome": m.outcome,
                    "success": m.success,
                    "timestamp": m.timestamp.isoformat(),
                    "patterns": m.patterns,
                    "tags": list(m.tags),
                }
                for m in memories
            ],
            "patterns": {
                agent: [
                    {
                        "pattern": p.pattern,
                        "success_rate": p.success_rate,
                        "occurrences": p.occurrences,
                        "last_seen": p.last_seen.isoformat(),
                    }
                    for p in p_list
                ]
                for agent, p_list in patterns.items()
            },
        }

        compressed_data = compress_memory_data(data)
        return save_to_json(memory_file, compressed_data)

    except Exception as e:
        logger.error(f"Failed to save agent memories: {e}")
        return False

def load_memories(
    memory_file: Path,
    Memory,
    Pattern
) -> tuple[List[Any], Dict[str, List[Any]]]:
    """Loads memories and patterns from disk."""
    raw_data = load_from_json(memory_file)
    if not raw_data:
        return [], {}

    try:
        data = decompress_memory_data(raw_data)
        memories = parse_memories(data, Memory)
        patterns = parse_patterns(data, Pattern)
        return memories, patterns
    except Exception as e:
        logger.warning(f"Failed to load agent memories: {e}")
        return [], {}
