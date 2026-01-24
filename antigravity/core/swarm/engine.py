"""
Agent Swarm Engine.
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, List, Optional

from .coordinator import SwarmCoordinator
from .enums import AgentRole, TaskPriority
from .executor import TaskExecutor
from .registry import AgentRegistry
from .state import SwarmState
from .task_manager import TaskManager

logger = logging.getLogger(__name__)


class AgentSwarm:
    """
    Multi-Agent Swarm with Parallel Execution (Facade)
    """

    def __init__(self, max_workers: int = 10, enable_metrics: bool = True):
        self.max_workers = max_workers
        self.enable_metrics = enable_metrics
        self._update_callbacks: List[Callable] = []

        # Components
        self.registry = AgentRegistry()
        self.task_manager = TaskManager()
        self.state = SwarmState()
        self.coordinator = SwarmCoordinator(self, self.state)

        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._task_executor = TaskExecutor(self)

        logger.info(f"AgentSwarm initialized with {max_workers} workers")

    @property
    def metrics(self):
        return self.state.metrics

    @property
    def _running(self):
        return self.state.running

    @_running.setter
    def _running(self, value):
        self.state.running = value

    @property
    def _lock(self):
        return self.state.lock

    @property
    def _task_times(self):
        return self.state.task_times

    def register_agent(
        self,
        name: str,
        handler: Callable[[Any], Any],
        role: AgentRole = AgentRole.WORKER,
        specialties: Optional[List[str]] = None,
    ) -> str:
        """Register an agent with the swarm."""
        return self.coordinator.register_agent(name, handler, role, specialties)

    def submit_task(
        self,
        name: str,
        payload: Any,
        priority: TaskPriority = TaskPriority.NORMAL,
        timeout_seconds: int = 300,
    ) -> str:
        """Submit a task to the swarm."""
        task_id = self.task_manager.submit_task(name, payload, priority, timeout_seconds)

        with self.state.lock:
            self.state.metrics.total_tasks += 1

        # Auto-assign if swarm is running
        if self.state.running:
            self._task_executor.try_assign_tasks()

        self.notify_update()
        return task_id

    def start(self) -> None:
        """Start the swarm."""
        self.state.running = True
        self._task_executor.try_assign_tasks()
        self.notify_update()
        logger.info("Swarm started")

    def stop(self) -> None:
        """Stop the swarm."""
        self.state.running = False
        self._executor.shutdown(wait=True)
        self.notify_update()
        logger.info("Swarm stopped")

    def get_task_result(
        self, task_id: str, wait: bool = True, timeout: Optional[float] = None
    ) -> Any:
        """Get task result."""
        return self.task_manager.get_task_result(task_id, wait, timeout)

    def get_metrics(self):
        """Get swarm metrics."""
        return self.coordinator.get_metrics()

    def get_status(self):
        """Get swarm status."""
        return self.coordinator.get_status()

    def add_update_callback(self, callback: Callable):
        """Add a callback to be called when swarm state changes."""
        self._update_callbacks.append(callback)

    def notify_update(self):
        """Notify all callbacks of an update."""
        for callback in self._update_callbacks:
            try:
                callback()
            except Exception as e:
                logger.error(f"Error in swarm update callback: {e}")
