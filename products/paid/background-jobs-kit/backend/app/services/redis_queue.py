import json
import uuid
import time
import redis
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.interfaces import QueueInterface, BaseJob, JobStatus
import logging

logger = logging.getLogger(__name__)

class RedisJob(BaseJob):
    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "task_name": self.task_name,
            "payload": self.payload,
            "status": self.status,
            "created_at": self.created_at,
            "retries": self.retries,
            "max_retries": self.max_retries,
            "error": self.error,
            "run_at": self.run_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RedisJob':
        return cls(**data)

class RedisQueue(QueueInterface):
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.queue_key = f"{settings.QUEUE_NAME}:pending"
        self.processing_key = f"{settings.QUEUE_NAME}:processing"
        self.failed_key = f"{settings.QUEUE_NAME}:failed"
        self.delayed_key = f"{settings.QUEUE_NAME}:delayed"
        self.jobs_key = f"{settings.QUEUE_NAME}:jobs"

    async def enqueue(self, task_name: str, payload: Dict[str, Any], max_retries: int = 3, delay_seconds: int = 0) -> str:
        job_id = str(uuid.uuid4())
        run_at = time.time() + delay_seconds
        job = RedisJob(
            job_id=job_id,
            task_name=task_name,
            payload=payload,
            max_retries=max_retries,
            run_at=run_at
        )

        pipe = self.redis.pipeline()
        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))

        if delay_seconds > 0:
            job.status = JobStatus.DELAYED
            pipe.zadd(self.delayed_key, {job_id: run_at})
        else:
            pipe.rpush(self.queue_key, job_id)

        pipe.execute()

        logger.info(f"Enqueued job {job_id} for task {task_name} (delay: {delay_seconds}s)")
        return job_id

    async def dequeue(self) -> Optional[BaseJob]:
        # First check for delayed jobs that are ready
        now = time.time()
        # Watch optimistic locking could be used here, but for simplicity relying on single threaded worker or atomic lua scripts in future
        # Get jobs from delayed set where score <= now
        delayed_jobs = self.redis.zrangebyscore(self.delayed_key, 0, now, start=0, num=1)

        if delayed_jobs:
            job_id = delayed_jobs[0]
            if self.redis.zrem(self.delayed_key, job_id):
                self.redis.rpush(self.queue_key, job_id)
                logger.info(f"Moved delayed job {job_id} to pending queue")

        # Standard dequeue
        job_id = self.redis.rpoplpush(self.queue_key, self.processing_key)
        if not job_id:
            return None

        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return None

        job = RedisJob.from_dict(json.loads(job_data))
        job.status = JobStatus.PROCESSING
        self.redis.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        return job

    async def complete_job(self, job_id: str, result: Any = None):
        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return

        job = RedisJob.from_dict(json.loads(job_data))
        job.status = JobStatus.COMPLETED
        job.payload["result"] = result

        pipe = self.redis.pipeline()
        pipe.lrem(self.processing_key, 0, job_id)
        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        pipe.execute()
        logger.info(f"Job {job_id} completed")

    async def fail_job(self, job_id: str, error: str):
        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return

        job = RedisJob.from_dict(json.loads(job_data))
        job.retries += 1
        job.error = error

        pipe = self.redis.pipeline()
        pipe.lrem(self.processing_key, 0, job_id)

        if job.retries <= job.max_retries:
            job.status = JobStatus.PENDING
            # Exponential backoff
            delay = 2 ** job.retries
            run_at = time.time() + delay
            job.run_at = run_at

            pipe.zadd(self.delayed_key, {job_id: run_at})
            logger.warning(f"Job {job_id} failed, retrying in {delay}s ({job.retries}/{job.max_retries})")
        else:
            job.status = JobStatus.FAILED
            pipe.rpush(self.failed_key, job_id)
            logger.error(f"Job {job_id} failed permanently: {error}")

        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        pipe.execute()

    async def get_job(self, job_id: str) -> Optional[BaseJob]:
        data = self.redis.hget(self.jobs_key, job_id)
        return RedisJob.from_dict(json.loads(data)) if data else None

    async def get_stats(self) -> Dict[str, int]:
        return {
            "pending": self.redis.llen(self.queue_key),
            "processing": self.redis.llen(self.processing_key),
            "failed": self.redis.llen(self.failed_key),
            "delayed": self.redis.zcard(self.delayed_key),
            "total_jobs": self.redis.hlen(self.jobs_key)
        }

    async def list_jobs(self, limit: int = 10, offset: int = 0, status: Optional[JobStatus] = None) -> List[BaseJob]:
        # This is a naive implementation. Redis isn't great for querying by multiple fields without search module.
        # We will iterate over all jobs in the hash map. For production with many jobs, RediSearch or secondary indices (Sets) are needed.
        # For simplicity (KISS), we fetch all and filter in memory if status is provided, or just slice.

        all_job_ids = self.redis.hkeys(self.jobs_key)
        jobs = []

        # If we have too many jobs, this will be slow.
        # A better approach for specific status lists is using the list/set keys we already have (queue_key, failed_key, etc)

        target_ids = []
        if status == JobStatus.PENDING:
            target_ids = self.redis.lrange(self.queue_key, offset, offset + limit - 1)
        elif status == JobStatus.PROCESSING:
            target_ids = self.redis.lrange(self.processing_key, offset, offset + limit - 1)
        elif status == JobStatus.FAILED:
            target_ids = self.redis.lrange(self.failed_key, offset, offset + limit - 1)
        elif status == JobStatus.DELAYED:
            target_ids = self.redis.zrange(self.delayed_key, offset, offset + limit - 1)
        else:
            # If no status specified, or status is COMPLETED (which we don't track in a separate list in this simple impl),
            # we fallback to scanning the hash.
            # Note: completed jobs are removed from lists but kept in hash in this impl.
            # Let's just return a slice of keys from hash for now if no status.
            target_ids = all_job_ids[offset : offset + limit]

        for job_id in target_ids:
            job_data = self.redis.hget(self.jobs_key, job_id)
            if job_data:
                jobs.append(RedisJob.from_dict(json.loads(job_data)))

        return jobs

    async def retry_job(self, job_id: str) -> bool:
        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return False

        job = RedisJob.from_dict(json.loads(job_data))
        if job.status != JobStatus.FAILED:
            return False

        job.status = JobStatus.PENDING
        job.retries = 0
        job.error = None

        pipe = self.redis.pipeline()
        pipe.lrem(self.failed_key, 0, job_id)
        pipe.rpush(self.queue_key, job_id)
        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        pipe.execute()
        return True

    async def clear_failed(self) -> int:
        failed_jobs = self.redis.lrange(self.failed_key, 0, -1)
        if not failed_jobs:
            return 0

        pipe = self.redis.pipeline()
        for job_id in failed_jobs:
            pipe.lrem(self.failed_key, 0, job_id)
        pipe.execute()
        return len(failed_jobs)
