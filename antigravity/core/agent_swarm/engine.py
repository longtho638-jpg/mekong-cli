"""
Agent Swarm Engine.
"""
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, List, Optional

from antigravity.core.types import SwarmStatusDict

from .enums import AgentRole, TaskPriority
from .executor import TaskExecutor
from .models import SwarmMetrics
from .registry import AgentRegistry
from .task_manager import TaskManager

logger = logging.getLogger(__name__)


class AgentSwarm:
    """
    Multi-Agent Swarm with Parallel Execution

    Features:
    - Parallel task distribution
    - Load balancing across agents
    - Swarm intelligence for decisions
    - Fault tolerance and recovery
    """

    def __init__(self, max_workers: int = 10, enable_metrics: bool = True):
        self.max_workers = max_workers
        self.enable_metrics = enable_metrics

        # Components
        self.registry = AgentRegistry()
        self.task_manager = TaskManager()

        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._running = False

        self.metrics = SwarmMetrics()
        self._task_times: List[float] = []

        # Task executor (handles assignment and execution)
        self._task_executor = TaskExecutor(self)

        logger.info(f"AgentSwarm initialized with {max_workers} workers")

    def register_agent(
        self,
        name: str,
        handler: Callable,
        role: AgentRole = AgentRole.WORKER,
        specialties: List[str] = None,
    ) -> str:
        """Register an agent with the swarm."""
        agent_id = self.registry.register(name, handler, role, specialties)

        with self._lock:
            self.metrics.total_agents += 1
            self.metrics.idle_agents += 1

        return agent_id

    def submit_task(
        self,
        name: str,
        payload: object,
        priority: TaskPriority = TaskPriority.NORMAL,
        timeout_seconds: int = 300,
    ) -> str:
        """Submit a task to the swarm."""
        task_id = self.task_manager.submit_task(name, payload, priority, timeout_seconds)

        with self._lock:
            self.metrics.total_tasks += 1

        # Auto-assign if swarm is running
        if self._running:
            self._task_executor.try_assign_tasks()

        return task_id

    def start(self):
        """Start the swarm."""
        self._running = True
        self._task_executor.try_assign_tasks()
        logger.info("Swarm started")

    def stop(self):
        """Stop the swarm."""
        self._running = False
        self._executor.shutdown(wait=True)
        logger.info("Swarm stopped")

    def get_task_result(
        self, task_id: str, wait: bool = True, timeout: float = None
    ) -> object:
        """Get task result."""
        return self.task_manager.get_task_result(task_id, wait, timeout)

    def get_metrics(self) -> SwarmMetrics:
        """Get swarm metrics."""
        if self._task_times:
            self.metrics.avg_task_time = sum(self._task_times) / len(self._task_times)

        # Calculate throughput
        all_tasks = self.task_manager.tasks.values()
        recent_completions = [
            t for t in all_tasks if t.completed_at and (time.time() - t.completed_at) < 60
        ]
        self.metrics.throughput_per_minute = len(recent_completions)

        return self.metrics

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
            for a in self.registry.agents.values()
        }

        return {
            "running": self._running,
            "agents": agents_status,
            "pending_tasks": self.task_manager.get_pending_count(),
            "metrics": {
                "total_agents": self.metrics.total_agents,
                "busy_agents": self.metrics.busy_agents,
                "completed_tasks": self.metrics.completed_tasks,
                "failed_tasks": self.metrics.failed_tasks,
                "avg_task_time": self.metrics.avg_task_time,
            },
        }
