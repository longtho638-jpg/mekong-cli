"""
Queue Consumer - Handles job retrieval and completion
"""
import logging
from typing import Any, Optional
from .models import Job, JobPriority, JobStatus

logger = logging.getLogger(__name__)

class QueueConsumer:
    """Handles job lifecycle after submission."""

    def __init__(self, backend):
        self.backend = backend

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
        job.retry_count += 1
        job.metadata["last_error"] = reason

        if retry and job.retry_count <= job.max_retries:
            new_priority_val = min(job.priority.value + 1, JobPriority.BACKGROUND.value)
            return self.backend.requeue_job(job, new_priority_val)
        else:
            if retry:
                logger.warning(f"Job {job.job_id} reached max retries. Moving to dead letter.")
            else:
                logger.warning(f"Job {job.job_id} failed (no retry requested).")

            self.backend.complete_job(job, success=False, error=reason)
            return self.backend.move_to_dead_letter(job)

    def timeout_job(self, job: Job) -> bool:
        """Handle job timeout."""
        if not self.backend:
            return False

        logger.warning(f"Job {job.job_id} timed out.")
        job.status = JobStatus.TIMEOUT
        self.backend.complete_job(job, success=False, error="Job timed out")
        return self.backend.move_to_dead_letter(job)
