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

from .agent import BaseSwarmAgent
from .bus import MessageBus
from .orchestrator import SwarmOrchestrator
from .types import (
    AgentMessage,
    AgentRole,
    MessageType,
    SwarmAgent,
    SwarmMetrics,
    SwarmTask,
    TaskPriority,
    TaskStatus,
)

__all__ = [
    "AgentRole",
    "TaskPriority",
    "TaskStatus",
    "SwarmTask",
    "SwarmAgent",
    "SwarmMetrics",
    "AgentMessage",
    "MessageType",
    "MessageBus",
    "BaseSwarmAgent",
    "SwarmOrchestrator"
]
