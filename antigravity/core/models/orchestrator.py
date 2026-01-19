"""
💂 Orchestrator Models - Agent Task & Chain Definitions
=======================================================

Defines the data structures for multi-agent coordination. Enables
precise tracking of individual agent missions and the aggregated
outcome of execution chains.

Hierarchy:
- AgentType: The registry of specialized AI personas.
- AgentTask: A discrete unit of work for a single agent.
- ChainResult: The telemetry and output of an orchestrated sequence.

Binh Pháp: 💂 Tướng (Leadership) - Managing the specialized units.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

# Configure logging
logger = logging.getLogger(__name__)


class AgentType(Enum):
    """The roster of specialized AI agents in the Agency OS ecosystem."""

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
    """Patterns for agent coordination."""

    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"


@dataclass
class AgentTask:
    """
    🤖 Agent Mission

    Captures the context (prompt), execution state, and output
    of a single agent invocation.
    """

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
        """Transitions the task to the active state."""
        self.status = "running"
        self.started_at = datetime.now()

    def complete(self, result: Any = None) -> None:
        """Transitions the task to the final success state."""
        self.status = "completed"
        self.result = result
        self.completed_at = datetime.now()

    def fail(self, error: str) -> None:
        """Transitions the task to the failure state with error details."""
        self.status = "failed"
        self.result = error
        self.completed_at = datetime.now()

    def get_duration_seconds(self) -> float:
        """Calculates total wall-clock time for the task."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Provides a serializable representation."""
        return {
            "agent": self.agent.value,
            "description": self.description,
            "status": self.status,
            "performance": {
                "duration": round(self.get_duration_seconds(), 2),
                "priority": self.priority,
            },
            "output_preview": str(self.result)[:250] if self.result else None,
        }


@dataclass
class ChainResult:
    """
    ⛓️ Orchestration Outcome

    Aggregates results from multiple agent tasks into a single
    identifiable execution report.
    """

    success: bool
    tasks: List[AgentTask] = field(default_factory=list)
    total_time: float = 0.0
    errors: List[str] = field(default_factory=list)

    def add_task(self, task: AgentTask) -> None:
        """Appends a completed or failed task to the chain history."""
        self.tasks.append(task)

    def add_error(self, message: str) -> None:
        """Records a chain-level error and marks the chain as failed."""
        self.errors.append(message)
        self.success = False

    @property
    def metrics(self) -> Dict[str, int]:
        """Counts task outcomes for summary reporting."""
        return {
            "done": len([t for t in self.tasks if t.status == "completed"]),
            "fail": len([t for t in self.tasks if t.status == "failed"]),
            "total": len(self.tasks),
        }

    def to_dict(self) -> Dict[str, Any]:
        """Provides a serializable representation."""
        return {
            "success": self.success,
            "total_time_sec": round(self.total_time, 2),
            "mission_metrics": self.metrics,
            "errors": self.errors,
        }
