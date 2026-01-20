"""
Distributed Queue Models - Data definitions.

This module defines:
- JobStatus: Enum for job states
- JobPriority: Enum for priority levels
- Job: Dataclass for job representation
- QueueStats: Dataclass for statistics
"""

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional


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
        """Validate and initialize defaults."""
        if not self.job_id:
            self.job_id = str(uuid.uuid4())

        # Ensure created_at is a float (handling potential serialization issues)
        if not isinstance(self.created_at, (int, float)):
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
