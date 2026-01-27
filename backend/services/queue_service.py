import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import redis
from pydantic import BaseModel, Field

from backend.api.config import settings

logger = logging.getLogger(__name__)

class JobSchema(BaseModel):
    """Schema for a job in the queue"""
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "normal"
    status: str = "pending"
    attempts: int = 0
    max_retries: int = 3
    retry_delay_seconds: List[int] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    run_at: Optional[str] = None
    tenant_id: Optional[str] = None

class QueueService:
    """
    Service to interact with Redis-based Job Queues.
    Supports priority queues, delayed jobs, and DLQ.
    """

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client or redis.from_url(settings.redis_url, decode_responses=True)
        self.queue_prefix = "agencyos:queue:"
        self.job_key_prefix = "agencyos:job:"
        self.queues = {
            "high": f"{self.queue_prefix}high",
            "normal": f"{self.queue_prefix}normal",
            "low": f"{self.queue_prefix}low",
            "dlq": f"{self.queue_prefix}dlq"
        }

    def enqueue_job(self,
                   job_type: str,
                   payload: Dict[str, Any],
                   priority: str = "normal",
                   run_at: Optional[datetime] = None,
                   max_retries: int = 3,
                   retry_delay_seconds: Optional[List[int]] = None,
                   tenant_id: Optional[str] = None) -> str:
        """
        Add a job to the queue.

        Args:
            job_type: Type of job (e.g., 'send_email')
            payload: Job data
            priority: 'high', 'normal', 'low'
            run_at: Schedule job for later execution
            max_retries: Number of retries on failure
            retry_delay_seconds: List of delays between retries
            tenant_id: Tenant ID for multi-tenancy

        Returns:
            job_id
        """
        if priority not in self.queues and priority != "dlq":
            priority = "normal"

        job_id = str(uuid.uuid4())
        job = JobSchema(
            job_id=job_id,
            type=job_type,
            payload=payload,
            priority=priority,
            status="pending",
            attempts=0,
            max_retries=max_retries,
            retry_delay_seconds=retry_delay_seconds or [60, 300, 900],
            created_at=datetime.utcnow().isoformat(),
            run_at=run_at.isoformat() if run_at else None,
            tenant_id=tenant_id
        )

        job_json = job.model_dump_json()

        # Store job details
        self.redis.setex(f"{self.job_key_prefix}{job_id}", 86400 * 7, job_json)  # Expire after 7 days

        if run_at and run_at > datetime.utcnow():
            # Add to sorted set for delayed execution
            score = run_at.timestamp()
            self.redis.zadd(f"{self.queue_prefix}schedule", {job_id: score})
            logger.info(f"Scheduled job {job_id} ({job_type}) for {run_at}")
        else:
            # Add to immediate queue
            queue_name = self.queues[priority]
            self.redis.rpush(queue_name, job_id)
            logger.info(f"Enqueued job {job_id} ({job_type}) to {queue_name}")

        return job_id

    def get_job(self, job_id: str) -> Optional[JobSchema]:
        """Get job details from Redis"""
        data = self.redis.get(f"{self.job_key_prefix}{job_id}")
        if data:
            return JobSchema.model_validate_json(data)
        return None

    def update_job_status(self, job_id: str, status: str, error: Optional[str] = None):
        """Update job status in Redis"""
        job = self.get_job(job_id)
        if job:
            job.status = status
            self.redis.set(f"{self.job_key_prefix}{job_id}", job.model_dump_json())
            # Note: In a real system we might persist this to Postgres here too

    def get_queue_metrics(self) -> Dict[str, Any]:
        """Get current queue depths"""
        return {
            "high": self.redis.llen(self.queues["high"]),
            "normal": self.redis.llen(self.queues["normal"]),
            "low": self.redis.llen(self.queues["low"]),
            "dlq": self.redis.llen(self.queues["dlq"]),
            "scheduled": self.redis.zcard(f"{self.queue_prefix}schedule")
        }

    def register_worker_heartbeat(self, worker_id: str, queues: List[str]):
        """Register worker heartbeat"""
        key = f"agencyos:worker:{worker_id}"
        data = {
            "id": worker_id,
            "queues": queues,
            "last_heartbeat": datetime.utcnow().isoformat()
        }
        self.redis.setex(key, 60, json.dumps(data)) # Expire after 60s

    def get_active_workers(self) -> List[Dict[str, Any]]:
        """Get list of active workers"""
        keys = self.redis.keys("agencyos:worker:*")
        workers = []
        if keys:
            data = self.redis.mget(keys)
            for d in data:
                if d:
                    workers.append(json.loads(d))
        return workers

    def retry_job(self, job_id: str):
        """
        Retry a failed job manually.
        Moves from whatever state to pending in its original priority queue.
        """
        job = self.get_job(job_id)
        if not job:
            return False

        job.status = "pending"
        job.attempts = 0 # Reset attempts? Or keep history? Usually for manual retry we reset.

        self.redis.set(f"{self.job_key_prefix}{job_id}", job.model_dump_json())
        self.redis.rpush(self.queues[job.priority], job_id)
        return True
