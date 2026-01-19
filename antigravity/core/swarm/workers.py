"""
Swarm Workers - Agent Management and Task Execution
====================================================

Handles worker registration, assignment, and execution.

Binh Phap: "Binh quy than toc" - Speed is the essence of war
"""

import logging
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Dict, List, Optional

from .types import AgentRole, SwarmAgent, SwarmMetrics, SwarmTask, TaskStatus

logger = logging.getLogger(__name__)


class WorkerPool:
    """
    Worker pool for managing agents and task execution.

    Features:
    - Agent registration and management
    - Load balancing across workers
    - Parallel execution via thread pool
    """

    def __init__(self, max_workers: int = 10) -> None:
        self.max_workers = max_workers
        self.agents: Dict[str, SwarmAgent] = {}
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._task_times: List[float] = []

    def register(
        self,
        name: str,
        handler: Callable,
        role: AgentRole = AgentRole.WORKER,
        specialties: Optional[List[str]] = None,
    ) -> str:
        """Register an agent with the pool."""
        agent_id = f"agent_{uuid.uuid4().hex[:8]}"

        agent = SwarmAgent(
            id=agent_id,
            name=name,
            role=role,
            handler=handler,
            specialties=specialties or [],
        )

        self.agents[agent_id] = agent
        logger.info(f"Agent registered: {name} ({role.value})")
        return agent_id

    def get_available_workers(self) -> List[SwarmAgent]:
        """Get list of available (non-busy) workers."""
        return [
            a
            for a in self.agents.values()
            if not a.is_busy and a.role in [AgentRole.WORKER, AgentRole.SPECIALIST]
        ]

    def find_best_agent(
        self, task: SwarmTask, available_agents: List[SwarmAgent]
    ) -> Optional[SwarmAgent]:
        """Find best agent for a task based on specialties."""
        for agent in available_agents:
            if agent.role == AgentRole.SPECIALIST:
                if any(s in task.name.lower() for s in agent.specialties):
                    return agent
            else:
                return agent
        return None

    def mark_busy(self, agent_id: str) -> None:
        """Mark agent as busy."""
        if agent_id in self.agents:
            self.agents[agent_id].is_busy = True

    def mark_available(self, agent_id: str) -> None:
        """Mark agent as available."""
        if agent_id in self.agents:
            self.agents[agent_id].is_busy = False
            self.agents[agent_id].last_active = time.time()

    def execute_task(
        self,
        task: SwarmTask,
        agent: SwarmAgent,
        on_complete: Callable,
        metrics: SwarmMetrics,
    ) -> None:
        """Execute task in agent via thread pool."""
        self._executor.submit(
            self._run_task, task, agent, on_complete, metrics
        )

    def _run_task(
        self,
        task: SwarmTask,
        agent: SwarmAgent,
        on_complete: Callable,
        metrics: SwarmMetrics,
    ) -> None:
        """Run task execution in thread."""
        task.status = TaskStatus.RUNNING
        task.started_at = time.time()

        try:
            result = agent.handler(task.payload)

            # Success
            task.status = TaskStatus.COMPLETED
            task.result = result
            task.completed_at = time.time()

            execution_time = task.completed_at - task.started_at
            self._task_times.append(execution_time)

            agent.tasks_completed += 1
            agent.avg_execution_time = (
                agent.avg_execution_time * (agent.tasks_completed - 1) + execution_time
            ) / agent.tasks_completed

            metrics.completed_tasks += 1
            logger.info(f"Task {task.name} completed in {execution_time:.2f}s")

        except Exception as e:
            # Failure
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = time.time()

            agent.tasks_failed += 1
            metrics.failed_tasks += 1
            logger.error(f"Task {task.name} failed: {e}")

        finally:
            self.mark_available(agent.id)
            on_complete()

    def get_avg_task_time(self) -> float:
        """Get average task execution time."""
        if self._task_times:
            return sum(self._task_times) / len(self._task_times)
        return 0.0

    def shutdown(self, wait: bool = True) -> None:
        """Shutdown the thread pool."""
        self._executor.shutdown(wait=wait)

    def get_agent_count(self) -> int:
        """Get total agent count."""
        return len(self.agents)

    def get_busy_count(self) -> int:
        """Get count of busy agents."""
        return sum(1 for a in self.agents.values() if a.is_busy)

    def get_idle_count(self) -> int:
        """Get count of idle agents."""
        return sum(1 for a in self.agents.values() if not a.is_busy)


__all__ = ["WorkerPool"]
