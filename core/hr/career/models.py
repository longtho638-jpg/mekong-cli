"""
Data models for Career Development.
"""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class SkillLevel(Enum):
    """Skill proficiency levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class CareerLevel(Enum):
    """Career levels."""
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"

class TrainingType(Enum):
    """Training types."""
    COURSE = "course"
    WORKSHOP = "workshop"
    CERTIFICATION = "certification"
    MENTORSHIP = "mentorship"
    CONFERENCE = "conference"

@dataclass
class Skill:
    """A skill being tracked for an employee."""
    id: str
    name: str
    category: str
    level: SkillLevel = SkillLevel.BEGINNER
    target_level: SkillLevel = SkillLevel.INTERMEDIATE
    _progress: int = 0  # 0-100

    @property
    def progress(self) -> int:
        return self._progress

    @progress.setter
    def progress(self, value: int) -> None:
        if not 0 <= value <= 100:
            raise ValueError("Progress must be between 0 and 100")
        self._progress = value

@dataclass
class CareerPath:
    """A career trajectory definition."""
    id: str
    employee: str
    current_role: str
    current_level: CareerLevel
    target_role: str
    target_level: CareerLevel
    skills: List[Skill] = field(default_factory=list)
    target_date: Optional[datetime] = None

@dataclass
class Training:
    """A training program entity."""
    id: str
    name: str
    training_type: TrainingType
    duration_hours: int
    cost: float = 0.0
    skills: List[str] = field(default_factory=list)
    completed_by: List[str] = field(default_factory=list)

    def __post_init__(self):
        if self.duration_hours < 0:
            raise ValueError("Duration cannot be negative")
        if self.cost < 0:
            raise ValueError("Cost cannot be negative")
