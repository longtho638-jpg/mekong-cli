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

from .types import (
    AgentRole,
    SwarmAgent,
    SwarmMetrics,
    SwarmTask,
    TaskPriority,
    TaskStatus,
    AgentMessage,
    MessageType
)
from .bus import MessageBus
from .agent import BaseSwarmAgent
from .orchestrator import SwarmOrchestrator

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
