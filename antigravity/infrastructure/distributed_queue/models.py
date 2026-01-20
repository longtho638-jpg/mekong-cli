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

    def to_json(self) -> Dict[str, Any]:
        """Serialize job to JSON-safe dict (alternative to pickle)."""
        import json

        return {
            "job_id": self.job_id,
            "name": self.name,
            "data": json.dumps(self.data) if not isinstance(self.data, str) else self.data,
            "priority": self.priority.value,
            "status": self.status.value,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "failed_at": self.failed_at,
            "worker_id": self.worker_id,
            "retry_count": self.retry_count,
            "timeout": self.timeout,
            "max_retries": self.max_retries,
            "metadata": self.metadata,
        }

    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "Job":
        """Deserialize job from JSON-safe dict (alternative to pickle)."""
        import json

        job_data = data.get("data", {})
        if isinstance(job_data, str):
            try:
                job_data = json.loads(job_data)
            except json.JSONDecodeError:
                pass

        return cls(
            job_id=data["job_id"],
            name=data["name"],
            data=job_data,
            priority=JobPriority(data.get("priority", 3)),
            status=JobStatus(data.get("status", "pending")),
            created_at=data.get("created_at", time.time()),
            started_at=data.get("started_at"),
            completed_at=data.get("completed_at"),
            failed_at=data.get("failed_at"),
            worker_id=data.get("worker_id"),
            retry_count=data.get("retry_count", 0),
            timeout=data.get("timeout"),
            max_retries=data.get("max_retries", 3),
            metadata=data.get("metadata", {}),
        )


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
