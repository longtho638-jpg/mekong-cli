"""
Agent Memory Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Set, Union

# Define possible values for memory context
ContextValue = Union[str, int, float, bool, list, dict, None]


@dataclass
class Memory:
    """A single record of an agent's execution experience."""

    agent: str
    context: Dict[str, ContextValue]
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
