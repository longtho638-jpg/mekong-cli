"""
🌊 Workflow Models - The Development Cycle
==========================================

Defines the data structures for orchestrating the high-velocity 'Manus Pattern'
development cycle. Tracks individual tasks, workflow stages, and code
quality metrics.

Hierarchy:
- WorkflowStep: The 6 phases of the build cycle.
- TaskStatus: Operational states of a work unit.
- Task: A discrete executable component of a plan.
- CodeReviewResult: The quality scorecard for deployments.

Binh Pháp: 📋 Pháp (Process) - Maintaining the order of the build.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict

# Configure logging
logger = logging.getLogger(__name__)


class TaskPerformanceDict(TypedDict):
    created: str
    done: Optional[str]
    duration_min: float


class TaskDict(TypedDict):
    """Dictionary representation of a build task"""
    id: str
    name: str
    status: str
    phase: str
    performance: TaskPerformanceDict


class CodeReviewGatesDict(TypedDict):
    critical: List[str]
    warnings: List[str]


class CodeReviewDict(TypedDict):
    """Dictionary representation of a code review result"""
    passed: bool
    score: int
    gates: CodeReviewGatesDict
    suggestions: List[str]


class WorkflowStep(Enum):
    """The standard 6-step cycle for building Agency OS features."""

    PLAN_DETECTION = 0
    ANALYSIS = 1
    IMPLEMENTATION = 2
    TESTING = 3
    CODE_REVIEW = 4
    FINALIZE = 5


class TaskStatus(Enum):
    """Execution states for individual work units."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    FAILED = "failed"


@dataclass
class Task:
    """
    🛠️ Build Task

    A single identifiable unit of work extracted from a strategic plan.
    """

    id: str
    name: str
    description: str
    status: TaskStatus = field(default=TaskStatus.PENDING)
    step: WorkflowStep = field(default=WorkflowStep.IMPLEMENTATION)
    dependencies: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    def start(self) -> None:
        """Transitions task to active development."""
        self.status = TaskStatus.IN_PROGRESS
        logger.debug(f"Task started: {self.name} ({self.id})")

    def complete(self) -> None:
        """Transitions task to completion and records time."""
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now()
        logger.debug(f"Task completed: {self.name}")

    def block(self, reason: str = "Unknown") -> None:
        """Marks task as blocked and appends reason to description."""
        self.status = TaskStatus.BLOCKED
        self.description = f"{self.description} [BLOCKED: {reason}]"
        logger.warning(f"Task blocked: {self.id} | Reason: {reason}")

    def get_duration_minutes(self) -> float:
        """Calculates total processing time."""
        if self.created_at and self.completed_at:
            return (self.completed_at - self.created_at).total_seconds() / 60
        return 0.0

    def to_dict(self) -> TaskDict:
        """Provides a serializable representation."""
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status.value,
            "phase": self.step.name,
            "performance": {
                "created": self.created_at.isoformat(),
                "done": self.completed_at.isoformat() if self.completed_at else None,
                "duration_min": round(self.get_duration_minutes(), 1),
            },
        }


@dataclass
class CodeReviewResult:
    """
    🔍 Code Review Scorecard

    Captures the results of static analysis and quality checks.
    Acts as the final gatekeeper before deployment (SHIP).
    """

    score: int = 10  # Start with perfect score
    critical_issues: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        """Returns True if no critical issues found and score is acceptable."""
        return len(self.critical_issues) == 0 and self.score >= 7

    def add_critical(self, issue: str) -> None:
        """Registers a blocking issue and significantly reduces the score."""
        self.critical_issues.append(issue)
        self.score = max(0, self.score - 3)
        logger.error(f"Critical review finding: {issue}")

    def add_warning(self, warning: str) -> None:
        """Registers a non-blocking issue and slightly reduces the score."""
        self.warnings.append(warning)
        self.score = max(0, self.score - 1)
        logger.warning(f"Review warning: {warning}")

    def to_dict(self) -> CodeReviewDict:
        """Provides a serializable representation."""
        return {
            "passed": self.passed,
            "score": self.score,
            "gates": {"critical": self.critical_issues, "warnings": self.warnings},
            "suggestions": self.suggestions,
        }
