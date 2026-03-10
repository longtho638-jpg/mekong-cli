"""Unit tests for Mekong RaaS SDK — /v1/ API client."""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch

from src.raas.sdk import (
    AgentInfo,
    AgentResult,
    MekongAPIError,
    MekongAsyncClient,
    MekongClient,
    StepDetail,
    Task,
    TaskResult,
    _parse_sse_line,
    _parse_step,
    _parse_task,
    _raise_for_status,
)


# ---------------------------------------------------------------------------
# Dataclass construction
# ---------------------------------------------------------------------------


class TestDataclasses:
    def test_step_detail(self):
        s = StepDetail(order=1, title="Init", passed=True, exit_code=0, summary="ok")
        assert s.order == 1
        assert s.passed is True

    def test_task(self):
        t = Task(task_id="t1", status="pending", goal="deploy", tenant_id="ten1")
        assert t.task_id == "t1"
        assert t.steps == []
        assert t.errors == []

    def test_task_result(self):
        tr = TaskResult(task_id="t2", status="running", tenant_id="ten1")
        assert tr.status == "running"

    def test_agent_info(self):
        a = AgentInfo(name="git", description="Git agent")
        assert a.name == "git"

    def test_agent_result(self):
        ar = AgentResult(agent="shell", status="success", output="done")
        assert ar.errors == []

    def test_task_with_steps(self):
        step = StepDetail(order=0, title="build", passed=True, exit_code=0, summary="ok")
        t = Task(
            task_id="t3", status="success", goal="build", tenant_id="ten1",
            total_steps=1, completed_steps=1, steps=[step],
        )
        assert len(t.steps) == 1
        assert t.steps[0].title == "build"


# ---------------------------------------------------------------------------
# SSE parsing
# ---------------------------------------------------------------------------


class TestSSEParsing:
    def test_valid_data_line(self):
        line = 'data: {"type": "step", "order": 1}'
        result = _parse_sse_line(line)
        assert result == {"type": "step", "order": 1}

    def test_empty_data_line(self):
        assert _parse_sse_line("data: ") is None
        assert _parse_sse_line("data:") is None

    def test_non_data_line(self):
        assert _parse_sse_line("event: ping") is None
        assert _parse_sse_line("") is None
        assert _parse_sse_line(": comment") is None

    def test_invalid_json(self):
        assert _parse_sse_line("data: {broken") is None

    def test_data_with_extra_spaces(self):
        line = 'data:   {"k": "v"}  '
        result = _parse_sse_line(line)
        assert result == {"k": "v"}


# ---------------------------------------------------------------------------
# Parse helpers
# ---------------------------------------------------------------------------


class TestParseHelpers:
    def test_parse_step(self):
        raw = {"order": 2, "title": "test", "passed": False, "exit_code": 1, "summary": "fail"}
        s = _parse_step(raw)
        assert s.order == 2
        assert s.passed is False

    def test_parse_task_minimal(self):
        raw = {"task_id": "t1", "status": "pending", "goal": "g", "tenant_id": "ten"}
        t = _parse_task(raw)
        assert t.task_id == "t1"
        assert t.steps == []
        assert t.success_rate == 0.0

    def test_parse_task_full(self):
        raw = {
            "task_id": "t2", "status": "success", "goal": "deploy",
            "tenant_id": "ten", "total_steps": 2, "completed_steps": 2,
            "failed_steps": 0, "success_rate": 1.0,
            "errors": [], "warnings": ["slow"],
            "steps": [
                {"order": 0, "title": "a", "passed": True, "exit_code": 0, "summary": "ok"},
                {"order": 1, "title": "b", "passed": True, "exit_code": 0, "summary": "ok"},
            ],
        }
        t = _parse_task(raw)
        assert len(t.steps) == 2
        assert t.warnings == ["slow"]


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


