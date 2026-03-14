"""
Task Router — Intelligent task routing with priority queue.

Features:
- Priority queue (CRITICAL > HIGH > MEDIUM > LOW)
- Capability-based routing
- Task state tracking
- Dead letter queue for failed tasks
"""

from __future__ import annotations

import heapq
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"
JOURNAL_DIR = MEKONG_DIR / "journal"
JOURNAL_FILE = JOURNAL_DIR / "missions.json"

# Ensure journal directory exists
JOURNAL_DIR.mkdir(parents=True, exist_ok=True)


class TaskPriority(Enum):
    """Task priority levels."""

    CRITICAL = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3


class TaskStatus(Enum):
    """Task lifecycle states."""

    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(order=True)
class Task:
    """A task to be dispatched to a worker."""

    priority_value: int = field(compare=True)
    created_at: float = field(compare=True, default_factory=datetime.now().timestamp)
    task_id: str = field(compare=False, default_factory=lambda: str(uuid.uuid4())[:8])
    description: str = field(compare=False, default="")
    capability: str = field(compare=False, default="general")
    payload: dict[str, Any] = field(compare=False, default_factory=dict)
    status: TaskStatus = field(compare=False, default=TaskStatus.PENDING)
    assigned_to: str | None = field(compare=False, default=None)
    started_at: str | None = field(compare=False, default=None)
    completed_at: str | None = field(compare=False, default=None)
    error: str | None = field(compare=False, default=None)
    retry_count: int = field(compare=False, default=0)
    max_retries: int = field(compare=False, default=3)

    def __post_init__(self) -> None:
        if isinstance(self.priority_value, TaskPriority):
            self.priority_value = self.priority_value.value

    @property
    def priority(self) -> str:
        """Get priority as string."""
        return TaskPriority(self.priority_value).name

    def to_dict(self) -> dict[str, Any]:
        """Convert task to dictionary for JSON serialization."""
        return {
            "task_id": self.task_id,
            "description": self.description,
            "priority": self.priority,
            "capability": self.capability,
            "status": self.status.value,
            "assigned_to": self.assigned_to,
            "created_at": datetime.fromtimestamp(self.created_at).isoformat(),
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "error": self.error,
            "retry_count": self.retry_count,
        }


@dataclass
class TaskQueueStats:
    """Statistics for the task queue."""

    pending: int = 0
    active: int = 0
    completed: int = 0
    failed: int = 0
    critical_pending: int = 0


