import logging
import time
from antigravity.core.types import SwarmStatusDict
from typing import Callable, List, Optional

from .enums import AgentRole, TaskPriority
from .models import SwarmMetrics
from .state import SwarmState

logger = logging.getLogger(__name__)

class SwarmCoordinator:
    """
    Coordinates agent registration and status reporting for the swarm.
    """
    def __init__(self, swarm: 'AgentSwarm', state: SwarmState):
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
            self.state.metrics.avg_task_time = sum(self.state.task_times) / len(self.state.task_times)

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