class TestErrorHandling:
    def test_mekong_api_error(self):
        err = MekongAPIError(404, "not found")
        assert err.status_code == 404
        assert "404" in str(err)
        assert "not found" in str(err)

    def test_raise_for_status_success(self):
        resp = MagicMock()
        resp.is_success = True
        _raise_for_status(resp)  # should not raise

    def test_raise_for_status_json_detail(self):
        resp = MagicMock()
        resp.is_success = False
        resp.status_code = 422
        resp.json.return_value = {"detail": "validation error"}
        with pytest.raises(MekongAPIError) as exc_info:
            _raise_for_status(resp)
        assert exc_info.value.status_code == 422
        assert "validation error" in exc_info.value.detail

    def test_raise_for_status_text_fallback(self):
        resp = MagicMock()
        resp.is_success = False
        resp.status_code = 500
        resp.json.side_effect = ValueError("not json")
        resp.text = "Internal Server Error"
        with pytest.raises(MekongAPIError) as exc_info:
            _raise_for_status(resp)
        assert exc_info.value.status_code == 500
        assert "Internal Server Error" in exc_info.value.detail


# ---------------------------------------------------------------------------
# Header generation
# ---------------------------------------------------------------------------


class TestHeaders:
    def test_sync_client_headers(self):
        c = MekongClient("https://api.test", "tok-123")
        assert c._headers == {"Authorization": "Bearer tok-123"}

    def test_async_client_headers(self):
        c = MekongAsyncClient("https://api.test", "tok-456")
        assert c._headers == {"Authorization": "Bearer tok-456"}

    def test_base_url_trailing_slash_stripped(self):
        c = MekongClient("https://api.test/", "key")
        assert c._base_url == "https://api.test"


# ---------------------------------------------------------------------------
# Sync client methods (mocked httpx)
# ---------------------------------------------------------------------------


class TestMekongClientMethods:
    def _make_client(self) -> MekongClient:
        return MekongClient("https://api.test", "tok")

    @patch("src.raas.sdk.httpx.Client")
    def test_submit_task(self, mock_client_cls):
        resp = MagicMock()
        resp.is_success = True
        resp.json.return_value = {"task_id": "t1", "status": "pending", "tenant_id": "ten"}
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=MagicMock(request=MagicMock(return_value=resp)))
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        c = self._make_client()
        result = c.submit_task("deploy app")
        assert isinstance(result, TaskResult)
        assert result.task_id == "t1"

    @patch("src.raas.sdk.httpx.Client")
    def test_get_task(self, mock_client_cls):
        resp = MagicMock()
        resp.is_success = True
        resp.json.return_value = {
            "task_id": "t2", "status": "success", "goal": "build",
            "tenant_id": "ten", "steps": [],
        }
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=MagicMock(request=MagicMock(return_value=resp)))
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        c = self._make_client()
        task = c.get_task("t2")
        assert isinstance(task, Task)
        assert task.goal == "build"

    @patch("src.raas.sdk.httpx.Client")
    def test_list_agents(self, mock_client_cls):
        resp = MagicMock()
        resp.is_success = True
        resp.json.return_value = [
            {"name": "git", "description": "Git ops"},
            {"name": "shell", "description": "Shell runner"},
        ]
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=MagicMock(request=MagicMock(return_value=resp)))
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        c = self._make_client()
        agents = c.list_agents()
        assert len(agents) == 2
        assert agents[0].name == "git"

    @patch("src.raas.sdk.httpx.Client")
    def test_run_agent(self, mock_client_cls):
        resp = MagicMock()
        resp.is_success = True
        resp.json.return_value = {"agent": "git", "status": "success", "output": "done", "errors": []}
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=MagicMock(request=MagicMock(return_value=resp)))
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        c = self._make_client()
        result = c.run_agent("git", "status")
        assert isinstance(result, AgentResult)
        assert result.output == "done"

    @patch("src.raas.sdk.httpx.Client")
    def test_request_error_raises(self, mock_client_cls):
        resp = MagicMock()
        resp.is_success = False
        resp.status_code = 401
        resp.json.return_value = {"detail": "unauthorized"}
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=MagicMock(request=MagicMock(return_value=resp)))
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        c = self._make_client()
        with pytest.raises(MekongAPIError) as exc_info:
            c.submit_task("fail")
        assert exc_info.value.status_code == 401
