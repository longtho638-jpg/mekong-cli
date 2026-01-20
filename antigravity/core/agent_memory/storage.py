"""
Agent Memory Storage - Persistence Layer
=========================================

Handles saving and loading memory data to/from disk.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Memory, Pattern

logger = logging.getLogger(__name__)


def save_memories(
    memory_file: Path,
    memories: List["Memory"],
    patterns: Dict[str, List["Pattern"]]
) -> bool:
    """
    Persists current memory state and learned patterns to a JSON file.

    Args:
        memory_file: Path to the JSON file
        memories: List of Memory objects
        patterns: Dict mapping agent -> list of Pattern objects

    Returns:
        True if save successful
    """
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
        memory_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return True
    except Exception as e:
        logger.error(f"Failed to save agent memories: {e}")
        return False


def load_memories(
    memory_file: Path,
    Memory,
    Pattern
) -> tuple[List[Any], Dict[str, List[Any]]]:
    """
    Loads memories and patterns from disk if the file exists.

    Args:
        memory_file: Path to the JSON file
        Memory: Memory class for instantiation
        Pattern: Pattern class for instantiation

    Returns:
        Tuple of (memories list, patterns dict)
    """
    memories = []
    patterns: Dict[str, List[Any]] = {}

    if not memory_file.exists():
        return memories, patterns

    try:
        data = json.loads(memory_file.read_text(encoding="utf-8"))

        # Load Memories
        for m in data.get("memories", []):
            memory = Memory(
                agent=m["agent"],
                context=m["context"],
                outcome=m["outcome"],
                success=m["success"],
                timestamp=datetime.fromisoformat(m["timestamp"]),
                patterns=m.get("patterns", []),
                tags=set(m.get("tags", [])),
            )
            memories.append(memory)

        # Load Patterns (v2.1+)
        saved_patterns = data.get("patterns", {})
        if saved_patterns:
            for agent, p_list in saved_patterns.items():
                patterns[agent] = []
                for p_data in p_list:
                    patterns[agent].append(
                        Pattern(
                            agent=agent,
                            pattern=p_data["pattern"],
                            success_rate=p_data["success_rate"],
                            occurrences=p_data["occurrences"],
                            last_seen=datetime.fromisoformat(p_data["last_seen"]),
                        )
                    )

    except Exception as e:
        logger.warning(f"Failed to load agent memories (may be corrupt or old version): {e}")

    return memories, patterns
