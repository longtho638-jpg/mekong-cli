"""
Orchestrator models for VIBEOrchestrator.

Extracted from vibe_orchestrator.py for clean architecture.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Any, List
from enum import Enum


class AgentType(Enum):
    """Available agent types."""
    PLANNER = "planner"
    RESEARCHER = "researcher"
    IMPLEMENTER = "implementer"
    TESTER = "tester"
    REVIEWER = "code-reviewer"
    DEBUGGER = "debugger"
    DOCS_MANAGER = "docs-manager"
    PROJECT_MANAGER = "project-manager"
    UI_DESIGNER = "ui-ux-designer"
    SCOUT = "scout"
    BINH_PHAP = "binh-phap-strategist"
    CLIENT_MAGNET = "client-magnet"
    REVENUE_ENGINE = "revenue-engine"
    CONTENT_FACTORY = "content-factory"


class ExecutionMode(Enum):
    """Execution patterns."""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"


@dataclass
class AgentTask:
    """Task for an agent to execute."""
    agent: AgentType
    prompt: str
    description: str
    priority: int = 1
    timeout: int = 300  # seconds
    dependencies: List[str] = field(default_factory=list)
    result: Any = None
    status: str = "pending"  # pending, running, completed, failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def start(self) -> None:
        """Mark task as started."""
        self.status = "running"
        self.started_at = datetime.now()

    def complete(self, result: Any = None) -> None:
        """Mark task as completed."""
        self.status = "completed"
        self.result = result
        self.completed_at = datetime.now()

    def fail(self, error: str) -> None:
        """Mark task as failed."""
        self.status = "failed"
        self.result = error
        self.completed_at = datetime.now()

    def duration(self) -> float:
        """Get task duration in seconds."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0.0

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "agent": self.agent.value,
            "prompt": self.prompt[:100],
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "result": str(self.result)[:200] if self.result else None,
            "duration": self.duration()
        }


@dataclass
class ChainResult:
    """Result from a chain of agent executions."""
    success: bool
    tasks: List[AgentTask] = field(default_factory=list)
    total_time: float = 0.0
    errors: List[str] = field(default_factory=list)

    def add_task(self, task: AgentTask) -> None:
        """Add a task to the chain."""
        self.tasks.append(task)

    def add_error(self, error: str) -> None:
        """Add an error."""
        self.errors.append(error)
        self.success = False

    @property
    def completed_count(self) -> int:
        """Count completed tasks."""
        return len([t for t in self.tasks if t.status == "completed"])

    @property
    def failed_count(self) -> int:
        """Count failed tasks."""
        return len([t for t in self.tasks if t.status == "failed"])

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "total_time": self.total_time,
            "tasks_completed": self.completed_count,
            "tasks_failed": self.failed_count,
            "errors": self.errors
        }
