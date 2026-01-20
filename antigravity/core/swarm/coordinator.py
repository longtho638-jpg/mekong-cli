"""
Swarm Coordinator - Multi-Agent Parallel Execution
===================================================

Central coordinator for swarm intelligence.
Distributes work across multiple agents with load balancing.

Binh Phap: "Da muu thien doan" - Many minds, better decisions
"""

import logging
import threading
import time
from typing import Callable, Dict, List, Optional

from antigravity.core.types import SwarmStatusDict
from .messaging import TaskQueue
from .types import AgentRole, SwarmMetrics, TaskPriority, TaskStatus
from .workers import WorkerPool

logger = logging.getLogger(__name__)


class AgentSwarm:
    """
    Multi-Agent Swarm with Parallel Execution.

    Features:
    - Parallel task distribution
    - Load balancing across agents
    - Swarm intelligence for decisions
    - Fault tolerance and recovery
    """

    def __init__(self, max_workers: int = 10, enable_metrics: bool = True) -> None:
        self.max_workers = max_workers
        self.enable_metrics = enable_metrics

        self._task_queue = TaskQueue()
        self._worker_pool = WorkerPool(max_workers=max_workers)

        self._lock = threading.Lock()
        self._running = False
        self.metrics = SwarmMetrics()

        logger.info(f"AgentSwarm initialized with {max_workers} workers")

    def register_agent(
        self,
        name: str,
        handler: Callable,
        role: AgentRole = AgentRole.WORKER,
        specialties: Optional[List[str]] = None,
    ) -> str:
        """Register an agent with the swarm."""
        agent_id = self._worker_pool.register(name, handler, role, specialties)

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
        task_id = self._task_queue.submit(name, payload, priority, timeout_seconds)

        with self._lock:
            self.metrics.total_tasks += 1

        if self._running:
            self._try_assign_tasks()

        return task_id

    def _try_assign_tasks(self) -> None:
        """Try to assign pending tasks to available agents."""
        with self._lock:
            available_agents = self._worker_pool.get_available_workers()

            for agent in available_agents:
                if self._task_queue.is_empty():
                    break

                # Find best task for this agent
                for task_id in self._task_queue.iter_queue():
                    task = self._task_queue.get_task(task_id)
                    if task and self._worker_pool.find_best_agent(task, [agent]):
                        self._assign_task(task_id, agent.id)
                        break

    def _assign_task(self, task_id: str, agent_id: str) -> None:
        """Assign task to agent."""
        task = self._task_queue.get_task(task_id)
        agent = self._worker_pool.agents.get(agent_id)

        if not task or not agent:
            return

        task.status = TaskStatus.ASSIGNED
        task.assigned_agent = agent_id
        self._worker_pool.mark_busy(agent_id)

        self._task_queue.remove(task_id)
        self.metrics.idle_agents -= 1
        self.metrics.busy_agents += 1

        # Execute in worker pool
        self._worker_pool.execute_task(
            task, agent, self._on_task_complete, self.metrics
        )

        logger.info(f"Task {task.name} assigned to {agent.name}")

    def _on_task_complete(self) -> None:
        """Callback when task completes."""
        with self._lock:
            self.metrics.busy_agents -= 1
            self.metrics.idle_agents += 1

        self._try_assign_tasks()

    def start(self) -> None:
        """Start the swarm."""
        self._running = True
        self._try_assign_tasks()
        logger.info("Swarm started")

    def stop(self) -> None:
        """Stop the swarm."""
        self._running = False
        self._worker_pool.shutdown(wait=True)
        logger.info("Swarm stopped")

    def get_task_result(
        self, task_id: str, wait: bool = True, timeout: Optional[float] = None
    ) -> Optional[Any]:
        """Get task result."""
        task = self._task_queue.get_task(task_id)
        if not task:
            return None

        if wait:
            start = time.time()
            while task.status not in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                if timeout and (time.time() - start) > timeout:
                    return None
                time.sleep(0.1)

        return task.result if task.status == TaskStatus.COMPLETED else None

    def get_metrics(self) -> SwarmMetrics:
        """Get swarm metrics."""
        self.metrics.avg_task_time = self._worker_pool.get_avg_task_time()

        # Calculate throughput
        all_tasks = self._task_queue.get_all_tasks()
        recent_completions = [
            t
            for t in all_tasks.values()
            if t.completed_at and (time.time() - t.completed_at) < 60
        ]
        self.metrics.throughput_per_minute = len(recent_completions)

        return self.metrics

    def get_status(self) -> SwarmStatusDict:
        """Get swarm status."""
        return {
            "running": self._running,
            "agents": {
                a.id: {
                    "name": a.name,
                    "role": a.role.value,
                    "busy": a.is_busy,
                    "completed": a.tasks_completed,
                    "failed": a.tasks_failed,
                }
                for a in self._worker_pool.agents.values()
            },
            "pending_tasks": self._task_queue.get_pending_count(),
            "metrics": {
                "total_agents": self.metrics.total_agents,
                "busy_agents": self.metrics.busy_agents,
                "completed_tasks": self.metrics.completed_tasks,
                "failed_tasks": self.metrics.failed_tasks,
                "avg_task_time": self.metrics.avg_task_time,
            },
        }

    # Expose internal components for advanced usage
    @property
    def tasks(self) -> Dict[str, object]:
        """Access to tasks dict for backward compatibility."""
        return self._task_queue.tasks

    @property
    def agents(self) -> Dict[str, object]:
        """Access to agents dict for backward compatibility."""
        return self._worker_pool.agents

    @property
    def task_queue(self) -> List[str]:
        """Access to task queue for backward compatibility."""
        return self._task_queue.queue


__all__ = ["AgentSwarm"]
