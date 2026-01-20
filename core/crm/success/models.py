"""
Data models and Enums for Customer Success.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Optional


class SuccessStage(Enum):
    """Client success lifecycle stages."""
    ONBOARDING = "onboarding"
    ADOPTION = "adoption"
    VALUE_REALIZATION = "value_realization"
    GROWTH = "growth"
    ADVOCACY = "advocacy"

class EngagementLevel(Enum):
    """Client engagement categories."""
    CHAMPION = "champion"
    ENGAGED = "engaged"
    PASSIVE = "passive"
    DISENGAGED = "disengaged"

@dataclass
class SuccessPlan:
    """A strategic success roadmap for a client."""
    id: str
    client_name: str
    csm: str
    stage: SuccessStage
    goals: List[str]
    milestones: List[str]
    risks: List[str]
    engagement: EngagementLevel
    health_score: int = 80
    nps_score: Optional[int] = None

    def __post_init__(self):
        if not 0 <= self.health_score <= 100:
            raise ValueError("Health score must be between 0 and 100")

@dataclass
class QBRRecord:
    """A record of a Quarterly Business Review meeting."""
    id: str
    client_name: str
    date: datetime
    achievements: List[str]
    challenges: List[str]
    next_quarter_goals: List[str]
    satisfaction: int
