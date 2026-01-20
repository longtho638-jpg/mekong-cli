"""
Base Backend Interface for Distributed Queue.
"""

from abc import ABC, abstractmethod
from typing import Optional, Any, List

from ..models import Job, QueueStats


class QueueBackend(ABC):
    """Abstract base class for queue backends."""

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to backend."""
        pass

    @abstractmethod
    def submit_job(self, job: Job) -> bool:
        """Submit a job to the queue."""
        pass

    @abstractmethod
    def get_next_job(self, worker_id: str, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next available job for worker."""
        pass

    @abstractmethod
    def complete_job(self, job: Job, success: bool, result: Any = None, error: str = None) -> bool:
        """Mark job as completed or failed."""
        pass

    @abstractmethod
    def requeue_job(self, job: Job, new_priority_val: int) -> bool:
        """Re-queue a failed job with lower priority."""
        pass

    @abstractmethod
    def move_to_dead_letter(self, job: Job) -> bool:
        """Move job to dead letter queue."""
        pass

    @abstractmethod
    def get_stats(self) -> QueueStats:
        """Get current queue statistics."""
        pass
