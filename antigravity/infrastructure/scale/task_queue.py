"""
Scale Infrastructure - Task Queue.
===================================

Priority queue for background task processing.
"""

import logging
from queue import Empty, Queue
from typing import Any, Dict, Optional

from .models import QueuedTask

logger = logging.getLogger(__name__)


class TaskQueue:
    """Priority queue for background task processing."""

    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._queue: Queue = Queue(maxsize=max_size)
        self._processed = 0
        self._failed = 0

    def enqueue(self, task: QueuedTask) -> bool:
        """Add task to queue."""
        try:
            self._queue.put_nowait(task)
            return True
        except Exception:
            logger.warning(f"Queue full, rejecting task {task.id}")
            return False

    def dequeue(self, timeout: float = 1.0) -> Optional[QueuedTask]:
        """Get next task from queue."""
        try:
            return self._queue.get(timeout=timeout)
        except Empty:
            return None

    @property
    def size(self) -> int:
        return self._queue.qsize()

    @property
    def is_full(self) -> bool:
        return self._queue.full()

    def get_stats(self) -> Dict[str, Any]:
        return {
            "size": self.size,
            "max_size": self.max_size,
            "processed": self._processed,
            "failed": self._failed,
            "utilization": round(self.size / self.max_size * 100, 1),
        }

    def mark_processed(self):
        """Mark a task as processed."""
        self._processed += 1

    def mark_failed(self):
        """Mark a task as failed."""
        self._failed += 1
