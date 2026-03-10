"""Tests for Hybrid LLM Router — Main Orchestrator.

Tests the 9-stage pipeline integration with mocked LLM calls.
"""

from __future__ import annotations

import asyncio
from unittest.mock import patch, MagicMock

import pytest

from src.core.hybrid_router import (
    MissionResult,
    route_and_execute,
    _get_system_state,
)
from src.core.mcu_gate import MCUGate
from src.core.model_selector import SystemState
from src.core.fallback_chain import FallbackResult


@pytest.fixture
def gate():
    g = MCUGate(":memory:")
    g.seed_balance("t1", 100)
    yield g
    g.close()


@pytest.fixture
def api_state():
    """System state with API keys only (no local)."""
    return SystemState(
        local_available=False,
        local_models=[],
        api_keys={"anthropic": True, "google": True, "openai": False},
        tenant_tier="growth",
    )


class TestMissionResult:
    def test_success_result(self):
        r = MissionResult(success=True, mission_id="m1", model_used="claude-sonnet-4-6", mcu_charged=3)
        assert r.success is True
        assert r.mcu_charged == 3

    def test_failure_result(self):
        r = MissionResult(success=False, error="insufficient_mcu")
        assert r.success is False
        assert r.model_used is None

    def test_defaults(self):
        r = MissionResult(success=True)
        assert r.mission_id == ""
        assert r.output == ""
        assert r.attempts == []


class TestRouteAndExecuteStage2:
    """Test MCU lock failures (Stage 2)."""

    def test_insufficient_mcu(self, gate, api_state):
        gate_low = MCUGate(":memory:")
        gate_low.seed_balance("t1", 2)

        result = asyncio.run(route_and_execute(
            goal="build a complex distributed system with microservices",
            tenant_id="t1",
            mcu_gate=gate_low,
            system_state=api_state,
        ))
        assert result.success is False
        assert "insufficient_mcu" in result.error or "tenant_not_found" in result.error
        gate_low.close()

    def test_unknown_tenant(self, api_state):
        gate = MCUGate(":memory:")
        result = asyncio.run(route_and_execute(
            goal="hello",
            tenant_id="ghost",
            mcu_gate=gate,
            system_state=api_state,
        ))
        assert result.success is False
        assert result.error == "tenant_not_found"
        gate.close()


class TestRouteAndExecuteSuccess:
    """Test successful execution (Stages 1-9)."""

    @patch("src.core.hybrid_router.execute_with_fallback")
    def test_full_pipeline_success(self, mock_exec, gate, api_state):
        mock_exec.return_value = FallbackResult(
            success=True,
            model_used="gemini-2.0-flash",
            tokens_output=50,
            attempts=["gemini-2.0-flash"],
            output="Hello world response",
        )

        result = asyncio.run(route_and_execute(
            goal="write a simple hello world script",
            tenant_id="t1",
            mcu_gate=gate,
            system_state=api_state,
        ))

        assert result.success is True
        assert result.model_used == "gemini-2.0-flash"
        assert result.mcu_charged > 0
        assert result.output == "Hello world response"
        assert result.profile is not None

    @patch("src.core.hybrid_router.execute_with_fallback")
    def test_mcu_deducted_on_success(self, mock_exec, gate, api_state):
        mock_exec.return_value = FallbackResult(
            success=True,
            model_used="gemini-2.0-flash",
            tokens_output=10,
            attempts=["gemini-2.0-flash"],
            output="done",
        )

        bal_before = gate.get_balance("t1")["balance"]
        asyncio.run(route_and_execute(
            goal="fix a small bug",
            tenant_id="t1",
            mcu_gate=gate,
            system_state=api_state,
        ))
        bal_after = gate.get_balance("t1")["balance"]
        assert bal_after < bal_before

    @patch("src.core.hybrid_router.execute_with_fallback")
    def test_auto_generates_mission_id(self, mock_exec, gate, api_state):
        mock_exec.return_value = FallbackResult(
            success=True, model_used="gemini-2.0-flash",
            tokens_output=1, attempts=["gemini-2.0-flash"], output="ok",
        )

        result = asyncio.run(route_and_execute(
            goal="hello",
            tenant_id="t1",
            mcu_gate=gate,
            system_state=api_state,
        ))
        assert len(result.mission_id) > 0


class TestRouteAndExecuteFailure:
    """Test failure paths (Stage 6+7)."""

    @patch("src.core.hybrid_router.execute_with_fallback")
    def test_all_models_failed_refunds_mcu(self, mock_exec, gate, api_state):
        mock_exec.return_value = FallbackResult(
            success=False,
            error="all_models_failed",
            attempts=["gemini-2.0-flash", "gpt-4o-mini"],
        )

        bal_before = gate.get_balance("t1")["balance"]
        result = asyncio.run(route_and_execute(
            goal="do something",
            tenant_id="t1",
            mcu_gate=gate,
            system_state=api_state,
        ))
        bal_after = gate.get_balance("t1")["balance"]

        assert result.success is False
        assert result.error == "all_models_failed"
        assert bal_after == bal_before  # fully refunded

    @patch("src.core.hybrid_router.execute_with_fallback", side_effect=ConnectionError("down"))
    def test_execution_exception_refunds_mcu(self, mock_exec, gate, api_state):
        bal_before = gate.get_balance("t1")["balance"]
        result = asyncio.run(route_and_execute(
            goal="test task",
            tenant_id="t1",
            mcu_gate=gate,
            system_state=api_state,
        ))
        bal_after = gate.get_balance("t1")["balance"]

        assert result.success is False
        assert "execution_failed" in result.error
        assert bal_after == bal_before


class TestGetSystemState:
    @patch("src.core.local_adapter.OllamaAdapter")
    def test_local_unavailable(self, mock_adapter_cls):
        mock_adapter = MagicMock()
        mock_adapter.health_check.return_value = False
        mock_adapter_cls.return_value = mock_adapter

        state = _get_system_state()
        assert state.local_available is False
        assert state.local_models == []

    @patch("src.core.local_adapter.OllamaAdapter")
    def test_local_available(self, mock_adapter_cls):
        mock_adapter = MagicMock()
        mock_adapter.health_check.return_value = True
        mock_adapter.list_models.return_value = ["llama3.2:3b"]
        mock_adapter_cls.return_value = mock_adapter

        state = _get_system_state()
        assert state.local_available is True
        assert "llama3.2:3b" in state.local_models