class TaskRouter:
    """
    Routes tasks to available workers based on capability and load.

    Usage:
        router = TaskRouter()
        task = router.enqueue("Build feature X", priority="HIGH", capability="builder")
        next_task = router.get_next_task()  # Returns highest priority pending task
        router.complete(task.task_id)
    """

    def __init__(self, max_size: int = 1000) -> None:
        self._queue: list[Task] = []  # Heap queue
        self._active_tasks: dict[str, Task] = {}
        self._completed_tasks: list[Task] = []
        self._dead_letter_queue: list[Task] = []
        self._max_size = max_size
        self._task_history: list[dict] = []

    def enqueue(
        self,
        description: str,
        priority: str = "MEDIUM",
        capability: str = "general",
        payload: dict[str, Any] | None = None,
        max_retries: int = 3,
    ) -> Task:
        """
        Add a task to the priority queue.

        Args:
            description: Task description
            priority: CRITICAL, HIGH, MEDIUM, or LOW
            capability: Required worker capability (builder, reviewer, tester)
            payload: Additional task data
            max_retries: Maximum retry attempts

        Returns:
            The created Task object.
        """
        priority_enum = TaskPriority[priority.upper()]
        task = Task(
            description=description,
            priority_value=priority_enum.value,
            capability=capability,
            payload=payload or {},
            max_retries=max_retries,
        )

        if len(self._queue) >= self._max_size:
            logger.warning(f"[TaskRouter] Queue at capacity ({self._max_size}), dropping task")
            return task

        heapq.heappush(self._queue, task)
        logger.info(f"[TaskRouter] Enqueued {task.task_id}: {description[:50]} (priority={priority})")

        self._task_history.append(
            {
                "event": "enqueue",
                "task_id": task.task_id,
                "timestamp": datetime.now().isoformat(),
            }
        )

        return task

    def get_next_task(self, capability: str | None = None) -> Task | None:
        """
        Get the highest priority task that matches the capability.

        Args:
            capability: Optional capability filter

        Returns:
            Task if found, None otherwise.
        """
        if not self._queue:
            return None

        # Find first task matching capability
        for i, task in enumerate(self._queue):
            if capability is None or task.capability == capability:
                # Remove from heap and return
                self._queue.pop(i)
                heapq.heapify(self._queue)
                task.status = TaskStatus.ACTIVE
                task.started_at = datetime.now().isoformat()
                self._active_tasks[task.task_id] = task
                logger.info(f"[TaskRouter] Dequeued {task.task_id} for {task.capability}")
                return task

        return None

    def complete(self, task_id: str, result: Any = None) -> None:
        """
        Mark a task as completed.

        Args:
            task_id: Task ID to complete
            result: Optional result data
        """
        if task_id not in self._active_tasks:
            logger.warning(f"[TaskRouter] Task {task_id} not found in active tasks")
            return

        task = self._active_tasks.pop(task_id)
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now().isoformat()
        self._completed_tasks.append(task)

        # Keep only last 100 completed tasks
        if len(self._completed_tasks) > 100:
            self._completed_tasks = self._completed_tasks[-100:]

        logger.info(f"[TaskRouter] Completed {task_id}")

        self._log_mission(task)

    def fail(self, task_id: str, error: str) -> Task | None:
        """
        Mark a task as failed. Returns task for retry or None if max retries exceeded.

        Args:
            task_id: Task ID that failed
            error: Error message

        Returns:
            Task to retry, or None if should go to dead letter queue.
        """
        if task_id not in self._active_tasks:
            logger.warning(f"[TaskRouter] Task {task_id} not found in active tasks")
            return None

        task = self._active_tasks.pop(task_id)
        task.error = error
        task.retry_count += 1

        logger.warning(f"[TaskRouter] Failed {task_id}: {error} (retry {task.retry_count}/{task.max_retries})")

        if task.retry_count >= task.max_retries:
            # Move to dead letter queue
            task.status = TaskStatus.FAILED
            self._dead_letter_queue.append(task)
            logger.error(f"[TaskRouter] Task {task_id} moved to dead letter queue")
            self._log_mission(task)
            return None
        else:
            # Re-queue for retry
            task.status = TaskStatus.PENDING
            task.started_at = None
            task.assigned_to = None
            heapq.heappush(self._queue, task)
            return task

    def cancel(self, task_id: str) -> bool:
        """
        Cancel a pending task.

        Args:
            task_id: Task ID to cancel

        Returns:
            True if cancelled, False if not found or already active.
        """
        # Check in queue
        for i, task in enumerate(self._queue):
            if task.task_id == task_id:
                self._queue.pop(i)
                heapq.heapify(self._queue)
                task.status = TaskStatus.CANCELLED
                logger.info(f"[TaskRouter] Cancelled {task_id}")
                return True

        # Check in active tasks
        if task_id in self._active_tasks:
            task = self._active_tasks.pop(task_id)
            task.status = TaskStatus.CANCELLED
            logger.info(f"[TaskRouter] Cancelled active task {task_id}")
            return True

        return False

    def get_stats(self) -> TaskQueueStats:
        """Get queue statistics."""
        stats = TaskQueueStats(
            pending=len(self._queue),
            active=len(self._active_tasks),
            completed=len(self._completed_tasks),
            failed=len(self._dead_letter_queue),
        )

        # Count critical pending tasks
        stats.critical_pending = sum(
            1 for t in self._queue if t.priority_value == TaskPriority.CRITICAL.value
        )

        return stats

    def get_queue_snapshot(self) -> list[dict]:
        """Get a snapshot of the current queue (for API response)."""
        return [t.to_dict() for t in sorted(self._queue)]

    def get_active_tasks(self) -> list[dict]:
        """Get list of active tasks."""
        return [t.to_dict() for t in self._active_tasks.values()]

    def get_dead_letter_queue(self) -> list[dict]:
        """Get dead letter queue (failed tasks)."""
        return [t.to_dict() for t in self._dead_letter_queue]

    def clear_completed(self) -> int:
        """Clear completed tasks history. Returns count cleared."""
        count = len(self._completed_tasks)
        self._completed_tasks.clear()
        logger.info(f"[TaskRouter] Cleared {count} completed tasks")
        return count

    def _log_mission(self, task: Task) -> None:
        """Log mission to journal file."""
        journal_entry = task.to_dict()
        journal_entry["duration_ms"] = 0
        if task.started_at and task.completed_at:
            try:
                start = datetime.fromisoformat(task.started_at)
                end = datetime.fromisoformat(task.completed_at)
                journal_entry["duration_ms"] = int((end - start).total_seconds() * 1000)
            except ValueError:
                pass

        # Load existing journal
        missions = []
        if JOURNAL_FILE.exists():
            try:
                import json
                data = json.loads(JOURNAL_FILE.read_text())
                missions = data.get("missions", [])
            except (json.JSONDecodeError, KeyError):
                missions = []

        # Append and save
        missions.append(journal_entry)
        if len(missions) > 1000:
            missions = missions[-1000:]  # Keep last 1000

        import json
        JOURNAL_FILE.write_text(json.dumps({"missions": missions}, indent=2))

    def load_pending_from_journal(self) -> int:
        """
        Reload pending tasks from journal (for crash recovery).

        Returns:
            Number of tasks reloaded.
        """
        if not JOURNAL_FILE.exists():
            return 0

        try:
            import json
            data = json.loads(JOURNAL_FILE.read_text())
            missions = data.get("missions", [])

            # Find incomplete tasks
            reloaded = 0
            for m in missions:
                if m.get("status") in ["pending", "active"]:
                    task = Task(
                        task_id=m.get("task_id", str(uuid.uuid4())[:8]),
                        description=m.get("description", ""),
                        priority_value=TaskPriority[m.get("priority", "MEDIUM")].value,
                        capability=m.get("capability", "general"),
                        payload=m.get("payload", {}),
                        retry_count=m.get("retry_count", 0),
                    )
                    task.status = TaskStatus.PENDING
                    task.started_at = None
                    task.assigned_to = None
                    heapq.heappush(self._queue, task)
                    reloaded += 1

            logger.info(f"[TaskRouter] Reloaded {reloaded} pending tasks from journal")
            return reloaded

        except (json.JSONDecodeError, KeyError, ValueError):
            logger.exception("Failed to load journal")
            return 0
