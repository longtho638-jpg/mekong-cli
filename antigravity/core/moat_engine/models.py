"""
🏰 Moat Models
==============

Data models for the Moat Engine.
"""

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class Moat:
    """Defines a specific area of defensibility."""

    id: str
    name: str
    emoji: str
    description: str
    strength: int = 0  # 0-100%
    switching_cost_label: str = ""
    metrics: Dict[str, Any] = field(default_factory=dict)
