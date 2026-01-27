import uuid
import time
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.interfaces import QueueInterface, BaseJob, JobStatus
import logging

logger = logging.getLogger(__name__)

class MongoJob(BaseJob):
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
    def from_dict(cls, data: Dict[str, Any]) -> 'MongoJob':
        # Remove _id if present from mongo document
        if "_id" in data:
            del data["_id"]
        return cls(**data)

class MongoQueue(QueueInterface):
    def __init__(self):
        self.client = AsyncIOMotorClient(settings.MONGO_URL)
        self.db = self.client[settings.MONGO_DB]
        self.collection = self.db[f"{settings.QUEUE_NAME}_jobs"]

    async def enqueue(self, task_name: str, payload: Dict[str, Any], max_retries: int = 3, delay_seconds: int = 0) -> str:
        job_id = str(uuid.uuid4())
        run_at = time.time() + delay_seconds
        status = JobStatus.DELAYED if delay_seconds > 0 else JobStatus.PENDING

        job = MongoJob(
            job_id=job_id,
            task_name=task_name,
            payload=payload,
            max_retries=max_retries,
            status=status,
            run_at=run_at
        )

        await self.collection.insert_one(job.to_dict())
        logger.info(f"Enqueued job {job_id} for task {task_name} (delay: {delay_seconds}s)")
        return job_id

    async def dequeue(self) -> Optional[BaseJob]:
        now = time.time()

        # Find and modify a job that is PENDING or DELAYED with run_at <= now
        # Atomic find_one_and_update
        job_doc = await self.collection.find_one_and_update(
            {
                "$or": [
                    {"status": JobStatus.PENDING},
                    {"status": JobStatus.DELAYED, "run_at": {"$lte": now}}
                ]
            },
            {"$set": {"status": JobStatus.PROCESSING}},
            sort=[("run_at", 1)],  # Priority to older jobs
            return_document=True
        )

        if not job_doc:
            return None

        return MongoJob.from_dict(job_doc)

    async def complete_job(self, job_id: str, result: Any = None):
        await self.collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "status": JobStatus.COMPLETED,
                    "payload.result": result
                }
            }
        )
        logger.info(f"Job {job_id} completed")

    async def fail_job(self, job_id: str, error: str):
        job_doc = await self.collection.find_one({"job_id": job_id})
        if not job_doc:
            return

        job = MongoJob.from_dict(job_doc)
        retries = job.retries + 1

        update_data = {
            "retries": retries,
            "error": error
        }

        if retries <= job.max_retries:
            update_data["status"] = JobStatus.DELAYED
            # Exponential backoff
            delay = 2 ** retries
            update_data["run_at"] = time.time() + delay
            logger.warning(f"Job {job_id} failed, retrying in {delay}s ({retries}/{job.max_retries})")
        else:
            update_data["status"] = JobStatus.FAILED
            logger.error(f"Job {job_id} failed permanently: {error}")

        await self.collection.update_one(
            {"job_id": job_id},
            {"$set": update_data}
        )

    async def get_job(self, job_id: str) -> Optional[BaseJob]:
        job_doc = await self.collection.find_one({"job_id": job_id})
        return MongoJob.from_dict(job_doc) if job_doc else None

    async def get_stats(self) -> Dict[str, int]:
        pending = await self.collection.count_documents({"status": JobStatus.PENDING})
        processing = await self.collection.count_documents({"status": JobStatus.PROCESSING})
        failed = await self.collection.count_documents({"status": JobStatus.FAILED})
        delayed = await self.collection.count_documents({"status": JobStatus.DELAYED})
        completed = await self.collection.count_documents({"status": JobStatus.COMPLETED})
        total = await self.collection.count_documents({})

        return {
            "pending": pending,
            "processing": processing,
            "failed": failed,
            "delayed": delayed,
            "completed": completed,
            "total_jobs": total
        }

    async def list_jobs(self, limit: int = 10, offset: int = 0, status: Optional[JobStatus] = None) -> List[BaseJob]:
        query = {}
        if status:
            query["status"] = status

        cursor = self.collection.find(query).skip(offset).limit(limit).sort("created_at", -1)
        jobs = []
        async for job_doc in cursor:
            jobs.append(MongoJob.from_dict(job_doc))
        return jobs

    async def retry_job(self, job_id: str) -> bool:
        result = await self.collection.update_one(
            {"job_id": job_id, "status": JobStatus.FAILED},
            {
                "$set": {
                    "status": JobStatus.PENDING,
                    "retries": 0,
                    "error": None,
                    "run_at": time.time()
                }
            }
        )
        return result.modified_count > 0

    async def clear_failed(self) -> int:
        # Delete failed jobs or just update them? Interface says clear, could mean delete or archive.
        # Based on Redis implementation which deletes from failed list but keeps in hash,
        # here we might want to just delete them or archive them.
        # Let's delete them to match the "clear" semantics.
        result = await self.collection.delete_many({"status": JobStatus.FAILED})
        return result.deleted_count
