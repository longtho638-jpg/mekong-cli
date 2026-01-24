"""
Memory Retrieval Logic
"""
from datetime import datetime
from typing import Any, Dict, List

from typing_extensions import TypedDict


class MemoryDataDict(TypedDict):
    """Raw memory record from storage"""
    agent: str
    context: Dict[str, Any]
    outcome: str
    success: bool
    timestamp: str
    patterns: List[str]
    tags: List[str]


class PatternDataDict(TypedDict):
    """Raw pattern record from storage"""
    pattern: str
    success_rate: float
    occurrences: int
    last_seen: str


class MemoryStoreDataDict(TypedDict):
    """Full raw data structure from storage"""
    memories: List[MemoryDataDict]
    patterns: Dict[str, List[PatternDataDict]]


def parse_memories(data: MemoryStoreDataDict, Memory_class) -> List[Any]:
    """Parses raw data into Memory objects."""
    memories = []
    for m in data.get("memories", []):
        memory = Memory_class(
            agent=m["agent"],
            context=m["context"],
            outcome=m["outcome"],
            success=m["success"],
            timestamp=datetime.fromisoformat(m["timestamp"]),
            patterns=m.get("patterns", []),
            tags=set(m.get("tags", [])),
        )
        memories.append(memory)
    return memories


def parse_patterns(data: MemoryStoreDataDict, Pattern_class) -> Dict[str, List[Any]]:
    """Parses raw data into Pattern objects."""
    patterns: Dict[str, List[Any]] = {}
    saved_patterns = data.get("patterns", {})
    for agent, p_list in saved_patterns.items():
        patterns[agent] = []
        for p_data in p_list:
            patterns[agent].append(
                Pattern_class(
                    agent=agent,
                    pattern=p_data["pattern"],
                    success_rate=p_data["success_rate"],
                    occurrences=p_data["occurrences"],
                    last_seen=datetime.fromisoformat(p_data["last_seen"]),
                )
            )
    return patterns
