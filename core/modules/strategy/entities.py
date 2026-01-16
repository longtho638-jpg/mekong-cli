"""
Strategy Module - Entities
"""
from dataclasses import dataclass
from enum import Enum
from typing import List

class Chapter(Enum):
    PLANNING = 1
    RESOURCES = 2
    STRATEGY = 3
    POSITIONING = 4
    MOMENTUM = 5
    WEAKNESS = 6
    MANEUVERING = 7
    ADAPTATION = 8
    OPERATIONS = 9
    TERRAIN = 10
    SITUATIONS = 11
    DISRUPTION = 12
    INTELLIGENCE = 13

@dataclass
class StrategicInsight:
    chapter: Chapter
    title: str
    content: str
    action_items: List[str]
    score: int = 0
