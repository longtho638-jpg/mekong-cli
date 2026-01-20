"""
🐝 Agent Swarm - Multi-Agent Parallel Execution
================================================

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.agent_swarm package.
"""

from antigravity.core.agent_swarm import (
    AgentRole,
    AgentSwarm,
    SwarmAgent,
    SwarmMetrics,
    SwarmTask,
    TaskPriority,
    TaskStatus,
    get_swarm,
    get_task_result,
    register_agent,
    start_swarm,
    stop_swarm,
    submit_task,
)

__all__ = [
    "AgentSwarm",
    "SwarmAgent",
    "SwarmTask",
    "SwarmMetrics",
    "AgentRole",
    "TaskPriority",
    "TaskStatus",
    "get_swarm",
    "register_agent",
    "submit_task",
    "get_task_result",
    "start_swarm",
    "stop_swarm",
]
