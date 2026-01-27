from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from enum import Enum
import time
from pydantic import BaseModel

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELAYED = "delayed"

class BaseJob:
    def __init__(
        self,
        job_id: str,
        task_name: str,
        payload: Dict[str, Any],
        status: JobStatus = JobStatus.PENDING,
        created_at: float = None,
        retries: int = 0,
        max_retries: int = 3,
        error: Optional[str] = None,
        run_at: Optional[float] = None
    ):
        self.job_id = job_id
        self.task_name = task_name
        self.payload = payload
        self.status = status
        self.created_at = created_at or time.time()
        self.retries = retries
        self.max_retries = max_retries
        self.error = error
        self.run_at = run_at or self.created_at

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        pass

    @classmethod
    @abstractmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseJob':
        pass

class QueueInterface(ABC):
    @abstractmethod
    async def enqueue(self, task_name: str, payload: Dict[str, Any], max_retries: int = 3, delay_seconds: int = 0) -> str:
        pass

    @abstractmethod
    async def dequeue(self) -> Optional[BaseJob]:
        pass

    @abstractmethod
    async def complete_job(self, job_id: str, result: Any = None):
        pass

    @abstractmethod
    async def fail_job(self, job_id: str, error: str):
        pass

    @abstractmethod
    async def get_job(self, job_id: str) -> Optional[BaseJob]:
        pass

    @abstractmethod
    async def get_stats(self) -> Dict[str, int]:
        pass

    @abstractmethod
    async def list_jobs(self, limit: int = 10, offset: int = 0, status: Optional[JobStatus] = None) -> List[BaseJob]:
        pass

    @abstractmethod
    async def retry_job(self, job_id: str) -> bool:
        pass

    @abstractmethod
    async def clear_failed(self) -> int:
        pass

class RecurringJob(BaseModel):
    id: str
    task_name: str
    cron: str
    payload: Dict[str, Any]
    next_run_at: float
    last_run_at: Optional[float] = None

class SchedulerInterface(ABC):
    @abstractmethod
    async def schedule_job(self, task_name: str, cron: str, payload: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    async def unschedule_job(self, job_id: str) -> bool:
        pass

    @abstractmethod
    async def get_jobs(self) -> List[RecurringJob]:
        pass

    @abstractmethod
    async def get_due_jobs(self) -> List[RecurringJob]:
        pass

    @abstractmethod
    async def update_next_run(self, job_id: str, next_run: float, last_run: float):
        pass
