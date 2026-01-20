from __future__ import annotations

import logging
import time
from antigravity.core.types import SwarmStatusDict
from typing import TYPE_CHECKING, Callable, List, Optional

from .enums import AgentRole, TaskPriority
from .models import SwarmMetrics
from .state import SwarmState

if TYPE_CHECKING:
    from . import AgentSwarm

logger = logging.getLogger(__name__)


class SwarmCoordinator:
    """
    Coordinates agent registration and status reporting for the swarm.
    """

    def __init__(self, swarm: "AgentSwarm", state: SwarmState):
        self.swarm = swarm
        self.state = state

    def register_agent(
        self,
        name: str,
        handler: Callable,
        role: AgentRole = AgentRole.WORKER,
        specialties: List[str] = None,
    ) -> str:
        """Register an agent with the swarm."""
        agent_id = self.swarm.registry.register(name, handler, role, specialties)

        with self.state.lock:
            self.state.metrics.total_agents += 1
            self.state.metrics.idle_agents += 1

        return agent_id

    def get_metrics(self) -> SwarmMetrics:
        """Get swarm metrics."""
        if self.state.task_times:
            self.state.metrics.avg_task_time = sum(self.state.task_times) / len(
                self.state.task_times
            )

        # Calculate throughput
        all_tasks = self.swarm.task_manager.tasks.values()
        recent_completions = [
            t for t in all_tasks if t.completed_at and (time.time() - t.completed_at) < 60
        ]
        self.state.metrics.throughput_per_minute = len(recent_completions)

        return self.state.metrics

    def get_status(self) -> SwarmStatusDict:
        """Get swarm status."""
        agents_status = {
            a.id: {
                "name": a.name,
                "role": a.role.value,
                "busy": a.is_busy,
                "completed": a.tasks_completed,
                "failed": a.tasks_failed,
                "success_rate": a.tasks_completed / (a.tasks_completed + a.tasks_failed) if (a.tasks_completed + a.tasks_failed) > 0 else 1.0
            }
            for a in self.swarm.registry.agents.values()
        }

        metrics = self.get_metrics()

        return {
            "running": self.state.running,
            "agents": agents_status,
            "pending_tasks": self.swarm.task_manager.get_pending_count(),
            "metrics": {
                "total_agents": metrics.total_agents,
                "busy_agents": metrics.busy_agents,
                "completed_tasks": metrics.completed_tasks,
                "failed_tasks": metrics.failed_tasks,
                "avg_task_time": metrics.avg_task_time,
            },
        }

    def find_best_agent(self, specialty: Optional[str] = None, role: Optional[AgentRole] = None) -> Optional[str]:
        """
        Finds the best available agent based on performance metrics (success rate and speed).
        """
        eligible_agents = list(self.swarm.registry.agents.values())

        if specialty:
            eligible_agents = [a for a in eligible_agents if specialty in (a.specialties or [])]

        if role:
            eligible_agents = [a for a in eligible_agents if a.role == role]

        # Filter for non-busy agents first
        available_agents = [a for a in eligible_agents if not a.is_busy]

        # If all busy, we still might need to queue, but for routing we want the 'best'
        target_list = available_agents if available_agents else eligible_agents

        if not target_list:
            return None

        def agent_score(agent):
            success_rate = agent.tasks_completed / (agent.tasks_completed + agent.tasks_failed) if (agent.tasks_completed + agent.tasks_failed) > 0 else 1.0
            # Higher success rate is better, fewer failures is better
            return success_rate

        best_agent = max(target_list, key=agent_score)
        return best_agent.id
