"""
🌐 Distributed Queue System - Redis-Based Job Processing
===================================================

High-performance distributed queue with Redis backend:
- Dead letter queue for failed jobs
- Priority-based job scheduling
- Job orchestration across multiple workers
- SLA guarantees with timeout and retry
- Performance monitoring and analytics
"""

import time
import json
import logging
import pickle
import uuid
from typing import Dict, Any, List, Optional, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
from threading import Lock
import asyncio

# Redis support (with fallback)
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger = logging.getLogger(__name__)

class JobStatus(Enum):
    """Job status tracking."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    DEAD_LETTER = "dead_letter"

class JobPriority(Enum):
    """Job priority levels."""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5

@dataclass
class Job:
    """Job definition."""
    job_id: str
    name: str
    data: Any
    priority: JobPriority = JobPriority.NORMAL
    status: JobStatus = JobStatus.PENDING
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    failed_at: Optional[float] = None
    worker_id: Optional[str] = None
    retry_count: int = 0
    timeout: Optional[float] = None
    max_retries: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        if hasattr(self.created_at, '__post_init__'):
            self.created_at = time.time()

@dataclass
class QueueStats:
    """Queue statistics."""
    total_jobs: int = 0
    pending_jobs: int = 0
    running_jobs: int = 0
    completed_jobs: int = 0
    failed_jobs: int = 0
    timeout_jobs: int = 0
    dead_letter_jobs: int = 0
    avg_completion_time: float = 0.0
    jobs_per_hour: float = 0.0
    error_rate: float = 0.0

class DistributedQueue:
    """High-performance distributed queue with Redis backend."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", max_workers: int = 10, fallback_to_memory: bool = True):
        self.redis_url = redis_url
        self.max_workers = max_workers
        self.fallback_to_memory = fallback_to_memory
        self.redis_client = None
        self.memory_queue = defaultdict(deque)
        self.lock = Lock()
        self.stats = QueueStats()
        self.worker_registry = {}
        self.job_timeouts = {
            JobPriority.CRITICAL: 300,      # 5 minutes
            JobPriority.HIGH: 600,         # 10 minutes
            JobPriority.NORMAL: 1800,       # 30 minutes
            JobPriority.LOW: 3600,      # 1 hour
            JobPriority.BACKGROUND: 7200     # 2 hours
        }
        
        self.priority_queues = {
            JobPriority.CRITICAL: "critical_jobs",
            JobPriority.HIGH: "high_priority_jobs",
            JobPriority.NORMAL: "normal_jobs",
            JobPriority.LOW: "low_priority_jobs",
            JobPriority.BACKGROUND: "background_jobs"
        }
        
        # Initialize connection
        self._initialize_redis_connection()
        
        # Start background processors
        self._start_background_processors()
    
    def _initialize_redis_connection(self):
        """Initialize Redis connection."""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, using in-memory fallback")
            return
        
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("Distributed queue connected to Redis")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            if not self.fallback_to_memory:
                raise
    
    def submit_job(
        self,
        name: str,
        data: Any,
        priority: JobPriority = JobPriority.NORMAL,
        worker_id: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: int = 3,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Submit job to distributed queue."""
        job = Job(
            job_id=str(uuid.uuid4()),
            name=name,
            data=data,
            priority=priority,
            worker_id=worker_id,
            timeout=timeout,
            max_retries=max_retries,
            metadata=metadata or {}
        )
        
        # Add to appropriate queue
        if self.redis_available:
            try:
                # Serialize job
                job_data = pickle.dumps(job)
                
                # Add to Redis queue with priority score
                priority_score = self._calculate_priority_score(priority, job)
                
                # Use Redis list with priority-based scoring
                queue_key = self.priority_queues[priority]
                self.redis_client.lpush(queue_key, f"{priority_score}:{job_data}")
                
                # Update stats
                self.stats.total_jobs += 1
                self.stats.pending_jobs += 1
                
                logger.info(f"Job {job.job_id} submitted to {queue_key}")
                return job.job_id
                
            except Exception as e:
                logger.error(f"Failed to submit job to Redis: {e}")
                # Fallback to memory queue
                return self._submit_to_memory_queue(job)
        else:
            return self._submit_to_memory_queue(job)
    
    def _submit_to_memory_queue(self, job: Job) -> str:
        """Submit job to in-memory fallback queue."""
        priority_score = self._calculate_priority_score(job.priority, job)
        queue_key = self.priority_queues[job.priority]
        
        self.memory_queue[queue_key].append(job)
        self.stats.total_jobs += 1
        self.stats.pending_jobs += 1
        
        logger.info(f"Job {job.job_id} submitted to memory queue {queue_key}")
        return job.job_id
    
    def get_next_job(self, worker_id: Optional[str] = None, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next job for worker."""
        if self.redis_available:
            return self._get_next_redis_job(worker_id, timeout)
        else:
            return self._get_next_memory_job(worker_id, timeout)
    
    def _get_next_redis_job(self, worker_id: Optional[str] = None, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next job from Redis queue with priority-based selection."""
        try:
            # Check for jobs in priority order
            for priority in [JobPriority.CRITICAL, JobPriority.HIGH, JobPriority.NORMAL, JobPriority.LOW]:
                queue_key = self.priority_queues[priority]
                if queue_key:
                    # Use blocking pop with timeout
                    job_data = self.redis_client.brpoplpush(
                        queue_key,
                        count=1,
                        timeout=max(timeout or self.job_timeouts[priority], 5)
                    )
                    
                    if job_data:
                        job = pickle.loads(job_data.decode())
                        if self._is_valid_job(job):
                            job.status = JobStatus.RUNNING
                            job.started_at = time.time()
                            job.worker_id = worker_id
                            
                            # Update stats
                            self.stats.pending_jobs -= 1
                            self.stats.running_jobs += 1
                            
                            logger.info(f"Worker {worker_id} picked up job {job.job_id}")
                            return job
            
            except redis.TimeoutError:
                logger.warning(f"Timeout getting job from Redis queue for worker {worker_id}")
                return None
            except Exception as e:
                logger.error(f"Error getting job from Redis: {e}")
                return None
        
    def _get_next_memory_job(self, worker_id: Optional[str] = None, timeout: Optional[float] = None) -> Optional[Job]:
        """Get next job from in-memory queue."""
        if not self.memory_queue:
            return None
        
        # Check all priority queues in order
        for priority in [JobPriority.CRITICAL, JobPriority.HIGH, JobPriority.NORMAL, JobPriority.LOW]:
            queue_key = self.priority_queues[priority]
            
            # Check if job available
            if not self.memory_queue[queue_key]:
                continue
            
            job = self.memory_queue[queue_key].popleft()
            if self._is_valid_job(job):
                job.status = JobStatus.RUNNING
                job.started_at = time.time()
                job.worker_id = worker_id
                
                # Update stats
                self.stats.pending_jobs -= 1
                self.stats.running_jobs += 1
                
                logger.info(f"Worker {worker_id} picked up job {job.job_id} from memory queue {queue_key}")
                return job
    
    def complete_job(self, job_id: str, result: Any = None, success: bool = True, worker_id: str = None, error: Optional[str] = None):
        """Mark job as completed."""
        if self.redis_available:
            try:
                # Update job in Redis
                job.status = JobStatus.COMPLETED if success else JobStatus.FAILED
                job.completed_at = time.time()
                
                if error:
                    job.metadata["error"] = error
                job.failed_at = time.time()
                elif result is not None:
                    job.metadata["result"] = result
                
                job.worker_id = worker_id
                
                # Serialize and store
                job_data = pickle.dumps(job)
                key = f"job:{job_id}"
                
                self.redis_client.hset(key, job_data)
                self.redis_client.expire(key, 3600)  # Keep completed jobs for 1 hour
                
                # Update Redis stats
                self.redis_client.hincrby(f"stats:jobs", "completed", 1)
                
                # Update queue stats
                if success:
                    self.redis_client.hincrby(f"stats:{self.priority_queues[job.status]}", "completed", 1)
                else:
                    self.redis_client.hincrby(f"stats:jobs:{self.priority_queues[job.status]}", "failed", 1)
                
                logger.info(f"Job {job_id} completed by worker {worker_id}")
                
            except Exception as e:
                logger.error(f"Failed to complete job {job_id} in Redis: {e}")
                
        else:
            # Fallback to memory update
            for queue_key, jobs in self.memory_queue.items():
                for i, job in enumerate(jobs):
                    if job.job_id == job_id and job.status == JobStatus.RUNNING:
                        job.status = JobStatus.COMPLETED if success else JobStatus.FAILED
                        job.completed_at = time.time()
                        
                        if error:
                            job.metadata["error"] = error
                            job.failed_at = time.time()
                        elif result is not None:
                            job.metadata["result"] = result
                        
                        job.worker_id = worker_id
                        
                        del jobs[i]  # Remove from queue
                        
                if success:
                    self.stats.completed_jobs += 1
                else:
                    self.stats.failed_jobs += 1
                
                logger.info(f"Job {job_id} completed in memory queue by worker {worker_id}")
    
    def fail_job(self, job_id: str, reason: str, worker_id: str = None, retry: bool = True):
        """Mark job as failed and optionally retry."""
        job.status = JobStatus.FAILED
        job.failed_at = time.time()
        job.retry_count += 1
        
        if retry and job.retry_count < job.max_retries:
            # Re-queue job
            if self.redis_available:
                try:
                    # Remove from current queue and re-add with lower priority
                    current_queue = self.priority_queues[job.priority]
                    new_priority = min(job.priority.value + 1, JobPriority.BACKGROUND.value)
                    
                    # Serialize and re-queue
                    job_data = pickle.dumps(job)
                    self.redis_client.lpush(f"retry_queue:{new_priority}", job_data)
                    
                    logger.info(f"Job {job_id} failed and requeued with priority {new_priority} by worker {worker_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to requeue job {job_id} in Redis: {e}")
            else:
                # Fallback to memory queue
                for queue_key, jobs in self.memory_queue.items():
                    if job.job_id == job_id and job.status == JobStatus.FAILED:
                        if retry:
                            job.status = JobStatus.PENDING
                            job.retry_count -= 1 1  # Decrement for retry attempt
                        del jobs[i]  # Remove from current position
                            
                            # Re-add with lower priority
                            new_priority = min(job.priority.value + 1, JobPriority.BACKGROUND.value)
                            self.memory_queue[f"retry_queue:{new_priority}"].append(job)
                            
                            logger.info(f"Job {job_id} requeued in memory with priority {new_priority}")
                        else:
                            del jobs[i]  # Remove permanently
                            
                            self.stats.dead_letter_jobs += 1
                            
                            logger.info(f"Job {job_id} moved to dead letter queue by worker {worker_id}")
        
        self.stats.failed_jobs += 1
        logger.warning(f"Job {job_id} failed: {reason} by worker {worker_id}")
    
    def timeout_job(self, job_id: str, worker_id: str = None):
        """Mark job as timed out."""
        job.status = JobStatus.TIMEOUT
        job.failed_at = time.time()
        
        if self.redis_available:
            try:
                # Move to dead letter queue
                job_data = pickle.dumps(job)
                self.redis_client.lpush("dead_letter_queue", job_data)
                self.redis_client.expire(f"job:{job_id}", 3600)  # Keep for 1 hour
                
            except Exception as e:
                logger.error(f"Failed to timeout job {job_id} in Redis: {e}")
                
        else:
            # Fallback memory handling
            for queue_key, jobs in self.memory_queue.items():
                if job.job_id == job_id and job.status == JobStatus.RUNNING:
                    job.status = JobStatus.TIMEOUT
                    job.completed_at = time.time()
                    del jobs[i]
                    
                    self.stats.timeout_jobs += 1
                    
                    logger.info(f"Job {job_id} timed out by worker {worker_id}")
    
    def _calculate_priority_score(self, priority: JobPriority, job: Job) -> float:
        """Calculate priority score for Redis list scoring."""
        # Higher priority = lower score (since Redis LPOP returns highest score)
        priority_map = {
            JobPriority.CRITICAL: 1000,
            JobPriority.HIGH: 100,
            JobPriority.NORMAL: 10,
            JobPriority.LOW: 1,
            JobPriority.BACKGROUND: 0.1
        }
        
        # Factor in job age (newer jobs get higher score)
        age_factor = max(0, (time.time() - job.created_at) / 300)  # 5 minutes max age
        age_bonus = min(age_factor * 2, 10)  # Max 10 point bonus
        
        return priority_map[priority] - age_bonus
    
    def _is_valid_job(self, job: Job) -> bool:
        """Validate job integrity."""
        return (
            job.job_id and
            job.name and
            job.data is not None and
            isinstance(job.priority, JobPriority)
        )
    
    def _start_background_processors(self):
        """Start background processors for Redis queue monitoring."""
        # Worker simulation for demonstration
        workers = [f"worker_{i}" for i in range(self.max_workers)]
        
        for worker_id in workers:
            processor = threading.Thread(
                target=self._worker_process_loop,
                args=(worker_id,),
                daemon=True,
                name=f"QueueWorker-{worker_id}"
            )
            processor.start()
            self.worker_registry[worker_id] = processor
            logger.info(f"Started queue worker {worker_id}")
    
    def _worker_process_loop(self, worker_id: str):
        """Worker processing loop for Redis queue."""
        while True:
            try:
                # Get next job with timeout
                job = self.get_next_job(worker_id, timeout=1800)  # 30 minutes timeout
                
                if job is None:
                    time.sleep(1)  # Wait 1 second before retrying
                    continue
                
                # Process job
                logger.info(f"Worker {worker_id} processing job {job.job_id}: {job.name}")
                
                result = None
                success = True
                error = None
                
                try:
                    # Job-specific processing logic would go here
                    time.sleep(2)  # Simulate 2-second job
                    result = {"status": "completed", "data": f"processed_{job.data}"}
                    
                except Exception as e:
                    logger.error(f"Job processing error: {e}")
                    success = False
                    error = str(e)
                
                # Complete job
                self.complete_job(job.job_id, result, success, worker_id)
                
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                time.sleep(5)  # Wait 5 seconds before retrying
    
    def get_queue_stats(self) -> QueueStats:
        """Get queue statistics."""
        if self.redis_available:
            try:
                # Get Redis stats
                stats = {
                    "total_jobs": int(self.redis_client.get("stats:total_jobs") or 0),
                    "completed_jobs": int(self.redis_client.get("stats:completed_jobs") or 0),
                    "failed_jobs": int(self.redis_client.get("stats:failed_jobs") or 0),
                    "timeout_jobs": int(self.redis_client.get("stats:timeout_jobs") or 0),
                    "dead_letter_jobs": int(self.redis_client.get("stats:dead_letter_jobs") or 0)
                }
                
                # Calculate queue sizes
                for queue_name in self.priority_queues.values():
                    queue_size = self.redis_client.llen(queue_name) or 0
                    stats[f"{queue_name}_size"] = queue_size
                
                # Update in-memory stats
                self.stats = QueueStats(
                    total_jobs=stats["total_jobs"],
                    pending_jobs=sum(self.memory_queue.get(queue_name, []) for queue_name in self.priority_queues.values()),
                    running_jobs=sum(1 for job in sum(self.memory_queue.get(queue_name, []) if job.status == JobStatus.RUNNING for job in self.memory_queue.get(queue_name, [])),
                    completed_jobs=self.stats.completed_jobs,
                    failed_jobs=self.stats.failed_jobs,
                    timeout_jobs=self.stats.timeout_jobs,
                    dead_letter_jobs=self.stats.dead_letter_jobs
                )
                
                return self.stats
                
            except Exception as e:
                logger.error(f"Error getting queue stats from Redis: {e}")
                return self.stats
        
        # Fallback to memory stats
        return QueueStats(
            total_jobs=self.stats.total_jobs,
            pending_jobs=sum(len(jobs) for jobs in sum(self.memory_queue.values()) if job.status == JobStatus.PENDING),
            running_jobs=sum(1 for jobs in sum(self.memory_queue.values()) if job.status == JobStatus.RUNNING),
            completed_jobs=self.stats.completed_jobs,
            failed_jobs=self.stats.failed_jobs,
            timeout_jobs=self.stats.timeout_jobs,
            dead_letter_jobs=self.stats.dead_letter_jobs
        )
    
    def export_queue_state(self, file_path: str = None) -> str:
        """Export queue state to file."""
        state = {
            "timestamp": time.time(),
            "redis_available": self.redis_available,
            "redis_url": self.redis_url if self.redis_available else None,
            "queue_stats": self.get_queue_stats() if self.redis_available else None,
            "memory_queues": {name: list(jobs) for name, jobs in self.memory_queue.items()},
                "total_jobs": self.stats.total_jobs,
                "workers_registered": len(self.worker_registry),
                "job_timeouts": self.job_timeouts
            },
            "fallback_to_memory": self.fallback_to_memory
        }
        
        if not file_path:
            file_path = f"queue_state_{int(time.time())}.json"
            
        try:
            with open(file_path, 'w') as f:
                json.dump(state, f, indent=2)
            logger.info(f"Queue state exported to {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to export queue state: {e}")
            return ""

# Global distributed queue instance
distributed_queue = DistributedQueue()

# Export functions
def submit_job(name: str, data: Any, priority: JobPriority = JobPriority.NORMAL, worker_id: Optional[str] = None, timeout: Optional[float] = None, max_retries: int = 3, metadata: Dict[str, Any] = None) -> str:
    """Submit job to distributed queue."""
    return distributed_queue.submit_job(name, data, priority, worker_id, timeout, max_retries, metadata)

def get_next_job(worker_id: Optional[str] = None, timeout: Optional[float] = None) -> Optional[Job]:
    """Get next job for worker."""
    return distributed_queue.get_next_job(worker_id, timeout)

def complete_job(job_id: str, result: Any = None, success: bool = True, worker_id: str = None, error: Optional[str] = None):
    """Complete job."""
    distributed_queue.complete_job(job_id, result, success, worker_id, error)

def get_queue_stats() -> QueueStats:
    """Get queue statistics."""
    return distributed_queue.get_queue_stats()

def export_queue_state(file_path: str = None) -> str:
    """Export queue state."""
    return distributed_queue.export_queue_state(file_path)

__all__ = [
    "DistributedQueue",
    "distributed_queue",
    "submit_job",
    "get_next_job",
    "complete_job",
    "get_queue_stats",
    "Job",
    "JobStatus",
    "JobPriority",
    "QueueStats"
]