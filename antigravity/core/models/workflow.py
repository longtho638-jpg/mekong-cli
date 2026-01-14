"""
Workflow models for VIBEWorkflow.

Extracted from vibe_workflow.py for clean architecture.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class WorkflowStep(Enum):
    """6-step development workflow."""
    PLAN_DETECTION = 0
    ANALYSIS = 1
    IMPLEMENTATION = 2
    TESTING = 3
    CODE_REVIEW = 4
    FINALIZE = 5


class TaskStatus(Enum):
    """Task status states."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    FAILED = "failed"


@dataclass
class Task:
    """A single task in the workflow."""
    id: str
    name: str
    description: str
    status: TaskStatus = TaskStatus.PENDING
    step: WorkflowStep = WorkflowStep.IMPLEMENTATION
    dependencies: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    def complete(self) -> None:
        """Mark task as completed."""
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now()

    def start(self) -> None:
        """Mark task as in progress."""
        self.status = TaskStatus.IN_PROGRESS

    def block(self, reason: str = "") -> None:
        """Mark task as blocked."""
        self.status = TaskStatus.BLOCKED
        self.description = f"{self.description} [BLOCKED: {reason}]"

    def is_done(self) -> bool:
        """Check if task is completed."""
        return self.status == TaskStatus.COMPLETED

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status.value,
            "step": self.step.value,
            "dependencies": self.dependencies,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


@dataclass
class CodeReviewResult:
    """Code review scoring result."""
    score: int  # 0-10
    critical_issues: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        """Check if review passed (no critical issues, score >= 7)."""
        return len(self.critical_issues) == 0 and self.score >= 7

    def add_critical(self, issue: str) -> None:
        """Add critical issue."""
        self.critical_issues.append(issue)
        self.score = max(0, self.score - 2)

    def add_warning(self, warning: str) -> None:
        """Add warning."""
        self.warnings.append(warning)
        self.score = max(0, self.score - 1)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "score": self.score,
            "critical_issues": self.critical_issues,
            "warnings": self.warnings,
            "suggestions": self.suggestions,
            "passed": self.passed
        }
