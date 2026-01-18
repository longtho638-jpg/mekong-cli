"""
🧠 Agent Memory - Learning from Past Executions
===============================================

Provides long-term persistence and pattern recognition for AI agents.
Agents store their experiences, successes, and failures to optimize future
decision-making and improve the Agency OS 'intelligence moat'.

Features:
- Execution History: Tracking context and outcomes.
- Pattern Recognition: Success rate analysis for specific approaches.
- Persistence: JSON-based local storage with Supabase sync readiness.

Binh Pháp: 🧠 Trí (Wisdom) - Learning from experience.
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class Memory:
    """A single record of an agent's execution experience."""

    agent: str
    context: Dict[str, Any]
    outcome: str
    success: bool
    timestamp: datetime = field(default_factory=datetime.now)
    patterns: List[str] = field(default_factory=list)
    tags: Set[str] = field(default_factory=set)


@dataclass
class Pattern:
    """A recognized behavioral pattern and its statistical performance."""

    agent: str
    pattern: str
    success_rate: float
    occurrences: int
    last_seen: datetime


class AgentMemory:
    """
    🧠 Agent Memory System

    The brain's hippocampus for the Agency OS.
    Maintains a rolling buffer of experiences and derives behavioral patterns.
    """

    def __init__(self, storage_path: str = ".antigravity/memory"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.memory_file = self.storage_path / "memories.json"

        self.memories: List[Memory] = []
        self.patterns: Dict[str, List[Pattern]] = {}

        self._load_memories()

    def remember(
        self,
        agent: str,
        context: Dict[str, Any],
        outcome: str,
        success: bool = True,
        patterns: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> Memory:
        """
        Records a new experience into the memory buffer.
        Triggers pattern learning and persistence.
        """
        memory = Memory(
            agent=agent,
            context=context,
            outcome=outcome,
            success=success,
            patterns=patterns or [],
            tags=set(tags or []),
        )

        # Keep buffer manageable (last 2000 memories)
        self.memories.append(memory)
        if len(self.memories) > 2000:
            self.memories.pop(0)

        # Update associated patterns
        for pattern_str in memory.patterns:
            self._update_pattern(agent, pattern_str, success)

        self._save_memories()
        logger.debug(f"Agent {agent} remembered an experience: {outcome[:50]}...")
        return memory

    def recall(self, agent: str, query: Optional[str] = None, limit: int = 10) -> List[Memory]:
        """
        Retrieves relevant past experiences for a specific agent.
        Supports basic text-based context filtering.
        """
        agent_memories = [m for m in self.memories if m.agent == agent]

        if query:
            q = query.lower()
            agent_memories = [
                m
                for m in agent_memories
                if q in str(m.context).lower() or q in m.outcome.lower() or q in "".join(m.tags)
            ]

        # Newest experiences first
        agent_memories.sort(key=lambda m: m.timestamp, reverse=True)
        return agent_memories[:limit]

    def learn_pattern(self, agent: str, pattern: str, success: bool = True):
        """Explicitly teaches the memory system a behavioral pattern."""
        self._update_pattern(agent, pattern, success)
        self._save_memories()

    def get_patterns(self, agent: str) -> List[Pattern]:
        """Returns all learned patterns for an agent."""
        return self.patterns.get(agent, [])

    def get_best_patterns(self, agent: str, limit: int = 5) -> List[Pattern]:
        """Returns the most successful patterns for an agent (high success rate)."""
        patterns = self.get_patterns(agent)
        # Sort by success rate then occurrences
        sorted_patterns = sorted(
            patterns, key=lambda p: (p.success_rate, p.occurrences), reverse=True
        )
        return sorted_patterns[:limit]

    def _update_pattern(self, agent: str, pattern_str: str, success: bool):
        """Internal logic to update pattern statistics or create new ones."""
        if agent not in self.patterns:
            self.patterns[agent] = []

        for p in self.patterns[agent]:
            if p.pattern == pattern_str:
                # Bayesian-style update
                total = p.occurrences
                p.success_rate = (p.success_rate * total + (1 if success else 0)) / (total + 1)
                p.occurrences += 1
                p.last_seen = datetime.now()
                return

        # Initialize new pattern
        self.patterns[agent].append(
            Pattern(
                agent=agent,
                pattern=pattern_str,
                success_rate=1.0 if success else 0.0,
                occurrences=1,
                last_seen=datetime.now(),
            )
        )

    def _save_memories(self):
        """Persists current memory state to a JSON file."""
        try:
            data = {
                "metadata": {"last_updated": datetime.now().isoformat(), "version": "2.0"},
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
                    for m in self.memories
                ],
            }
            self.memory_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save agent memories: {e}")

    def _load_memories(self):
        """Loads memories from disk if the file exists."""
        if not self.memory_file.exists():
            return

        try:
            data = json.loads(self.memory_file.read_text(encoding="utf-8"))
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
                self.memories.append(memory)

                # Rebuild patterns from loaded memories
                for pattern_str in memory.patterns:
                    self._update_pattern(memory.agent, pattern_str, memory.success)

        except Exception as e:
            logger.warning(f"Failed to load agent memories (may be corrupt or old version): {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Calculates global memory usage and health statistics."""
        return {
            "total_records": len(self.memories),
            "unique_agents": len(set(m.agent for m in self.memories)),
            "total_patterns": sum(len(p) for p in self.patterns.values()),
            "global_success_rate": (
                sum(1 for m in self.memories if m.success) / len(self.memories)
                if self.memories
                else 0.0
            ),
        }


# Singleton Management
_global_memory = None


def get_agent_memory() -> AgentMemory:
    """Access the shared agent memory system."""
    global _global_memory
    if _global_memory is None:
        _global_memory = AgentMemory()
    return _global_memory
