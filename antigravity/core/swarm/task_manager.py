"""
Task Manager Module.
"""
import logging
import threading
import time
import uuid
from typing import Dict, List, Optional

from ..kanban.board_manager import BoardManager
from ..kanban.board_manager import TaskPriority as KanbanPriority
from .enums import TaskPriority, TaskStatus
from .models import SwarmTask

logger = logging.getLogger(__name__)


class TaskManager:
    """Manages task submission, storage, and queuing."""

    def __init__(self):
        self.tasks: Dict[str, SwarmTask] = {}
        self.task_queue: List[str] = []
        self._lock = threading.Lock()
        self.board_manager = BoardManager()

    def submit_task(
        self,
        name: str,
        payload: object,
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

        # Create Kanban Card
        try:
            k_priority = KanbanPriority.MEDIUM
            if priority == TaskPriority.CRITICAL:
                k_priority = KanbanPriority.CRITICAL
            elif priority == TaskPriority.HIGH:
                k_priority = KanbanPriority.HIGH
            elif priority == TaskPriority.LOW or priority == TaskPriority.BACKGROUND:
                k_priority = KanbanPriority.LOW

            self.board_manager.create_card(
                board_id="default",
                title=name,
                priority=k_priority,
                description=str(payload)[:200] if payload else None,
                swarm_task_id=task_id
            )
        except Exception as e:
            logger.warning(f"Failed to create Kanban card for task {task_id}: {e}")

        logger.info(f"📋 Task submitted: {name} (priority: {priority.value})")
        return task_id

    def _insert_by_priority(self, task_id: str, priority: TaskPriority):
        """Insert task in queue by priority (internal helper)."""
        # Assumes lock is held by caller
        insert_pos = 0
        for i, tid in enumerate(self.task_queue):
            if self.tasks[tid].priority.value > priority.value:
                insert_pos = i
                break
            insert_pos = i + 1
        self.task_queue.insert(insert_pos, task_id)

    def get_task(self, task_id: str) -> Optional[SwarmTask]:
        """Get task by ID."""
        with self._lock:
            return self.tasks.get(task_id)

    def get_next_task(self) -> Optional[str]:
        """Get ID of the next task in the queue, or None if empty."""
        with self._lock:
            if not self.task_queue:
                return None
            return self.task_queue[0]

    def pop_next_task(self) -> Optional[str]:
        """Remove and return the ID of the next task."""
        with self._lock:
            if not self.task_queue:
                return None
            return self.task_queue.pop(0)

    def remove_task_from_queue(self, task_id: str):
        """Remove a specific task from the queue."""
        with self._lock:
            if task_id in self.task_queue:
                self.task_queue.remove(task_id)

    def get_pending_count(self) -> int:
        """Get number of pending tasks."""
        with self._lock:
            return len(self.task_queue)

    def get_task_result(
        self, task_id: str, wait: bool = True, timeout: float = None
    ) -> object:
        """Get task result."""
        task = self.get_task(task_id)
        if not task:
            return None

        if wait:
            start = time.time()
            while task.status not in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                if timeout and (time.time() - start) > timeout:
                    return None
                time.sleep(0.1)

        return task.result if task.status == TaskStatus.COMPLETED else None
