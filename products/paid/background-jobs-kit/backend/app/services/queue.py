from functools import lru_cache
from app.core.config import settings
from app.core.interfaces import QueueInterface, JobStatus, BaseJob
from app.services.redis_queue import RedisQueue
from app.services.mongo_queue import MongoQueue

# Re-export for compatibility
JobStatus = JobStatus

@lru_cache()
def get_queue_service() -> QueueInterface:
    if settings.QUEUE_BACKEND == "mongo":
        return MongoQueue()
    return RedisQueue()

# For backward compatibility if needed, though we should update consumers
QueueService = get_queue_service
