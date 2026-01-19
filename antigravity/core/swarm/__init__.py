"""
Agent Swarm - Multi-Agent Parallel Execution
=============================================

Swarm intelligence for parallel task execution.
Distributes work across multiple agents with load balancing.

Binh Phap: "Da muu thien doan" - Many minds, better decisions

Modules:
- types: Enums and dataclasses
- messaging: Task queue management
- workers: Worker pool and execution
- coordinator: Main swarm coordinator
"""

from .coordinator import AgentSwarm
from .messaging import TaskQueue
from .types import (
    AgentRole,
    SwarmAgent,
    SwarmMetrics,
    SwarmTask,
    TaskPriority,
    TaskStatus,
)
from .workers import WorkerPool

__all__ = [
    # Core coordinator
    "AgentSwarm",
    # Types
    "AgentRole",
    "TaskPriority",
    "TaskStatus",
    "SwarmTask",
    "SwarmAgent",
    "SwarmMetrics",
    # Internal components (for advanced usage)
    "TaskQueue",
    "WorkerPool",
]
