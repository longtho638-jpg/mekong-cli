import uuid
import time
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from croniter import croniter
from app.core.config import settings
from app.core.interfaces import SchedulerInterface, RecurringJob, QueueInterface
from app.services.queue import get_queue_service
import redis

logger = logging.getLogger(__name__)

class RedisScheduler(SchedulerInterface):
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.schedule_key = f"{settings.QUEUE_NAME}:schedule"

    async def schedule_job(self, task_name: str, cron: str, payload: Dict[str, Any]) -> str:
        job_id = str(uuid.uuid4())
        now = time.time()
        iter = croniter(cron, now)
        next_run_at = iter.get_next(float)

        job = RecurringJob(
            id=job_id,
            task_name=task_name,
            cron=cron,
            payload=payload,
            next_run_at=next_run_at
        )

        self.redis.hset(self.schedule_key, job_id, job.model_dump_json())
        logger.info(f"Scheduled recurring job {job_id} ({task_name}) with cron {cron}")
        return job_id

    async def unschedule_job(self, job_id: str) -> bool:
        result = self.redis.hdel(self.schedule_key, job_id)
        return result > 0

    async def get_jobs(self) -> List[RecurringJob]:
        data = self.redis.hgetall(self.schedule_key)
        jobs = []
        for job_json in data.values():
            try:
                jobs.append(RecurringJob.model_validate_json(job_json))
            except Exception as e:
                logger.error(f"Error parsing recurring job: {e}")
        return jobs

    async def get_due_jobs(self) -> List[RecurringJob]:
        now = time.time()
        all_jobs = await self.get_jobs()
        return [job for job in all_jobs if job.next_run_at <= now]

    async def update_next_run(self, job_id: str, next_run: float, last_run: float):
        job_data = self.redis.hget(self.schedule_key, job_id)
        if not job_data:
            return

        job = RecurringJob.model_validate_json(job_data)
        job.next_run_at = next_run
        job.last_run_at = last_run

        self.redis.hset(self.schedule_key, job_id, job.model_dump_json())

class SchedulerService:
    def __init__(self):
        self.scheduler = RedisScheduler() # Defaulting to Redis for now, can be abstracted like queue
        self.queue = get_queue_service()
        self.running = False

    async def start(self):
        self.running = True
        logger.info("Scheduler started")
        while self.running:
            try:
                due_jobs = await self.scheduler.get_due_jobs()
                for job in due_jobs:
                    logger.info(f"Triggering recurring job {job.id} ({job.task_name})")
                    # Enqueue the job
                    await self.queue.enqueue(job.task_name, job.payload)

                    # Calculate next run
                    now = time.time()
                    iter = croniter(job.cron, now)
                    next_run = iter.get_next(float)

                    # Update schedule
                    await self.scheduler.update_next_run(job.id, next_run, now)

                await asyncio.sleep(10) # Check every 10 seconds
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(10)

    def stop(self):
        self.running = False
        logger.info("Scheduler stopped")
