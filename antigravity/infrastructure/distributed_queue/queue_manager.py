"""
Queue Manager - Central coordination for distributed queue.
"""

import logging
import time
from typing import Any, Dict, Optional

from .models import Job, JobPriority, JobStatus, QueueStats
from .config import DEFAULT_REDIS_URL, DEFAULT_FALLBACK_TO_MEMORY, DEFAULT_JOB_TIMEOUTS
from .backends.base import QueueBackend
from .backends.memory_backend import MemoryBackend
from .backends.redis_backend import RedisBackend

logger = logging.getLogger(__name__)


class QueueManager:
    """
    Manages job queue operations using configured backend.
    """

    def __init__(
        self,
        redis_url: str = DEFAULT_REDIS_URL,
        fallback_to_memory: bool = DEFAULT_FALLBACK_TO_MEMORY
    ):
        self.redis_url = redis_url
        self.fallback_to_memory = fallback_to_memory
        self.backend: Optional[QueueBackend] = None
        self.redis_available = False

        self._initialize_backend()

    def _initialize_backend(self):
        """Initialize appropriate backend based on configuration and availability."""
        # Try Redis first if configured
        redis_backend = RedisBackend(self.redis_url)
        if redis_backend.connect():
            self.backend = redis_backend
            self.redis_available = True
            logger.info("QueueManager initialized with Redis backend")
            return

        # Fallback to memory
        if self.fallback_to_memory:
            logger.warning("Redis unavailable. Falling back to Memory backend.")
            self.backend = MemoryBackend()
            self.backend.connect()
            self.redis_available = False
        else:
            logger.error("Redis unavailable and fallback disabled. Queue is non-functional.")
            self.backend = None

    def submit_job(
        self,
        name: str,
        data: Any,
        priority: JobPriority = JobPriority.NORMAL,
        worker_id: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: int = 3,
        metadata: Dict[str, Any] = None
    ) -> Optional[str]:
        """Submit a new job to the queue."""
        if not self.backend:
            logger.error("No active queue backend. Cannot submit job.")
            return None

        job = Job(
            job_id="",  # Auto-generated in __post_init__
            name=name,
            data=data,
            priority=priority,
            worker_id=worker_id,
            timeout=timeout,
            max_retries=max_retries,
            metadata=metadata or {}
        )

        if self.backend.submit_job(job):
            return job.job_id
        return None

    def get_next_job(self, worker_id: str, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next available job for a worker."""
        if not self.backend:
            return None
        return self.backend.get_next_job(worker_id, timeout)

    def complete_job(
        self,
        job: Job,
        result: Any = None,
        success: bool = True,
        error: Optional[str] = None
    ) -> bool:
        """Mark job as completed or failed."""
        if not self.backend:
            return False
        return self.backend.complete_job(job, success, result, error)

    def fail_job(self, job: Job, reason: str, retry: bool = True) -> bool:
        """Handle job failure with optional retry."""
        if not self.backend:
            return False

        logger.warning(f"Job {job.job_id} failed: {reason}")

        # Update retry count
        job.retry_count += 1
        job.metadata["last_error"] = reason

        if retry and job.retry_count <= job.max_retries:
            # Re-queue with lower priority (backoff)
            # Logic: drop priority by 1 step (e.g. HIGH -> NORMAL)
            new_priority_val = min(job.priority.value + 1, JobPriority.BACKGROUND.value)
            return self.backend.requeue_job(job, new_priority_val)
        else:
            # Final failure or max retries reached
            if retry:
                logger.warning(f"Job {job.job_id} reached max retries ({job.max_retries}). Moving to dead letter.")
            else:
                logger.warning(f"Job {job.job_id} failed (no retry requested).")

            # First mark as failed in system
            self.backend.complete_job(job, success=False, error=reason)
            # Then potentially move to dead letter if backend supports it
            return self.backend.move_to_dead_letter(job)

    def timeout_job(self, job: Job) -> bool:
        """Handle job timeout."""
        if not self.backend:
            return False

        logger.warning(f"Job {job.job_id} timed out.")
        job.status = JobStatus.TIMEOUT

        # Mark as failed/timeout
        self.backend.complete_job(job, success=False, error="Job timed out")
        return self.backend.move_to_dead_letter(job)

    def get_stats(self) -> QueueStats:
        """Get current queue statistics."""
        if self.backend:
            return self.backend.get_stats()
        return QueueStats()
