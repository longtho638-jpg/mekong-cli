import json
import logging
import os
import signal
import sys
import time
import traceback
import uuid
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional

import redis

from backend.api.config import settings
from backend.services.queue_service import JobSchema, QueueService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("worker")

class BaseWorker:
    """
    Base Worker Class for AgencyOS Job Queue.
    Handles job polling, execution, retries, and graceful shutdown.
    """

    def __init__(self,
                 queues: List[str] = None,
                 concurrency: int = 1,
                 worker_id: Optional[str] = None):

        self.worker_id = worker_id or f"worker-{uuid.uuid4().hex[:8]}"
        self.queues = queues or ["high", "normal", "low"]
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_service = QueueService(self.redis)
        self.running = True
        self.handlers: Dict[str, Callable] = {}
        self.poll_interval = 1.0  # seconds

        # Redis keys
        self.queue_prefix = "agencyos:queue:"
        self.job_key_prefix = "agencyos:job:"
        self.schedule_key = "agencyos:queue:schedule"

        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.shutdown)
        signal.signal(signal.SIGTERM, self.shutdown)

        logger.info(f"Worker {self.worker_id} initialized. Listening on queues: {self.queues}")

    def register_handler(self, job_type: str, handler: Callable):
        """Register a function to handle a specific job type"""
        self.handlers[job_type] = handler
        logger.info(f"Registered handler for job type: {job_type}")

    def shutdown(self, signum, frame):
        """Graceful shutdown handler"""
        logger.info(f"Worker {self.worker_id} received shutdown signal. Finishing current jobs...")
        self.running = False

    def start(self):
        """Start the worker loop"""
        logger.info(f"Worker {self.worker_id} started.")

        while self.running:
            try:
                # 1. Check for scheduled jobs due for execution
                self.process_scheduled_jobs()

                # 2. Poll for new jobs
                job_id = self.poll_queues()

                if job_id:
                    self.process_job(job_id)
                else:
                    # Sleep briefly to avoid CPU spinning if no jobs
                    time.sleep(self.poll_interval)

                # 3. Send heartbeat
                self.queue_service.register_worker_heartbeat(self.worker_id, self.queues)

            except Exception as e:
                logger.error(f"Error in worker loop: {e}")
                traceback.print_exc()
                time.sleep(5) # Prevent tight loop on Redis error

        logger.info(f"Worker {self.worker_id} stopped.")

    def process_scheduled_jobs(self):
        """Check the schedule ZSET for jobs that are due"""
        now = datetime.utcnow().timestamp()

        # Get jobs with score <= now
        jobs = self.redis.zrangebyscore(self.schedule_key, 0, now, start=0, num=10)

        if jobs:
            for job_id in jobs:
                # Try to acquire lock/remove from schedule to prevent double processing
                # In a robust system, we'd use Lua script for atomicity.
                # Here we trust zrem return value.
                if self.redis.zrem(self.schedule_key, job_id):
                    job = self.queue_service.get_job(job_id)
                    if job:
                        # Move to its active queue
                        priority = job.priority
                        queue_name = f"{self.queue_prefix}{priority}"
                        self.redis.rpush(queue_name, job_id)
                        logger.info(f"Moved scheduled job {job_id} to {queue_name}")

    def poll_queues(self) -> Optional[str]:
        """Poll queues in priority order"""
        for queue_name in self.queues:
            full_queue_name = f"{self.queue_prefix}{queue_name}"
            # Non-blocking pop
            job_id = self.redis.lpop(full_queue_name)
            if job_id:
                return job_id
        return None

    def process_job(self, job_id: str):
        """Execute the job logic"""
        job = self.queue_service.get_job(job_id)

        if not job:
            logger.warning(f"Job {job_id} not found in storage, skipping.")
            return

        logger.info(f"Processing job {job_id} ({job.type})")

        try:
            # Update status
            job.status = "processing"
            job.attempts += 1
            self.redis.set(f"{self.job_key_prefix}{job_id}", job.model_dump_json())

            # Find handler
            handler = self.handlers.get(job.type)
            if not handler:
                raise ValueError(f"No handler registered for job type: {job.type}")

            # Execute handler
            start_time = time.time()
            result = handler(job.payload)
            duration = (time.time() - start_time) * 1000

            # Success
            logger.info(f"Job {job_id} completed in {duration:.2f}ms")
            job.status = "completed"
            # We could store result in job object or separate key

            # Clean up job (or keep for history)
            # For now, keep it with status 'completed' and expiry
            self.redis.setex(f"{self.job_key_prefix}{job_id}", 86400, job.model_dump_json()) # Keep for 24h

        except Exception as e:
            logger.error(f"Job {job_id} failed: {str(e)}")
            traceback.print_exc()
            self.handle_failure(job, str(e))

    def handle_failure(self, job: JobSchema, error_msg: str):
        """Handle job failure with retry logic"""
        job.status = "failed"

        if job.attempts < job.max_retries:
            # Schedule retry
            delay = 60 # Default
            if job.retry_delay_seconds and len(job.retry_delay_seconds) >= job.attempts:
                delay = job.retry_delay_seconds[job.attempts - 1]

            retry_at = datetime.utcnow() + timedelta(seconds=delay)
            score = retry_at.timestamp()

            self.redis.zadd(self.schedule_key, {job.job_id: score})

            job.status = "scheduled" # Or 'retrying'
            logger.info(f"Scheduled retry for job {job.job_id} in {delay}s (Attempt {job.attempts}/{job.max_retries})")

        else:
            # Move to DLQ
            job.status = "failed"
            self.redis.rpush(f"{self.queue_prefix}dlq", job.job_id)
            logger.error(f"Job {job.job_id} moved to DLQ after {job.attempts} attempts")

        # Update job state
        self.redis.set(f"{self.job_key_prefix}{job.job_id}", job.model_dump_json())
