"""
Memory Retrieval Logic
"""
from datetime import datetime
from typing import Any, Dict, List


def parse_memories(data: Dict[str, Any], Memory_class) -> List[Any]:
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

def parse_patterns(data: Dict[str, Any], Pattern_class) -> Dict[str, List[Any]]:
    """Parses raw data into Pattern objects."""
    patterns = {}
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
