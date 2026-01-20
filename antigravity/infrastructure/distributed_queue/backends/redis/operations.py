"""
Redis Job Operations (Submit, Fetch, Complete).
"""

import json
import logging
import time
from typing import Any, Optional

from ...config import PRIORITY_ORDER, PRIORITY_QUEUES
from ...models import Job, JobPriority, JobStatus
from .manager import RedisManager

logger = logging.getLogger(__name__)


class RedisOperations(RedisManager):
    def submit_job(self, job: Job) -> bool:
        if not self.enabled:
            return False
        try:
            job_data = json.dumps(job.to_json()).encode("utf-8")
            queue_name = PRIORITY_QUEUES.get(job.priority, "normal_jobs")
            self.client.rpush(queue_name, job_data)
            self.client.incr("stats:total_jobs")
            self.client.incr("stats:pending_jobs")
            logger.info(f"Job {job.job_id} submitted to Redis queue {queue_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to submit job to Redis: {e}")
            return False

    def get_next_job(self, worker_id: str, timeout: Optional[float] = None) -> Optional[Job]:
        if not self.enabled:
            return None
        try:
            keys = [PRIORITY_QUEUES[p] for p in PRIORITY_ORDER if p in PRIORITY_QUEUES]
            wait_time = int(timeout) if timeout is not None else 5
            result = self.client.blpop(keys, timeout=wait_time)
            if result:
                queue_name_bytes, job_data = result
                job = Job.from_json(json.loads(job_data.decode("utf-8")))
                job.status = JobStatus.RUNNING
                job.started_at = time.time()
                job.worker_id = worker_id
                self.client.decr("stats:pending_jobs")
                self.client.incr("stats:running_jobs")
                logger.info(f"Worker {worker_id} picked up job {job.job_id}")
                return job
            return None
        except Exception as e:
            logger.error(f"Error getting job from Redis: {e}")
            return None

    def complete_job(self, job: Job, success: bool, result: Any = None, error: str = None) -> bool:
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
            job.worker_id = None
            key = f"job:{job.job_id}"
            job_data = json.dumps(job.to_json()).encode("utf-8")
            pipe = self.client.pipeline()
            pipe.setex(key, 3600, job_data)
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
            logger.error(f"Failed to complete job {job.job_id}: {e}")
            return False
