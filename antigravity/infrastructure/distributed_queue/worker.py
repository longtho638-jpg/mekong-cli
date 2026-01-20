"""
Queue Worker - Background job processing logic.
"""

import logging
import threading
import time
from typing import Callable, Optional, Any

from .queue_manager import QueueManager
from .config import DEFAULT_JOB_TIMEOUTS

logger = logging.getLogger(__name__)


class QueueWorker:
    """
    Background worker that polls for jobs and executes them.
    """

    def __init__(self, manager: QueueManager, worker_id: str):
        self.manager = manager
        self.worker_id = worker_id
        self.running = False
        self.thread: Optional[threading.Thread] = None

    def start(self):
        """Start the worker thread."""
        if self.running:
            return

        self.running = True
        self.thread = threading.Thread(
            target=self._process_loop,
            name=f"QueueWorker-{self.worker_id}",
            daemon=True
        )
        self.thread.start()
        logger.info(f"Started queue worker {self.worker_id}")

    def stop(self):
        """Stop the worker thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            logger.info(f"Stopped queue worker {self.worker_id}")

    def _process_loop(self):
        """Main processing loop."""
        while self.running:
            try:
                # Poll for job with timeout (long polling)
                job = self.manager.get_next_job(self.worker_id, timeout=5.0)

                if not job:
                    time.sleep(1)
                    continue

                logger.info(f"Worker {self.worker_id} processing job {job.job_id}: {job.name}")

                try:
                    # Execute job logic
                    # In a real system, this would dispatch to a handler based on job.name or data
                    result = self._execute_job_logic(job)

                    self.manager.complete_job(
                        job,
                        success=True,
                        result=result,
                        error=None
                    )

                except Exception as e:
                    logger.error(f"Worker {self.worker_id} failed to process job {job.job_id}: {e}")
                    self.manager.fail_job(job, reason=str(e), retry=True)

            except Exception as e:
                logger.error(f"Worker {self.worker_id} loop error: {e}")
                time.sleep(5)  # Backoff on system error

    def _execute_job_logic(self, job) -> Any:
        """
        Simulate job execution.
        In a real application, this would dispatch to registered handlers.
        """
        # Simulate processing time
        time.sleep(0.5)

        # Determine success/fail based on data if needed for testing,
        # otherwise just succeed.
        if job.data == "simulate_failure":
            raise ValueError("Simulated failure requested")

        return f"processed_{job.data}"
