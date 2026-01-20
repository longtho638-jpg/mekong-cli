"""
Agent Swarm Shortcuts - Convenience functions for swarm operations.
"""
from typing import Callable, Optional

from .engine import AgentSwarm
from .enums import AgentRole, TaskPriority

# Global swarm instance
_swarm: Optional[AgentSwarm] = None


def get_swarm(max_workers: int = 10) -> AgentSwarm:
    """Get global swarm instance."""
    global _swarm
    if _swarm is None:
        _swarm = AgentSwarm(max_workers=max_workers)
    return _swarm


def reset_swarm() -> None:
    """Reset the global swarm instance (useful for testing)."""
    global _swarm
    _swarm = None


def register_agent(
    name: str, handler: Callable, role: AgentRole = AgentRole.WORKER
) -> str:
    """Register an agent with the swarm."""
    return get_swarm().register_agent(name, handler, role)


def submit_task(
    name: str, payload: object, priority: TaskPriority = TaskPriority.NORMAL
) -> str:
    """Submit a task to the swarm."""
    return get_swarm().submit_task(name, payload, priority)


def get_task_result(
    task_id: str, wait: bool = True, timeout: Optional[float] = None
) -> object:
    """Get task result."""
    return get_swarm().get_task_result(task_id, wait=wait, timeout=timeout)


def start_swarm() -> None:
    """Start the swarm."""
    get_swarm().start()


def stop_swarm() -> None:
    """Stop the swarm."""
    get_swarm().stop()
