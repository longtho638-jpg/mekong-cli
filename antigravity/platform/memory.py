"""
🧠 Memory System - Contextual Observation Tracking
==================================================

Stores and retrieves observations, decisions, and notes
for agentic memory and context persistence.

Binh Pháp: 🧠 Dụng Gián (Intelligence) - Using past knowledge for future strategies.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

ObservationType = Literal["code", "decision", "note", "insight", "error"]


@dataclass
class Observation:
    """A single memory observation."""

    id: int
    summary: str
    obs_type: ObservationType
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


class Memory:
    """
    🧠 Memory System

    Lightweight in-memory observation store for agentic context.
    Designed for session-based knowledge accumulation.
    """

    def __init__(self):
        self._observations: List[Observation] = []
        self._next_id: int = 1

    def add_observation(
        self,
        summary: str,
        obs_type: ObservationType = "note",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Observation:
        """Record a new observation."""
        obs = Observation(
            id=self._next_id,
            summary=summary,
            obs_type=obs_type,
            metadata=metadata or {},
        )
        self._observations.append(obs)
        self._next_id += 1
        return obs

    def get_timeline(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent observations as timeline."""
        sorted_obs = sorted(self._observations, key=lambda x: x.created_at, reverse=True)[:limit]

        return [
            {
                "id": obs.id,
                "summary": obs.summary,
                "type": obs.obs_type,
                "created_at": obs.created_at.isoformat(),
                "metadata": obs.metadata,
            }
            for obs in sorted_obs
        ]

    def search(self, query: str) -> List[Observation]:
        """Simple keyword search in observations."""
        query_lower = query.lower()
        return [obs for obs in self._observations if query_lower in obs.summary.lower()]

    def get_stats(self) -> Dict[str, Any]:
        """Memory system statistics."""
        type_counts = {}
        for obs in self._observations:
            type_counts[obs.obs_type] = type_counts.get(obs.obs_type, 0) + 1

        return {
            "total_observations": len(self._observations),
            "by_type": type_counts,
            "oldest": self._observations[0].created_at.isoformat() if self._observations else None,
            "newest": self._observations[-1].created_at.isoformat() if self._observations else None,
        }

    def clear(self) -> None:
        """Clear all observations."""
        self._observations.clear()
        self._next_id = 1


# Global singleton
_memory: Optional[Memory] = None


def get_memory() -> Memory:
    """Get shared memory instance."""
    global _memory
    if _memory is None:
        _memory = Memory()
    return _memory
