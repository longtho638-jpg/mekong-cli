"""
Swarm Types - Data Models for Agent Swarm
==========================================

Enums and dataclasses for swarm components.
"""

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, List, Optional


class AgentRole(Enum):
    """Agent roles in the swarm."""

    COORDINATOR = "coordinator"
    WORKER = "worker"
    SPECIALIST = "specialist"
    SCOUT = "scout"
    GUARDIAN = "guardian"


class TaskPriority(Enum):
    """Task priority levels."""

    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5


class TaskStatus(Enum):
    """Task execution status."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class SwarmTask:
    """Task for swarm execution."""

    id: str
    name: str
    payload: Any
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: Optional[str] = None
    result: Optional[Any] = None
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
    handler: Callable
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


__all__ = [
    "AgentRole",
    "TaskPriority",
    "TaskStatus",
    "SwarmTask",
    "SwarmAgent",
    "SwarmMetrics",
]
