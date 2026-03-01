"""
Mekong CLI - Priority Task Queue

Temporal-inspired task queue with priority levels, backpressure,
and dead letter queue (DLQ) for failed tasks.

Maps to Temporal's Task Queue: workers poll for tasks,
priority determines dispatch order, DLQ captures exhausted retries.
"""

import time
import heapq
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any, Dict, List, Optional


class TaskPriority(IntEnum):
    """Task priority levels (lower number = higher priority)."""

    CRITICAL = 0
    HIGH = 1
    NORMAL = 2
    LOW = 3
    BACKGROUND = 4


@dataclass(order=True)
class QueuedTask:
    """A task in the priority queue."""

    priority: int
    enqueued_at: float = field(compare=True)
    task_id: str = field(compare=False, default="")
    goal: str = field(compare=False, default="")
    payload: Dict[str, Any] = field(compare=False, default_factory=dict)
    attempt: int = field(compare=False, default=0)
    max_attempts: int = field(compare=False, default=3)
    source: str = field(compare=False, default="manual")


@dataclass
class DeadLetterEntry:
    """A task that exhausted all retry attempts."""

    task: QueuedTask
    final_error: str
    failed_at: float = field(default_factory=time.time)


class PriorityTaskQueue:
    """
    Priority-based task queue with DLQ.

    Temporal pattern: workers poll the queue for tasks.
    Higher priority tasks are dispatched first.
    Failed tasks exceeding max_attempts go to DLQ.
    """

    def __init__(self, max_size: int = 1000) -> None:
        """Initialize queue with optional size limit for backpressure.

        Args:
            max_size: Maximum queue size (0 = unlimited)
        """
        self._heap: List[QueuedTask] = []
        self._dlq: List[DeadLetterEntry] = []
        self._max_size = max_size
        self._total_enqueued: int = 0
        self._total_completed: int = 0

    def enqueue(
        self,
        task_id: str,
        goal: str,
        priority: TaskPriority = TaskPriority.NORMAL,
        payload: Optional[Dict[str, Any]] = None,
        max_attempts: int = 3,
        source: str = "manual",
    ) -> Optional[QueuedTask]:
        """Add a task to the queue. Returns None if queue is full (backpressure).

        Args:
            task_id: Unique task identifier
            goal: Goal description for the task
            priority: Task priority level
            payload: Additional task data
            max_attempts: Max retry attempts before DLQ
            source: Origin of the task (manual, auto-cto, webhook, etc.)

        Returns:
            QueuedTask if enqueued, None if queue full
        """
        if self._max_size > 0 and len(self._heap) >= self._max_size:
            return None

        task = QueuedTask(
            priority=priority.value,
            enqueued_at=time.time(),
            task_id=task_id,
            goal=goal,
            payload=payload or {},
            max_attempts=max_attempts,
            source=source,
        )
        heapq.heappush(self._heap, task)
        self._total_enqueued += 1
        return task

    def poll(self) -> Optional[QueuedTask]:
        """Remove and return the highest-priority task. Returns None if empty."""
        if not self._heap:
            return None
        return heapq.heappop(self._heap)

    def peek(self) -> Optional[QueuedTask]:
        """View the highest-priority task without removing it."""
        return self._heap[0] if self._heap else None

    def mark_completed(self, task: QueuedTask) -> None:
        """Record task completion for metrics."""
        self._total_completed += 1

    def mark_failed(self, task: QueuedTask, error: str) -> bool:
        """Handle task failure. Re-enqueues or moves to DLQ.

        Args:
            task: The failed task
            error: Error message

        Returns:
            True if re-enqueued for retry, False if moved to DLQ
        """
        task.attempt += 1
        if task.attempt < task.max_attempts:
            heapq.heappush(self._heap, task)
            return True
        self._dlq.append(DeadLetterEntry(task=task, final_error=error))
        return False

    def get_dlq(self) -> List[DeadLetterEntry]:
        """Return all dead letter entries."""
        return list(self._dlq)

    def retry_from_dlq(self, task_id: str) -> bool:
        """Move a task from DLQ back to queue for retry.

        Args:
            task_id: ID of the task to retry

        Returns:
            True if found and re-enqueued
        """
        for i, entry in enumerate(self._dlq):
            if entry.task.task_id == task_id:
                task = entry.task
                task.attempt = 0
                heapq.heappush(self._heap, task)
                self._dlq.pop(i)
                return True
        return False

    @property
    def size(self) -> int:
        """Current number of tasks in the queue."""
        return len(self._heap)

    @property
    def dlq_size(self) -> int:
        """Number of tasks in the dead letter queue."""
        return len(self._dlq)

    @property
    def is_empty(self) -> bool:
        """Check if queue has no pending tasks."""
        return len(self._heap) == 0

    def stats(self) -> Dict[str, Any]:
        """Return queue statistics."""
        return {
            "pending": self.size,
            "dlq": self.dlq_size,
            "total_enqueued": self._total_enqueued,
            "total_completed": self._total_completed,
            "completion_rate": (
                (self._total_completed / self._total_enqueued * 100)
                if self._total_enqueued > 0
                else 0.0
            ),
        }

    def clear(self) -> None:
        """Remove all tasks from queue and DLQ."""
        self._heap.clear()
        self._dlq.clear()


__all__ = [
    "TaskPriority",
    "QueuedTask",
    "DeadLetterEntry",
    "PriorityTaskQueue",
]
