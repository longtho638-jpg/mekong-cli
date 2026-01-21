"""
Swarm Types - Data Models for Agent Swarm
==========================================

Enums and dataclasses for swarm components.
"""

import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


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
    payload: object  # Generic payload - specific tasks should use typed payloads
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: Optional[str] = None
    result: Optional[object] = None
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


class MessageType(Enum):
    TASK = "task"
    RESULT = "result"
    QUERY = "query"
    RESPONSE = "response"
    HANDOFF = "handoff"
    ERROR = "error"


@dataclass
class AgentMessage:
    """Standard message for inter-agent communication."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    sender: str = "system"
    recipient: str = "all"  # or specific agent ID
    type: MessageType = MessageType.TASK
    content: Any = None
    context_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "sender": self.sender,
            "recipient": self.recipient,
            "type": self.type.value,
            "content": self.content,
            "context_id": self.context_id,
            "metadata": self.metadata
        }


__all__ = [
    "AgentRole",
    "TaskPriority",
    "TaskStatus",
    "SwarmTask",
    "SwarmAgent",
    "SwarmMetrics",
    "MessageType",
    "AgentMessage",
]
