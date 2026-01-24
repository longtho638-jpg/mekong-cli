"""
Agent Swarm Enums.
"""
from enum import Enum, IntEnum


class AgentRole(Enum):
    """Agent roles in the swarm."""

    COORDINATOR = "coordinator"
    WORKER = "worker"
    SPECIALIST = "specialist"
    SCOUT = "scout"
    GUARDIAN = "guardian"


class TaskPriority(IntEnum):
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
