"""
Development Agent Data Models.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class SkillLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CareerTrack(Enum):
    INDIVIDUAL_CONTRIBUTOR = "ic"
    MANAGEMENT = "management"
    SPECIALIST = "specialist"


@dataclass
class Skill:
    id: str
    name: str
    category: str
    current_level: SkillLevel
    target_level: SkillLevel
    gap: int = 0


@dataclass
class DevelopmentPlan:
    id: str
    employee_id: str
    employee_name: str
    career_track: CareerTrack
    current_role: str
    target_role: str
    skills: List[Skill] = field(default_factory=list)
    progress: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def calculate_progress(self):
        if not self.skills:
            return 0
        completed = sum(1 for s in self.skills if s.gap == 0)
        return int((completed / len(self.skills)) * 100)
