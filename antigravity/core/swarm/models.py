"""
Agent Swarm Models.
"""
import time
from dataclasses import dataclass, field
from typing import Any, Callable, List, Optional

from .enums import AgentRole, TaskPriority, TaskStatus


@dataclass
class SwarmTask:
    """Task for swarm execution."""

    id: str
    name: str
    payload: Any  # Task payload, can be any type
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: Optional[str] = None
    result: Any = None  # Task result, can be any type
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    timeout_seconds: int = 300


@dataclass
class SwarmAgent:
    """Individual agent in the swarm."""

    id: str
    name: str
    role: AgentRole
    handler: Callable[[Any], Any]
    is_busy: bool = False
    tasks_completed: int = 0
    tasks_failed: int = 0
    avg_execution_time: float = 0.0
    last_active: float = field(default_factory=time.time)
    specialties: List[str] = field(default_factory=list)


@dataclass
class SwarmMetrics:
    """Swarm performance metrics."""

    total_agents: int = 0
    busy_agents: int = 0
    idle_agents: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    avg_task_time: float = 0.0
    throughput_per_minute: float = 0.0
