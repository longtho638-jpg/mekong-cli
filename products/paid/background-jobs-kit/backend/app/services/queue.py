import json
import time
import uuid
import logging
from typing import Optional, Dict, Any, List
from enum import Enum
import redis
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Job:
    def __init__(
        self,
        job_id: str,
        task_name: str,
        payload: Dict[str, Any],
        status: JobStatus = JobStatus.PENDING,
        created_at: float = None,
        retries: int = 0,
        max_retries: int = 3,
        error: Optional[str] = None
    ):
        self.job_id = job_id
        self.task_name = task_name
        self.payload = payload
        self.status = status
        self.created_at = created_at or time.time()
        self.retries = retries
        self.max_retries = max_retries
        self.error = error

    def to_dict(self):
        return {
            "job_id": self.job_id,
            "task_name": self.task_name,
            "payload": self.payload,
            "status": self.status,
            "created_at": self.created_at,
            "retries": self.retries,
            "max_retries": self.max_retries,
            "error": self.error
        }

    @classmethod
    def from_dict(cls, data):
        return cls(**data)

class QueueService:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.queue_key = f"{settings.QUEUE_NAME}:pending"
        self.processing_key = f"{settings.QUEUE_NAME}:processing"
        self.failed_key = f"{settings.QUEUE_NAME}:failed"
        self.jobs_key = f"{settings.QUEUE_NAME}:jobs"

    def enqueue(self, task_name: str, payload: Dict[str, Any], max_retries: int = 3) -> str:
        job_id = str(uuid.uuid4())
        job = Job(job_id, task_name, payload, max_retries=max_retries)

        pipe = self.redis.pipeline()
        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        pipe.rpush(self.queue_key, job_id)
        pipe.execute()

        logger.info(f"Enqueued job {job_id} for task {task_name}")
        return job_id

    def dequeue(self) -> Optional[Job]:
        job_id = self.redis.rpoplpush(self.queue_key, self.processing_key)
        if not job_id:
            return None

        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return None

        job = Job.from_dict(json.loads(job_data))
        job.status = JobStatus.PROCESSING
        self.redis.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        return job

    def complete_job(self, job_id: str, result: Any = None):
        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return

        job = Job.from_dict(json.loads(job_data))
        job.status = JobStatus.COMPLETED
        # Optionally store result in payload or separate field
        job.payload["result"] = result

        pipe = self.redis.pipeline()
        pipe.lrem(self.processing_key, 0, job_id)
        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        pipe.execute()
        logger.info(f"Job {job_id} completed")

    def fail_job(self, job_id: str, error: str):
        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return

        job = Job.from_dict(json.loads(job_data))
        job.retries += 1
        job.error = error

        pipe = self.redis.pipeline()
        pipe.lrem(self.processing_key, 0, job_id)

        if job.retries <= job.max_retries:
            job.status = JobStatus.PENDING
            # Exponential backoff would be implemented in a real scheduler,
            # here we just re-queue immediately or use a delayed queue (ZSET) pattern.
            # For simplicity (KISS), we re-queue to the end of pending.
            pipe.rpush(self.queue_key, job_id)
            logger.warning(f"Job {job_id} failed, retrying ({job.retries}/{job.max_retries})")
        else:
            job.status = JobStatus.FAILED
            pipe.rpush(self.failed_key, job_id)
            logger.error(f"Job {job_id} failed permanently: {error}")

        pipe.hset(self.jobs_key, job_id, json.dumps(job.to_dict()))
        pipe.execute()

    def get_job(self, job_id: str) -> Optional[Dict]:
        data = self.redis.hget(self.jobs_key, job_id)
        return json.loads(data) if data else None

    def get_stats(self) -> Dict:
        return {
            "pending": self.redis.llen(self.queue_key),
            "processing": self.redis.llen(self.processing_key),
            "failed": self.redis.llen(self.failed_key),
            "total_jobs": self.redis.hlen(self.jobs_key)
        }

    def retry_job(self, job_id: str):
        # Move from failed to pending
        # Reset retries
        job_data = self.redis.hget(self.jobs_key, job_id)
        if not job_data:
            return False

        job = Job.from_dict(json.loads(job_data))
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

    def clear_failed(self):
        # Clear all failed jobs
        failed_jobs = self.redis.lrange(self.failed_key, 0, -1)
        if not failed_jobs:
            return 0

        pipe = self.redis.pipeline()
        for job_id in failed_jobs:
            pipe.lrem(self.failed_key, 0, job_id)
            # Optionally delete from hash too if we want to clean up completely
            # pipe.hdel(self.jobs_key, job_id)
        pipe.execute()
        return len(failed_jobs)
