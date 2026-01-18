"""
🐝 Agent Swarm - Multi-Agent Parallel Execution
================================================

Swarm intelligence for parallel task execution.
Distributes work across multiple agents with load balancing.

Binh Pháp: "Đa mưu thiện đoán" - Many minds, better decisions
"""

import logging
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


class AgentRole(Enum):
    """Agent roles in the swarm."""

    COORDINATOR = "coordinator"
    WORKER = "worker"
    SPECIALIST = "specialist"
    SCOUT = "scout"
    GUARDIAN = "guardian"


class TaskPriority(Enum):
    """Task priority levels."""

    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5


class TaskStatus(Enum):
    """Task execution status."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class SwarmTask:
    """Task for swarm execution."""

    id: str
    name: str
    payload: Any
    priority: TaskPriority = TaskPriority.NORMAL
    status: TaskStatus = TaskStatus.PENDING
    assigned_agent: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    timeout_seconds: int = 300


@dataclass
class SwarmAgent:
    """Individual agent in the swarm."""

    id: str
    name: str
    role: AgentRole
    handler: Callable
    is_busy: bool = False
    tasks_completed: int = 0
    tasks_failed: int = 0
    avg_execution_time: float = 0.0
    last_active: float = field(default_factory=time.time)
    specialties: List[str] = field(default_factory=list)


@dataclass
class SwarmMetrics:
    """Swarm performance metrics."""

    total_agents: int = 0
    busy_agents: int = 0
    idle_agents: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    avg_task_time: float = 0.0
    throughput_per_minute: float = 0.0


class AgentSwarm:
    """
    🐝 Multi-Agent Swarm with Parallel Execution

    Features:
    - Parallel task distribution
    - Load balancing across agents
    - Swarm intelligence for decisions
    - Fault tolerance and recovery
    """

    def __init__(self, max_workers: int = 10, enable_metrics: bool = True):
        self.max_workers = max_workers
        self.enable_metrics = enable_metrics

        self.agents: Dict[str, SwarmAgent] = {}
        self.tasks: Dict[str, SwarmTask] = {}
        self.task_queue: List[str] = []

        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._running = False

        self.metrics = SwarmMetrics()
        self._task_times: List[float] = []

        logger.info(f"🐝 AgentSwarm initialized with {max_workers} workers")

    def register_agent(
        self,
        name: str,
        handler: Callable,
        role: AgentRole = AgentRole.WORKER,
        specialties: List[str] = None,
    ) -> str:
        """Register an agent with the swarm."""
        agent_id = f"agent_{uuid.uuid4().hex[:8]}"

        agent = SwarmAgent(
            id=agent_id,
            name=name,
            role=role,
            handler=handler,
            specialties=specialties or [],
        )

        with self._lock:
            self.agents[agent_id] = agent
            self.metrics.total_agents += 1
            self.metrics.idle_agents += 1

        logger.info(f"🔗 Agent registered: {name} ({role.value})")
        return agent_id

    def submit_task(
        self,
        name: str,
        payload: Any,
        priority: TaskPriority = TaskPriority.NORMAL,
        timeout_seconds: int = 300,
    ) -> str:
        """Submit a task to the swarm."""
        task_id = f"task_{uuid.uuid4().hex[:8]}"

        task = SwarmTask(
            id=task_id,
            name=name,
            payload=payload,
            priority=priority,
            timeout_seconds=timeout_seconds,
        )

        with self._lock:
            self.tasks[task_id] = task
            self._insert_by_priority(task_id, priority)
            self.metrics.total_tasks += 1

        logger.info(f"📋 Task submitted: {name} (priority: {priority.value})")

        # Auto-assign if swarm is running
        if self._running:
            self._try_assign_tasks()

        return task_id

    def _insert_by_priority(self, task_id: str, priority: TaskPriority):
        """Insert task in queue by priority."""
        insert_pos = 0
        for i, tid in enumerate(self.task_queue):
            if self.tasks[tid].priority.value > priority.value:
                insert_pos = i
                break
            insert_pos = i + 1
        self.task_queue.insert(insert_pos, task_id)

    def _try_assign_tasks(self):
        """Try to assign pending tasks to available agents."""
        with self._lock:
            available_agents = [
                a
                for a in self.agents.values()
                if not a.is_busy and a.role in [AgentRole.WORKER, AgentRole.SPECIALIST]
            ]

            for agent in available_agents:
                if not self.task_queue:
                    break

                # Find best task for this agent
                task_id = self._find_best_task(agent)
                if task_id:
                    self._assign_task(task_id, agent)

    def _find_best_task(self, agent: SwarmAgent) -> Optional[str]:
        """Find best task for agent based on specialties."""
        for task_id in self.task_queue:
            task = self.tasks[task_id]

            # Specialist matching
            if agent.role == AgentRole.SPECIALIST:
                if any(s in task.name.lower() for s in agent.specialties):
                    return task_id
            else:
                return task_id

        return None

    def _assign_task(self, task_id: str, agent: SwarmAgent):
        """Assign task to agent."""
        task = self.tasks[task_id]
        task.status = TaskStatus.ASSIGNED
        task.assigned_agent = agent.id
        agent.is_busy = True

        self.task_queue.remove(task_id)
        self.metrics.idle_agents -= 1
        self.metrics.busy_agents += 1

        # Execute in thread pool
        self._executor.submit(self._execute_task, task_id, agent.id)

        logger.info(f"📌 Task {task.name} assigned to {agent.name}")

    def _execute_task(self, task_id: str, agent_id: str):
        """Execute task in agent."""
        task = self.tasks[task_id]
        agent = self.agents[agent_id]

        task.status = TaskStatus.RUNNING
        task.started_at = time.time()

        try:
            # Execute handler
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

            with self._lock:
                self.metrics.completed_tasks += 1

            logger.info(f"✅ Task {task.name} completed in {execution_time:.2f}s")

        except Exception as e:
            # Failure
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = time.time()

            agent.tasks_failed += 1

            with self._lock:
                self.metrics.failed_tasks += 1

            logger.error(f"❌ Task {task.name} failed: {e}")

        finally:
            agent.is_busy = False
            agent.last_active = time.time()

            with self._lock:
                self.metrics.busy_agents -= 1
                self.metrics.idle_agents += 1

            # Try to assign more tasks
            self._try_assign_tasks()

    def start(self):
        """Start the swarm."""
        self._running = True
        self._try_assign_tasks()
        logger.info("🚀 Swarm started")

    def stop(self):
        """Stop the swarm."""
        self._running = False
        self._executor.shutdown(wait=True)
        logger.info("🛑 Swarm stopped")

    def get_task_result(
        self, task_id: str, wait: bool = True, timeout: float = None
    ) -> Optional[Any]:
        """Get task result."""
        task = self.tasks.get(task_id)
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
        if self._task_times:
            self.metrics.avg_task_time = sum(self._task_times) / len(self._task_times)

        # Calculate throughput
        recent_completions = [
            t for t in self.tasks.values() if t.completed_at and (time.time() - t.completed_at) < 60
        ]
        self.metrics.throughput_per_minute = len(recent_completions)

        return self.metrics

    def get_status(self) -> Dict[str, Any]:
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
                for a in self.agents.values()
            },
            "pending_tasks": len(self.task_queue),
            "metrics": {
                "total_agents": self.metrics.total_agents,
                "busy_agents": self.metrics.busy_agents,
                "completed_tasks": self.metrics.completed_tasks,
                "failed_tasks": self.metrics.failed_tasks,
                "avg_task_time": self.metrics.avg_task_time,
            },
        }


# Global swarm instance
_swarm: Optional[AgentSwarm] = None


def get_swarm(max_workers: int = 10) -> AgentSwarm:
    """Get global swarm instance."""
    global _swarm
    if _swarm is None:
        _swarm = AgentSwarm(max_workers=max_workers)
    return _swarm


# Convenience functions
def register_agent(name: str, handler: Callable, role: AgentRole = AgentRole.WORKER) -> str:
    """Register an agent with the swarm."""
    return get_swarm().register_agent(name, handler, role)


def submit_task(name: str, payload: Any, priority: TaskPriority = TaskPriority.NORMAL) -> str:
    """Submit a task to the swarm."""
    return get_swarm().submit_task(name, payload, priority)


def get_task_result(task_id: str) -> Optional[Any]:
    """Get task result."""
    return get_swarm().get_task_result(task_id)


def start_swarm():
    """Start the swarm."""
    get_swarm().start()


def stop_swarm():
    """Stop the swarm."""
    get_swarm().stop()


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
