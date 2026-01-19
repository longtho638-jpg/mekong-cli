"""
Swarm Messaging - Task Queue and Inter-Agent Communication
===========================================================

Handles task queue management and priority-based scheduling.

Binh Phap: "Thong tin la vu khi" - Information is a weapon
"""

import logging
import uuid
from typing import Dict, List, Optional

from .types import SwarmTask, TaskPriority, TaskStatus

logger = logging.getLogger(__name__)


class TaskQueue:
    """
    Priority-based task queue for swarm execution.

    Features:
    - Priority-based insertion
    - Task lifecycle management
    - Queue operations
    """

    def __init__(self) -> None:
        self.tasks: Dict[str, SwarmTask] = {}
        self.queue: List[str] = []  # Task IDs in priority order

    def submit(
        self,
        name: str,
        payload: any,
        priority: TaskPriority = TaskPriority.NORMAL,
        timeout_seconds: int = 300,
    ) -> str:
        """Submit a new task to the queue."""
        task_id = f"task_{uuid.uuid4().hex[:8]}"

        task = SwarmTask(
            id=task_id,
            name=name,
            payload=payload,
            priority=priority,
            timeout_seconds=timeout_seconds,
        )

        self.tasks[task_id] = task
        self._insert_by_priority(task_id, priority)

        logger.info(f"Task submitted: {name} (priority: {priority.value})")
        return task_id

    def _insert_by_priority(self, task_id: str, priority: TaskPriority) -> None:
        """Insert task in queue by priority (lower value = higher priority)."""
        insert_pos = 0
        for i, tid in enumerate(self.queue):
            if self.tasks[tid].priority.value > priority.value:
                insert_pos = i
                break
            insert_pos = i + 1
        self.queue.insert(insert_pos, task_id)

    def pop_next(self) -> Optional[str]:
        """Pop the next task from queue."""
        if self.queue:
            return self.queue.pop(0)
        return None

    def remove(self, task_id: str) -> None:
        """Remove task from queue (but keep in tasks dict)."""
        if task_id in self.queue:
            self.queue.remove(task_id)

    def get_task(self, task_id: str) -> Optional[SwarmTask]:
        """Get task by ID."""
        return self.tasks.get(task_id)

    def update_status(self, task_id: str, status: TaskStatus) -> None:
        """Update task status."""
        if task_id in self.tasks:
            self.tasks[task_id].status = status

    def get_pending_count(self) -> int:
        """Get count of pending tasks in queue."""
        return len(self.queue)

    def is_empty(self) -> bool:
        """Check if queue is empty."""
        return len(self.queue) == 0

    def get_all_tasks(self) -> Dict[str, SwarmTask]:
        """Get all tasks."""
        return self.tasks

    def iter_queue(self) -> List[str]:
        """Iterate over queue task IDs."""
        return list(self.queue)


__all__ = ["TaskQueue"]
