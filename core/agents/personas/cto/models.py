"""
Chief Technology Officer (CTO) Data Models.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List, Optional


class InitiativeStatus(Enum):
    """Strategic technology initiative status."""
    IDEATION = "ideation"
    PLANNING = "planning"
    DEVELOPMENT = "development"
    LAUNCHED = "launched"
    SCALED = "scaled"

class TechStack(Enum):
    """Technology stack categories."""
    FRONTEND = "frontend"
    BACKEND = "backend"
    DATABASE = "database"
    CLOUD = "cloud"
    AI_ML = "ai_ml"
    DEVOPS = "devops"

@dataclass
class TechInitiative:
    """A high-level technology project entity."""
    id: str
    name: str
    description: str
    status: InitiativeStatus = InitiativeStatus.IDEATION
    impact: str = "medium"  # high, medium, low
    owner: str = ""
    target_date: Optional[datetime] = None

@dataclass
class TechDecision:
    """An Architecture Decision Record (ADR)."""
    id: str
    title: str
    context: str
    decision: str
    consequences: str
    status: str = "proposed"  # proposed, accepted, deprecated
    decided_at: Optional[datetime] = None

@dataclass
class TechDebt:
    """Technical debt tracking record."""
    id: str
    title: str
    area: TechStack
    severity: str  # critical, high, medium, low
    effort_days: int
    status: str = "identified"  # identified, scheduled, resolved

    def __post_init__(self):
        if self.effort_days < 0:
            raise ValueError("Effort days cannot be negative")
