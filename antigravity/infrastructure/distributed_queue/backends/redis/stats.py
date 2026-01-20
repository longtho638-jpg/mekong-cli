"""
Redis Stats and Admin operations.
"""
import json
import logging
from typing import Dict

from ..models import PRIORITY_QUEUES, Job, JobPriority, JobStatus, QueueStats
from .manager import RedisManager

logger = logging.getLogger(__name__)

class RedisStats(RedisManager):
    def get_stats(self) -> QueueStats:
        if not self.enabled: return QueueStats()
        try:
            keys = ["stats:total_jobs", "stats:pending_jobs", "stats:running_jobs", "stats:completed_jobs", "stats:failed_jobs", "stats:timeout_jobs", "stats:dead_letter_jobs"]
            values = self.client.mget(keys)
            def to_int(v): return int(v) if v else 0
            return QueueStats(total_jobs=to_int(values[0]), pending_jobs=to_int(values[1]), running_jobs=to_int(values[2]), completed_jobs=to_int(values[3]), failed_jobs=to_int(values[4]), timeout_jobs=to_int(values[5]), dead_letter_jobs=to_int(values[6]))
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return QueueStats()

    def move_to_dead_letter(self, job: Job) -> bool:
        if not self.enabled: return False
        try:
            job.status = JobStatus.DEAD_LETTER
            job_data = json.dumps(job.to_json()).encode("utf-8")
            self.client.lpush("dead_letter_queue", job_data)
            self.client.incr("stats:dead_letter_jobs")
            self.client.decr("stats:running_jobs")
            logger.info(f"Job {job.job_id} moved to dead letter")
            return True
        except Exception as e:
            logger.error(f"Failed to move to dead letter: {e}")
            return False

    def requeue_job(self, job: Job, new_priority_val: int) -> bool:
        if not self.enabled: return False
        try:
            new_priority_enum = JobPriority.BACKGROUND
            for p in JobPriority:
                if p.value == new_priority_val: new_priority_enum = p; break
            job.status = JobStatus.PENDING
            job.priority = new_priority_enum
            job.worker_id = None
            job_data = json.dumps(job.to_json()).encode("utf-8")
            queue_name = PRIORITY_QUEUES.get(new_priority_enum, "background_jobs")
            self.client.rpush(queue_name, job_data)
            self.client.incr("stats:pending_jobs")
            logger.info(f"Job {job.job_id} requeued with priority {new_priority_enum.name}")
            return True
        except Exception as e:
            logger.error(f"Failed to requeue job: {e}")
            return False
