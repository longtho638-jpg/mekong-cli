"""
Redis Backend for Distributed Queue.
"""

import json
import logging
import time
from typing import Any, Optional, List

from ..models import Job, JobStatus, JobPriority, QueueStats
from ..config import PRIORITY_QUEUES, PRIORITY_ORDER, DEFAULT_REDIS_URL
from .base import QueueBackend

logger = logging.getLogger(__name__)

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class RedisBackend(QueueBackend):
    """Redis-based implementation of queue backend."""

    def __init__(self, redis_url: str = DEFAULT_REDIS_URL):
        self.redis_url = redis_url
        self.client = None
        self.enabled = False

    def connect(self) -> bool:
        """Establish connection to Redis."""
        if not REDIS_AVAILABLE:
            logger.warning("Redis library not installed.")
            return False

        try:
            self.client = redis.from_url(self.redis_url, decode_responses=False)
            self.client.ping()
            self.enabled = True
            logger.info(f"Connected to Redis at {self.redis_url}")
            return True
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self.enabled = False
            return False

    def submit_job(self, job: Job) -> bool:
        """Submit job to Redis queue."""
        if not self.enabled:
            return False

        try:
            # Serialize job using safe JSON serialization
            job_data = json.dumps(job.to_json()).encode("utf-8")

            # Determine queue key
            queue_name = PRIORITY_QUEUES.get(job.priority, "normal_jobs")

            # Push to Redis list (RPUSH appends to end, treating it as a queue)
            self.client.rpush(queue_name, job_data)

            # Update stats
            self.client.incr("stats:total_jobs")
            self.client.incr("stats:pending_jobs")

            logger.info(f"Job {job.job_id} submitted to Redis queue {queue_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to submit job to Redis: {e}")
            return False

    def get_next_job(self, worker_id: str, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next job from Redis queues using priority blocking pop."""
        if not self.enabled:
            return None

        try:
            # Prepare list of queues to check in priority order
            keys = [PRIORITY_QUEUES[p] for p in PRIORITY_ORDER if p in PRIORITY_QUEUES]

            # BLPOP blocks until a job is available in one of the queues
            # It checks keys in order, satisfying priority requirement
            # timeout=0 means block indefinitely, but we usually want a timeout
            wait_time = int(timeout) if timeout is not None else 5

            result = self.client.blpop(keys, timeout=wait_time)

            if result:
                # result is a tuple (queue_name, data)
                queue_name_bytes, job_data = result

                # Deserialize using safe JSON (replaces insecure pickle.loads)
                job = Job.from_json(json.loads(job_data.decode("utf-8")))

                # Update job state
                job.status = JobStatus.RUNNING
                job.started_at = time.time()
                job.worker_id = worker_id

                # Update stats
                self.client.decr("stats:pending_jobs")
                self.client.incr("stats:running_jobs")

                logger.info(f"Worker {worker_id} picked up job {job.job_id} from {queue_name_bytes}")
                return job

            return None

        except Exception as e:
            logger.error(f"Error getting job from Redis: {e}")
            return None

    def complete_job(self, job: Job, success: bool, result: Any = None, error: str = None) -> bool:
        """Complete job in Redis."""
        if not self.enabled:
            return False

        try:
            job.status = JobStatus.COMPLETED if success else JobStatus.FAILED
            job.completed_at = time.time()

            if error:
                job.metadata["error"] = error
                job.failed_at = time.time()
            elif result is not None:
                job.metadata["result"] = result

            job.worker_id = None # Job is done

            # Store completed job result for persistence/querying
            # Expire after 1 hour to prevent memory leaks
            key = f"job:{job.job_id}"
            job_data = json.dumps(job.to_json()).encode("utf-8")

            pipe = self.client.pipeline()
            pipe.setex(key, 3600, job_data)

            # Update stats
            pipe.decr("stats:running_jobs")
            if success:
                pipe.incr("stats:completed_jobs")
                pipe.incr(f"stats:{PRIORITY_QUEUES.get(job.priority, 'normal')}:completed")
            else:
                pipe.incr("stats:failed_jobs")
                pipe.incr(f"stats:{PRIORITY_QUEUES.get(job.priority, 'normal')}:failed")

            pipe.execute()

            logger.info(f"Job {job.job_id} completed in Redis")
            return True

        except Exception as e:
            logger.error(f"Failed to complete job {job.job_id} in Redis: {e}")
            return False

    def requeue_job(self, job: Job, new_priority_val: int) -> bool:
        """Re-queue job with new priority."""
        if not self.enabled:
            return False

        try:
            # Map numeric priority value back to enum
            new_priority_enum = JobPriority.BACKGROUND
            for p in JobPriority:
                if p.value == new_priority_val:
                    new_priority_enum = p
                    break

            job.status = JobStatus.PENDING
            job.priority = new_priority_enum
            job.worker_id = None

            # Serialize using safe JSON
            job_data = json.dumps(job.to_json()).encode("utf-8")

            queue_name = PRIORITY_QUEUES.get(new_priority_enum, "background_jobs")

            # Add to queue
            self.client.rpush(queue_name, job_data)

            # Update stats (it was running/failed, now pending again)
            # Assuming it was counted as failed/running before calling this?
            # Usually requeue happens after failure handling.
            self.client.incr("stats:pending_jobs")

            logger.info(f"Job {job.job_id} requeued in Redis with priority {new_priority_enum.name}")
            return True

        except Exception as e:
            logger.error(f"Failed to requeue job {job.job_id} in Redis: {e}")
            return False

    def move_to_dead_letter(self, job: Job) -> bool:
        """Move to dead letter queue."""
        if not self.enabled:
            return False

        try:
            job.status = JobStatus.DEAD_LETTER
            job_data = json.dumps(job.to_json()).encode("utf-8")

            self.client.lpush("dead_letter_queue", job_data)
            self.client.incr("stats:dead_letter_jobs")
            self.client.decr("stats:running_jobs")

            logger.info(f"Job {job.job_id} moved to Redis dead letter queue")
            return True

        except Exception as e:
            logger.error(f"Failed to move job {job.job_id} to dead letter queue: {e}")
            return False

    def get_stats(self) -> QueueStats:
        """Get stats from Redis."""
        if not self.enabled:
            return QueueStats()

        try:
            # Fetch all stats
            keys = [
                "stats:total_jobs", "stats:pending_jobs", "stats:running_jobs",
                "stats:completed_jobs", "stats:failed_jobs", "stats:timeout_jobs",
                "stats:dead_letter_jobs"
            ]
            values = self.client.mget(keys)

            # Helper to safely convert to int
            def to_int(v):
                return int(v) if v else 0

            stats = QueueStats(
                total_jobs=to_int(values[0]),
                pending_jobs=to_int(values[1]),
                running_jobs=to_int(values[2]),
                completed_jobs=to_int(values[3]),
                failed_jobs=to_int(values[4]),
                timeout_jobs=to_int(values[5]),
                dead_letter_jobs=to_int(values[6])
            )

            return stats

        except Exception as e:
            logger.error(f"Failed to get stats from Redis: {e}")
            return QueueStats()
