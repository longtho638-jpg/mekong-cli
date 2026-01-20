"""
Data models and Enums for Team Performance.
"""
import uuid
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List


class Role(Enum):
    """Team member roles."""
    OWNER = "owner"
    MANAGER = "manager"
    DESIGNER = "designer"
    DEVELOPER = "developer"
    MARKETER = "marketer"
    COPYWRITER = "copywriter"
    SUPPORT = "support"

@dataclass
class TeamMember:
    """A team member."""
    id: str
    name: str
    email: str
    role: Role
    skills: List[str]
    hourly_rate: float
    start_date: datetime
    projects_completed: int = 0
    hours_logged: float = 0
    revenue_generated: float = 0
    client_rating: float = 0.0

    @property
    def productivity_score(self) -> float:
        score = 0
        if self.projects_completed > 0: score += min(self.projects_completed * 10, 40)
        if self.hours_logged > 0: score += min(self.hours_logged / 10, 30)
        if self.client_rating > 0: score += self.client_rating * 6
        return min(score, 100)
