"""
Checkpointing Models - Data structures for session state.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict


@dataclass
class SessionState:
    """A point-in-time snapshot of the Agency OS operational data."""

    name: str
    timestamp: datetime = field(default_factory=datetime.now)
    description: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    version: str = "2.0"
