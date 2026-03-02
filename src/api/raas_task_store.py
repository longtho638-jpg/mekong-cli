"""
RaaS API — In-memory task store: persists running/completed task state by task_id.

Provides TaskStore singleton used by raas_router.py to create, update, and
retrieve task records so GET /v1/tasks/{id} can poll status after submission.
"""

from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from src.api.raas_task_models import StepDetail, TaskStatus


@dataclass
class TaskRecord:
    """Internal record for a submitted task."""

    task_id: str
    goal: str
    tenant_id: str
    status: TaskStatus = TaskStatus.PENDING
    total_steps: int = 0
    completed_steps: int = 0
    failed_steps: int = 0
    success_rate: float = 0.0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    steps: List[StepDetail] = field(default_factory=list)


class TaskStore:
    """Thread-safe in-memory store for RaaS task records.

    Uses a simple dict + RLock so concurrent requests from the same
    or different tenants don't corrupt state.
    """

    def __init__(self) -> None:
        self._records: Dict[str, TaskRecord] = {}
        self._lock = threading.RLock()

    def create(self, goal: str, tenant_id: str) -> TaskRecord:
        """Create and persist a new PENDING task record.

        Args:
            goal: High-level goal string.
            tenant_id: Resolved tenant identifier.

        Returns:
            Newly created :class:`TaskRecord`.
        """
        task_id = uuid.uuid4().hex
        record = TaskRecord(task_id=task_id, goal=goal, tenant_id=tenant_id)
        with self._lock:
            self._records[task_id] = record
        return record

    def get(self, task_id: str, tenant_id: str) -> Optional[TaskRecord]:
        """Retrieve a task record, scoped to the requesting tenant.

        Args:
            task_id: Task identifier.
            tenant_id: Caller's tenant — records from other tenants return None.

        Returns:
            :class:`TaskRecord` or ``None`` if not found / tenant mismatch.
        """
        with self._lock:
            record = self._records.get(task_id)
        if record is None or record.tenant_id != tenant_id:
            return None
        return record

    def update(self, record: TaskRecord) -> None:
        """Persist an updated task record.

        Args:
            record: Modified record to save back to the store.
        """
        with self._lock:
            self._records[record.task_id] = record


# Module-level singleton shared across all route handlers
_store = TaskStore()


def get_task_store() -> TaskStore:
    """Return the module-level TaskStore singleton."""
    return _store


__all__ = ["TaskRecord", "TaskStore", "get_task_store"]
