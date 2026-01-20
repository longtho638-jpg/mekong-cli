"""
🏯 Agent Orchestrator Models
===========================

Data models for the Agent Orchestrator system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, List, Optional


class StepStatus(Enum):
    """Execution status of an individual agent step."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class StepResult:
    """Detailed output and metadata for a single agent action."""

    agent: str
    action: str
    status: StepStatus
    output: Optional[Any] = None
    duration_ms: float = 0.0
    error: Optional[str] = None


@dataclass
class ChainResult:
    """Aggregated results from a full agent chain execution."""

    suite: str
    subcommand: str
    steps: List[StepResult] = field(default_factory=list)
    success: bool = False
    total_duration_ms: float = 0.0
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
