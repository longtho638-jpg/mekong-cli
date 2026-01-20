"""
Distributed Queue Package.

Exports:
- DistributedQueue (Facade)
- Job, JobStatus, JobPriority, QueueStats
- Global functions: submit_job, get_next_job, complete_job
"""

from typing import Any

from .backends.memory_backend import MemoryBackend
from .config import DEFAULT_REDIS_URL
from .models import Job, JobPriority, JobStatus, QueueStats
from .queue_manager import QueueManager
from .worker import QueueWorker

# Re-export modules
__all__ = [
    "DistributedQueue",
    "Job",
    "JobStatus",
    "JobPriority",
    "QueueStats",
    "QueueManager",
    "QueueWorker",
    "distributed_queue",
    "submit_job",
    "get_next_job",
    "complete_job",
    "get_queue_stats",
    "export_queue_state"
]

# -----------------------------------------------------------------------------
# Facade Class for Backward Compatibility
# -----------------------------------------------------------------------------

class DistributedQueue:
    """
    Facade for QueueManager to maintain backward compatibility with original DistributedQueue.
    """
    def __init__(self, redis_url: str = "redis://localhost:6379", max_workers: int = 10, fallback_to_memory: bool = True):
        self.manager = QueueManager(redis_url=redis_url, fallback_to_memory=fallback_to_memory)
        self.max_workers = max_workers
        self.workers = []

        # Start background workers if needed (mirroring original behavior)
        self._start_background_processors()

    @property
    def redis_available(self) -> bool:
        return self.manager.redis_available

    @property
    def stats(self) -> QueueStats:
        return self.manager.get_stats()

    def submit_job(self, *args, **kwargs) -> str:
        """Delegate to manager."""
        return self.manager.submit_job(*args, **kwargs) or ""

    def get_next_job(self, worker_id: str = None, timeout: float = None) -> Job:
        """Delegate to manager."""
        # Handle optional worker_id
        wid = worker_id or "anonymous_worker"
        return self.manager.get_next_job(worker_id=wid, timeout=timeout)

    def complete_job(self, job_id: str, result: Any = None, success: bool = True, worker_id: str = None, error: str = None):
        """
        Complete job.

        NOTE: The original implementation of this method had a bug where 'job' was undefined in the Redis path.
        Also, the new architecture prefers passing the Job object.

        We will attempt to support legacy ID-based completion by constructing a partial Job object
        or by searching in MemoryBackend.
        """
        # For memory backend, we can try to find the job to remove it
        if not self.manager.redis_available and isinstance(self.manager.backend, MemoryBackend):
            backend: MemoryBackend = self.manager.backend

            # Search for job in running queues
            # This is inefficient but compatible
            found_job = None
            with backend.lock:
                for queue in backend.memory_queue.values():
                    for job in queue:
                        if job.job_id == job_id:
                            found_job = job
                            break
                    if found_job: break

            if found_job:
                self.manager.complete_job(found_job, result=result, success=success, error=error)
                return

        # For Redis or if not found (and hoping backend can handle it or we construct a dummy)
        # Construct a dummy job with ID to pass to complete_job
        # WARNING: This might miss stats updates for specific priorities if we don't know the priority
        # But it allows the basic completion logic to proceed.
        dummy_job = Job(job_id=job_id, name="unknown", data=None, priority=JobPriority.NORMAL)
        self.manager.complete_job(dummy_job, result=result, success=success, error=error)

    def get_queue_stats(self) -> QueueStats:
        return self.manager.get_stats()

    def export_queue_state(self, file_path: str = None) -> str:
        """Export state (Simplified implementation)."""
        import json
        import time

        stats = self.get_queue_stats()
        state = {
            "timestamp": time.time(),
            "redis_available": self.manager.redis_available,
            "stats": {
                "total": stats.total_jobs,
                "pending": stats.pending_jobs,
                "running": stats.running_jobs
            }
        }

        if not file_path:
            file_path = f"queue_state_{int(time.time())}.json"

        try:
            with open(file_path, 'w') as f:
                json.dump(state, f, indent=2)
            return file_path
        except Exception:
            return ""

    def _start_background_processors(self):
        """Start workers."""
        for i in range(self.max_workers):
            w = QueueWorker(self.manager, f"worker_{i}")
            w.start()
            self.workers.append(w)


# -----------------------------------------------------------------------------
# Global Instance and Convenience Functions
# -----------------------------------------------------------------------------

distributed_queue = DistributedQueue()

def submit_job(*args, **kwargs):
    return distributed_queue.submit_job(*args, **kwargs)

def get_next_job(*args, **kwargs):
    return distributed_queue.get_next_job(*args, **kwargs)

def complete_job(*args, **kwargs):
    return distributed_queue.complete_job(*args, **kwargs)

def get_queue_stats():
    return distributed_queue.get_queue_stats()

def export_queue_state(*args, **kwargs):
    return distributed_queue.export_queue_state(*args, **kwargs)
