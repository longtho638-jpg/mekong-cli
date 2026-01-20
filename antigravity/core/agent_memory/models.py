"""
Agent Memory Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Set


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
