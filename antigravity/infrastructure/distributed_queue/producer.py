"""
Queue Producer - Handles job submission
"""
import logging
from typing import Any, Dict, Optional
from .models import Job, JobPriority

logger = logging.getLogger(__name__)

class QueueProducer:
    """Submits jobs to the configured backend."""

    def __init__(self, backend):
        self.backend = backend

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
