"""
🏯 Agent Crews Models
=====================

Data models for the Agent Crews system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class CrewStatus(Enum):
    """Lifecycle stages of a crew execution mission."""

    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class CrewMember:
    """A single agent participating in a crew."""

    agent: str
    role: str  # lead, worker, qa
    skills: List[str] = field(default_factory=list)


@dataclass
class Crew:
    """Definition of a specialized multi-agent squad."""

    name: str
    description: str
    lead: CrewMember
    workers: List[CrewMember]
    qa: CrewMember
    skills_required: List[str] = field(default_factory=list)


@dataclass
class CrewResult:
    """Comprehensive output and metadata from a crew mission."""

    crew_name: str
    status: CrewStatus
    steps_completed: int
    total_steps: int
    output: Optional[str] = None
    execution_time: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
