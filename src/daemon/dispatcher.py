"""
Dispatcher — Task dispatcher with load balancing.

Coordinates WorkerPool and TaskRouter to dispatch tasks to available workers.

Features:
- Round-robin and least-loaded load balancing
- Task dispatch with timeout
- Dead letter queue integration
- Mission logging to journal
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Callable

from .worker_pool import WorkerPool, WorkerInfo, WorkerState
from .task_router import TaskRouter, Task

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"


class LoadBalanceStrategy(Enum):
    """Load balancing strategies."""

    ROUND_ROBIN = "round_robin"
    LEAST_LOADED = "least_loaded"
    CAPABILITY_FIRST = "capability_first"


@dataclass
class DispatchResult:
    """Result of a task dispatch."""

    success: bool
    task_id: str
    worker_name: str | None = None
    error: str | None = None
    duration_ms: int = 0


class Dispatcher:
    """
    Dispatches tasks to workers using configurable load balancing.

    Usage:
        dispatcher = Dispatcher()
        result = dispatcher.dispatch(task, strategy=LoadBalanceStrategy.LEAST_LOADED)
        if result.success:
            print(f"Task {task.task_id} dispatched to {result.worker_name}")
    """

    def __init__(
        self,
        worker_pool: WorkerPool | None = None,
        task_router: TaskRouter | None = None,
        strategy: LoadBalanceStrategy = LoadBalanceStrategy.ROUND_ROBIN,
    ) -> None:
        self.worker_pool = worker_pool or WorkerPool()
        self.task_router = task_router or TaskRouter()
        self.strategy = strategy
        self._round_robin_index = 0
        self._dispatch_history: list[DispatchResult] = []

    def dispatch(
        self,
        task: Task | None = None,
        description: str | None = None,
        priority: str = "MEDIUM",
        capability: str | None = None,
        timeout_sec: int = 300,
    ) -> DispatchResult:
        """
        Dispatch a task to an available worker.

        Args:
            task: Existing task to dispatch (optional)
            description: Task description (if creating new task)
            priority: Task priority (if creating new task)
            capability: Required worker capability
            timeout_sec: Task timeout in seconds

        Returns:
            DispatchResult with success status and worker assignment.
        """
        start_time = time.time()

        # Create task if not provided
        if task is None:
            if description:
                task = self.task_router.enqueue(
                    description=description,
                    priority=priority,
                    capability=capability or "general",
                )
            else:
                # Get next task from queue
                task = self.task_router.get_next_task(capability)
                if not task:
                    return DispatchResult(
                        success=False,
                        task_id="",
                        error="No pending tasks in queue",
                    )

        # Find available worker
        worker = self._select_worker(capability=task.capability)
        if not worker:
            # Re-queue task
            self.task_router.enqueue(
                description=task.description,
                priority=task.priority,
                capability=task.capability,
                payload=task.payload,
            )
            return DispatchResult(
                success=False,
                task_id=task.task_id,
                error="No available workers",
            )

        # Mark worker as busy
        self.worker_pool.mark_busy(worker.id)
        task.assigned_to = worker.name

        # Dispatch task (in real implementation, this would call the worker)
        # For now, we'll just mark it as dispatched
        logger.info(f"[Dispatcher] Dispatched {task.task_id} to {worker.name}")

        duration_ms = int((time.time() - start_time) * 1000)

        result = DispatchResult(
            success=True,
            task_id=task.task_id,
            worker_name=worker.name,
            duration_ms=duration_ms,
        )

        self._dispatch_history.append(result)
        if len(self._dispatch_history) > 100:
            self._dispatch_history = self._dispatch_history[-100:]

        return result

    def _select_worker(self, capability: str | None = None) -> WorkerInfo | None:
        """
        Select a worker based on load balancing strategy.

        Args:
            capability: Optional capability filter

        Returns:
            Selected WorkerInfo or None.
        """
        available = self.worker_pool.get_available_worker(capability)

        if not available:
            return None

        if self.strategy == LoadBalanceStrategy.ROUND_ROBIN:
            return self._round_robin_select(capability)
        elif self.strategy == LoadBalanceStrategy.LEAST_LOADED:
            return self._least_loaded_select(capability)
        else:
            return available

    def _round_robin_select(self, capability: str | None = None) -> WorkerInfo | None:
        """Select worker using round-robin."""
        workers = self.worker_pool.list_workers()
        if not workers:
            return None

        # Filter by capability and idle state
        available = [
            w for w in workers
            if w.state == WorkerState.IDLE and (capability is None or w.capability == capability)
        ]

        if not available:
            return None

        # Round-robin selection
        self._round_robin_index = (self._round_robin_index + 1) % len(available)
        return available[self._round_robin_index]

    def _least_loaded_select(self, capability: str | None = None) -> WorkerInfo | None:
        """Select worker with lowest current load (CPU)."""
        workers = self.worker_pool.list_workers()
        if not workers:
            return None

        # Filter by capability and idle state
        available = [
            w for w in workers
            if w.state == WorkerState.IDLE and (capability is None or w.capability == capability)
        ]

        if not available:
            return None

        # Select worker with lowest CPU
        return min(available, key=lambda w: w.cpu)

    def complete_task(self, task_id: str, result: Any = None) -> None:
        """
        Mark a task as completed and free the worker.

        Args:
            task_id: Task ID that completed
            result: Optional result data
        """
        # Get task from router
        task = self.task_router._active_tasks.get(task_id)
        if task and task.assigned_to:
            self.worker_pool.mark_idle(task.assigned_to)
        self.task_router.complete(task_id, result)

    def fail_task(self, task_id: str, error: str) -> None:
        """
        Mark a task as failed and free the worker.

        Args:
            task_id: Task ID that failed
            error: Error message
        """
        task = self.task_router._active_tasks.get(task_id)
        if task and task.assigned_to:
            self.worker_pool.mark_failed(task.assigned_to)
        self.task_router.fail(task_id, error)

    def get_stats(self) -> dict[str, Any]:
        """Get dispatcher statistics."""
        pool_stats = self.worker_pool.get_stats()
        queue_stats = self.task_router.get_stats()

        return {
            "workers": {
                "total": pool_stats.total_workers,
                "idle": pool_stats.idle_workers,
                "busy": pool_stats.busy_workers,
                "offline": pool_stats.offline_workers,
                "avg_cpu": round(pool_stats.avg_cpu, 2),
                "avg_memory_mb": round(pool_stats.avg_memory_mb, 1),
            },
            "queue": {
                "pending": queue_stats.pending,
                "active": queue_stats.active,
                "completed": queue_stats.completed,
                "failed": queue_stats.failed,
                "critical_pending": queue_stats.critical_pending,
            },
            "dispatch": {
                "total_dispatched": len(self._dispatch_history),
                "strategy": self.strategy.value,
            },
        }

    async def dispatch_loop(
        self,
        process_task: Callable[[Task], Any],
        interval_sec: float = 1.0,
    ) -> None:
        """
        Continuous dispatch loop for autonomous operation.

        Args:
            process_task: Async function to process each task
            interval_sec: Time between dispatch attempts
        """
        logger.info("[Dispatcher] Starting dispatch loop")

        while True:
            try:
                # Try to dispatch a task
                result = self.dispatch()
                if result.success:
                    # Process task asynchronously
                    asyncio.create_task(self._process_and_complete(result.task_id, process_task))
                else:
                    # No tasks or workers available
                    await asyncio.sleep(interval_sec)

            except asyncio.CancelledError:
                logger.info("[Dispatcher] Dispatch loop cancelled")
                break
            except Exception as e:
                logger.exception(f"[Dispatcher] Error in dispatch loop: {e}")
                await asyncio.sleep(interval_sec)

    async def _process_and_complete(self, task_id: str, process_fn: Callable[[Task], Any]) -> None:
        """Process a task and mark it complete or failed."""
        task = self.task_router._active_tasks.get(task_id)
        if not task:
            return

        try:
            start = time.time()
            await process_fn(task)
            duration_ms = int((time.time() - start) * 1000)

            self.complete_task(task_id, result={"duration_ms": duration_ms})
            logger.info(f"[Dispatcher] Task {task_id} completed in {duration_ms}ms")

        except Exception as e:
            logger.exception(f"[Dispatcher] Task {task_id} failed: {e}")
            self.fail_task(task_id, error=str(e))
