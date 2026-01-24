"""
Task Executor - Handles task assignment and execution.
Extracted from engine.py for modularization.
"""
import logging
import time
from typing import TYPE_CHECKING, Optional

from .enums import AgentRole, TaskStatus
from .models import SwarmAgent, SwarmMetrics

if TYPE_CHECKING:
    from .engine import AgentSwarm

logger = logging.getLogger(__name__)


class TaskExecutor:
    """
    Handles task assignment and execution for the swarm.

    Responsibilities:
    - Finding best task for an agent (specialty matching)
    - Assigning tasks to agents
    - Executing tasks in thread pool
    - Updating metrics on completion/failure
    """

    def __init__(self, swarm: "AgentSwarm"):
        self.swarm = swarm

    def try_assign_tasks(self):
        """Try to assign pending tasks to available agents."""
        with self.swarm._lock:
            available_agents = self.swarm.registry.get_available_agents()

            for agent in available_agents:
                if self.swarm.task_manager.get_pending_count() == 0:
                    break

                task_id = self._find_best_task(agent)
                if task_id:
                    self._assign_task(task_id, agent)

    def _find_best_task(self, agent: SwarmAgent) -> Optional[str]:
        """Find best task for agent based on specialties."""
        queue_copy = list(self.swarm.task_manager.task_queue)

        for task_id in queue_copy:
            task = self.swarm.task_manager.get_task(task_id)
            if not task:
                continue

            # Specialist matching
            if agent.role == AgentRole.SPECIALIST:
                if any(s in task.name.lower() for s in agent.specialties):
                    return task_id
            else:
                return task_id

        return None

    def _assign_task(self, task_id: str, agent: SwarmAgent):
        """Assign task to agent."""
        task = self.swarm.task_manager.get_task(task_id)
        if not task:
            return

        task.status = TaskStatus.ASSIGNED
        task.assigned_agent = agent.id
        agent.is_busy = True

        self.swarm.task_manager.remove_task_from_queue(task_id)

        self.swarm.metrics.idle_agents -= 1
        self.swarm.metrics.busy_agents += 1

        # Execute in thread pool
        self.swarm._executor.submit(self._execute_task, task_id, agent.id)

        self.swarm.notify_update()
        logger.info(f"Task {task.name} assigned to {agent.name}")

    def _execute_task(self, task_id: str, agent_id: str):
        """Execute task in agent."""
        task = self.swarm.task_manager.get_task(task_id)
        agent = self.swarm.registry.get_agent(agent_id)

        if not task or not agent:
            logger.error(f"Missing task {task_id} or agent {agent_id} during execution")
            return

        task.status = TaskStatus.RUNNING
        task.started_at = time.time()

        # Sync to Kanban
        try:
            self.swarm.task_manager.board_manager.sync_task_status(task.id, "RUNNING")
        except Exception as e:
            logger.warning(f"Failed to sync Kanban status (RUNNING): {e}")

        self.swarm.notify_update()

        try:
            result = agent.handler(task.payload)
            self._handle_success(task, agent, result)
        except Exception as e:
            self._handle_failure(task, agent, e)
        finally:
            self._finalize_execution(agent)

    def _handle_success(self, task, agent: SwarmAgent, result):
        """Handle successful task completion."""
        task.status = TaskStatus.COMPLETED
        task.result = result
        task.completed_at = time.time()

        execution_time = task.completed_at - task.started_at
        self.swarm._task_times.append(execution_time)

        agent.tasks_completed += 1
        agent.avg_execution_time = (
            agent.avg_execution_time * (agent.tasks_completed - 1) + execution_time
        ) / agent.tasks_completed

        with self.swarm._lock:
            self.swarm.metrics.completed_tasks += 1

        # Sync to Kanban
        try:
            self.swarm.task_manager.board_manager.sync_task_status(task.id, "COMPLETED")
        except Exception as e:
            logger.warning(f"Failed to sync Kanban status (COMPLETED): {e}")

        self.swarm.notify_update()
        logger.info(f"Task {task.name} completed in {execution_time:.2f}s")

    def _handle_failure(self, task, agent: SwarmAgent, error: Exception):
        """Handle task failure."""
        task.status = TaskStatus.FAILED
        task.error = str(error)
        task.completed_at = time.time()

        agent.tasks_failed += 1

        with self.swarm._lock:
            self.swarm.metrics.failed_tasks += 1

        # Sync to Kanban
        try:
            self.swarm.task_manager.board_manager.sync_task_status(task.id, "FAILED")
        except Exception as e:
            logger.warning(f"Failed to sync Kanban status (FAILED): {e}")

        self.swarm.notify_update()
        logger.error(f"Task {task.name} failed: {error}")

    def _finalize_execution(self, agent: SwarmAgent):
        """Finalize execution and try to assign more tasks."""
        agent.is_busy = False
        agent.last_active = time.time()

        with self.swarm._lock:
            self.swarm.metrics.busy_agents -= 1
            self.swarm.metrics.idle_agents += 1

        # Try to assign more tasks
        self.try_assign_tasks()
