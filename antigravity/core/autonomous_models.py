"""
Autonomous Mode Models - Data Structures
=========================================

Contains status enum and dataclasses for autonomous execution.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class AutonomousStatus(Enum):
    """Execution states for the autonomous orchestrator."""

    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    PAUSED = "paused"
    AWAITING_REVIEW = "awaiting_review"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Task:
    """A unit of work within an autonomous mission."""

    id: int
    name: str
    crew: Optional[str] = None
    chain: Optional[str] = None
    status: str = "pending"
    output: object = None  # Task output, can be any type
    error: Optional[str] = None


@dataclass
class ExecutionPlan:
    """A structured sequence of tasks to achieve a specific goal."""

    goal: str
    tasks: List[Task] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
