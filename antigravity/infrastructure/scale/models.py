"""
Scale Infrastructure - Models.
==============================

Data structures for scaling infrastructure.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict


@dataclass
class QueuedTask:
    """Task in processing queue."""

    id: str
    task_type: str
    payload: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    priority: int = 5  # 1=highest, 10=lowest
    retries: int = 0
    max_retries: int = 3


@dataclass
class WorkerPool:
    """Worker pool for task processing."""

    name: str
    size: int
    active_workers: int = 0
    tasks_processed: int = 0
    tasks_failed: int = 0
