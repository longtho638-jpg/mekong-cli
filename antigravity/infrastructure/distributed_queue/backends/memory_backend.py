"""
In-Memory Backend for Distributed Queue.
"""

import logging
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Any, Dict, List, Optional

from ..config import PRIORITY_ORDER, PRIORITY_QUEUES
from ..models import Job, JobPriority, JobStatus, QueueStats
from .base import QueueBackend

logger = logging.getLogger(__name__)


class MemoryBackend(QueueBackend):
    """In-memory implementation of queue backend."""

    def __init__(self):
        self.memory_queue = defaultdict(deque)
        self.lock = Lock()
        self.stats = QueueStats()
        # Internal storage for all jobs to allow lookup by ID if needed,
        # though main queues drive processing.
        # For simplicity and to match original behavior, we mostly rely on the queues.

    def connect(self) -> bool:
        """Memory backend is always connected."""
        return True

    def submit_job(self, job: Job) -> bool:
        """Submit job to memory queue."""
        with self.lock:
            queue_key = PRIORITY_QUEUES.get(job.priority, "normal_jobs")
            self.memory_queue[queue_key].append(job)

            self.stats.total_jobs += 1
            self.stats.pending_jobs += 1

            logger.info(f"Job {job.job_id} submitted to memory queue {queue_key}")
            return True

    def get_next_job(self, worker_id: str, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next job from memory queue."""
        # Note: timeout is ignored in memory backend as we don't block
        with self.lock:
            # Check all priority queues in order
            for priority in PRIORITY_ORDER:
                queue_key = PRIORITY_QUEUES.get(priority)
                if not queue_key:
                    continue

                if self.memory_queue[queue_key]:
                    job = self.memory_queue[queue_key].popleft()

                    if self._is_valid_job(job):
                        job.status = JobStatus.RUNNING
                        job.started_at = time.time()
                        job.worker_id = worker_id

                        self.stats.pending_jobs = max(0, self.stats.pending_jobs - 1)
                        self.stats.running_jobs += 1

                        logger.info(f"Worker {worker_id} picked up job {job.job_id} from memory queue {queue_key}")
                        return job

            return None

    def complete_job(self, job: Job, success: bool, result: Any = None, error: str = None) -> bool:
        """Complete job in memory."""
        with self.lock:
            job.status = JobStatus.COMPLETED if success else JobStatus.FAILED
            job.completed_at = time.time()

            if error:
                job.metadata["error"] = error
                job.failed_at = time.time()
            elif result is not None:
                job.metadata["result"] = result

            self.stats.running_jobs = max(0, self.stats.running_jobs - 1)

            if success:
                self.stats.completed_jobs += 1
            else:
                self.stats.failed_jobs += 1

            logger.info(f"Job {job.job_id} completed in memory queue")
            return True

    def requeue_job(self, job: Job, new_priority_val: int) -> bool:
        """Re-queue job with new priority."""
        with self.lock:
            job.status = JobStatus.PENDING
            # Map numeric priority value back to enum if possible, or fallback to BACKGROUND
            # In original code: min(job.priority.value + 1, JobPriority.BACKGROUND.value)

            new_priority_enum = JobPriority.BACKGROUND
            for p in JobPriority:
                if p.value == new_priority_val:
                    new_priority_enum = p
                    break

            job.priority = new_priority_enum
            queue_key = PRIORITY_QUEUES.get(new_priority_enum, "background_jobs")

            self.memory_queue[queue_key].append(job)

            # Update stats - move from running/failed back to pending?
            # The calling logic usually marks it failed then requeues.
            # If we consider it a new submission effectively:
            self.stats.pending_jobs += 1

            logger.info(f"Job {job.job_id} requeued in memory with priority {new_priority_enum.name}")
            return True

    def move_to_dead_letter(self, job: Job) -> bool:
        """Move job to dead letter queue (conceptually)."""
        with self.lock:
            # In memory backend, "dead letter" is just a stats increment and logging
            # unless we want to keep it in a specific list.
            # Original code: self.stats.dead_letter_jobs += 1

            job.status = JobStatus.DEAD_LETTER
            self.stats.dead_letter_jobs += 1
            self.stats.running_jobs = max(0, self.stats.running_jobs - 1)

            logger.info(f"Job {job.job_id} moved to dead letter queue")
            return True

    def get_stats(self) -> QueueStats:
        """Return current stats."""
        with self.lock:
            # Recalculate pending to be sure
            current_pending = sum(len(q) for q in self.memory_queue.values())
            self.stats.pending_jobs = current_pending
            return self.stats

    def _is_valid_job(self, job: Job) -> bool:
        """Validate job integrity."""
        return bool(
            job.job_id and
            job.name and
            job.data is not None and
            isinstance(job.priority, JobPriority)
        )
