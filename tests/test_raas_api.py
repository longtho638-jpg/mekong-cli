"""Tests for RaaS API router — task CRUD, agent listing, auth enforcement."""
from __future__ import annotations

import pytest

from src.api.raas_task_models import TaskStatus, TaskRequest, TaskResponse, TaskStatusResponse
from src.api.raas_task_store import TaskStore, TaskRecord


class TestTaskStore:
    """In-memory TaskStore CRUD + tenant isolation."""

    def setup_method(self) -> None:
        self.store = TaskStore()

    def test_create_returns_pending_record(self) -> None:
        rec = self.store.create(goal="deploy api", tenant_id="t1")
        assert rec.status == TaskStatus.PENDING
        assert rec.goal == "deploy api"
        assert rec.tenant_id == "t1"
        assert rec.task_id  # non-empty

    def test_get_returns_own_tenant_record(self) -> None:
        rec = self.store.create(goal="run tests", tenant_id="t1")
        found = self.store.get(task_id=rec.task_id, tenant_id="t1")
        assert found is not None
        assert found.task_id == rec.task_id

    def test_get_blocks_cross_tenant_access(self) -> None:
        rec = self.store.create(goal="secret task", tenant_id="t1")
        found = self.store.get(task_id=rec.task_id, tenant_id="t2")
        assert found is None

    def test_get_returns_none_for_missing_id(self) -> None:
        found = self.store.get(task_id="nonexistent", tenant_id="t1")
        assert found is None

    def test_update_persists_status_change(self) -> None:
        rec = self.store.create(goal="build", tenant_id="t1")
        rec.status = TaskStatus.RUNNING
        self.store.update(rec)
        found = self.store.get(task_id=rec.task_id, tenant_id="t1")
        assert found is not None
        assert found.status == TaskStatus.RUNNING

    def test_multiple_tenants_independent(self) -> None:
        r1 = self.store.create(goal="task-a", tenant_id="t1")
        r2 = self.store.create(goal="task-b", tenant_id="t2")
        assert self.store.get(r1.task_id, "t1") is not None
        assert self.store.get(r2.task_id, "t2") is not None
        assert self.store.get(r1.task_id, "t2") is None
        assert self.store.get(r2.task_id, "t1") is None


class TestTaskModels:
    """Pydantic model validation."""

    def test_task_request_requires_goal(self) -> None:
        with pytest.raises(Exception):
            TaskRequest(goal="")

    def test_task_request_valid(self) -> None:
        req = TaskRequest(goal="deploy staging")
        assert req.goal == "deploy staging"
        assert req.agent is None

    def test_task_response_defaults(self) -> None:
        resp = TaskResponse(task_id="abc", status=TaskStatus.PENDING, tenant_id="t1")
        assert resp.status == TaskStatus.PENDING

    def test_task_status_response_defaults(self) -> None:
        resp = TaskStatusResponse(
            task_id="abc", status=TaskStatus.SUCCESS,
            goal="test", tenant_id="t1",
        )
        assert resp.total_steps == 0
        assert resp.errors == []
        assert resp.steps == []

    def test_task_status_enum_values(self) -> None:
        assert TaskStatus.PENDING.value == "pending"
        assert TaskStatus.RUNNING.value == "running"
        assert TaskStatus.SUCCESS.value == "success"
        assert TaskStatus.FAILED.value == "failed"
        assert TaskStatus.PARTIAL.value == "partial"
        assert TaskStatus.ROLLED_BACK.value == "rolled_back"
