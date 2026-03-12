"""Tests for src/core/timeout_manager.py."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any
from unittest.mock import patch

import pytest

from src.core.timeout_manager import (
    GlobalTimeoutError,
    StepTimeoutError,
    TimeoutConfig,
    TimeoutManager,
)


# ---------------------------------------------------------------------------
# Minimal RecipeStep stub (avoids importing parser deps)
# ---------------------------------------------------------------------------

@dataclass
class _Step:
    order: int = 1
    params: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# TimeoutConfig defaults
# ---------------------------------------------------------------------------


def test_timeout_config_defaults() -> None:
    cfg = TimeoutConfig()
    assert cfg.step_timeout == 300.0
    assert cfg.global_timeout is None
    assert cfg.grace_period == 5.0


def test_timeout_config_custom() -> None:
    cfg = TimeoutConfig(step_timeout=60.0, global_timeout=600.0, grace_period=10.0)
    assert cfg.step_timeout == 60.0
    assert cfg.global_timeout == 600.0
    assert cfg.grace_period == 10.0


# ---------------------------------------------------------------------------
# TimeoutManager.start_workflow
# ---------------------------------------------------------------------------


def test_start_workflow_records_start_time() -> None:
    tm = TimeoutManager()
    assert tm._workflow_start is None
    tm.start_workflow()
    assert tm._workflow_start is not None


def test_start_workflow_can_restart() -> None:
    tm = TimeoutManager()
    tm.start_workflow()
    first = tm._workflow_start
    time.sleep(0.01)
    tm.start_workflow()
    assert tm._workflow_start != first


# ---------------------------------------------------------------------------
# TimeoutManager.get_step_timeout — no global timeout
# ---------------------------------------------------------------------------


def test_get_step_timeout_uses_default_when_no_param() -> None:
    tm = TimeoutManager(TimeoutConfig(step_timeout=120.0))
    step = _Step(params={})
    assert tm.get_step_timeout(step) == 120.0


def test_get_step_timeout_uses_step_param() -> None:
    tm = TimeoutManager(TimeoutConfig(step_timeout=120.0))
    step = _Step(params={"timeout": 45})
    assert tm.get_step_timeout(step) == 45.0


def test_get_step_timeout_ignores_zero_param() -> None:
    """Zero or falsy timeout in params should fall back to config default."""
    tm = TimeoutManager(TimeoutConfig(step_timeout=300.0))
    step = _Step(params={"timeout": 0})
    assert tm.get_step_timeout(step) == 300.0


def test_get_step_timeout_ignores_negative_param() -> None:
    tm = TimeoutManager(TimeoutConfig(step_timeout=300.0))
    step = _Step(params={"timeout": -10})
    assert tm.get_step_timeout(step) == 300.0


def test_get_step_timeout_float_param() -> None:
    tm = TimeoutManager()
    step = _Step(params={"timeout": 90.5})
    assert tm.get_step_timeout(step) == 90.5


# ---------------------------------------------------------------------------
# TimeoutManager.get_step_timeout — capped by global timeout
# ---------------------------------------------------------------------------


def test_get_step_timeout_capped_by_remaining_global() -> None:
    tm = TimeoutManager(TimeoutConfig(step_timeout=300.0, global_timeout=50.0))
    tm.start_workflow()
    # remaining ~50s; step wants 300s → capped to ~50s
    result = tm.get_step_timeout(_Step(params={}))
    assert result <= 50.0
    assert result > 0.0


def test_get_step_timeout_not_capped_when_step_smaller() -> None:
    tm = TimeoutManager(TimeoutConfig(step_timeout=10.0, global_timeout=600.0))
    tm.start_workflow()
    result = tm.get_step_timeout(_Step(params={}))
    assert result == pytest.approx(10.0, abs=0.1)


def test_get_step_timeout_no_global_no_start() -> None:
    """Without start_workflow(), remaining_global returns None; no capping."""
    tm = TimeoutManager(TimeoutConfig(step_timeout=120.0, global_timeout=60.0))
    # _workflow_start is None → remaining_global returns None
    result = tm.get_step_timeout(_Step(params={}))
    assert result == 120.0


# ---------------------------------------------------------------------------
# TimeoutManager.remaining_global
# ---------------------------------------------------------------------------


def test_remaining_global_none_when_no_config() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=None))
    tm.start_workflow()
    assert tm.remaining_global() is None


def test_remaining_global_none_before_start() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=100.0))
    assert tm.remaining_global() is None


def test_remaining_global_positive_after_start() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=100.0))
    tm.start_workflow()
    remaining = tm.remaining_global()
    assert remaining is not None
    assert 99.0 < remaining <= 100.0


def test_remaining_global_decreases_over_time() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=100.0))
    tm.start_workflow()
    r1 = tm.remaining_global()
    time.sleep(0.05)
    r2 = tm.remaining_global()
    assert r2 is not None and r1 is not None
    assert r2 < r1


def test_remaining_global_zero_when_expired() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=0.01))
    tm.start_workflow()
    time.sleep(0.05)
    assert tm.remaining_global() == 0.0


# ---------------------------------------------------------------------------
# TimeoutManager.check_global_timeout
# ---------------------------------------------------------------------------


def test_check_global_timeout_no_op_without_config() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=None))
    tm.start_workflow()
    tm.check_global_timeout()  # should not raise


def test_check_global_timeout_no_op_before_start() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=0.001))
    # workflow not started → no raise
    tm.check_global_timeout()


def test_check_global_timeout_no_raise_within_limit() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=60.0))
    tm.start_workflow()
    tm.check_global_timeout()  # plenty of time → no raise


def test_check_global_timeout_raises_when_exceeded() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=0.01))
    tm.start_workflow()
    time.sleep(0.05)
    with pytest.raises(GlobalTimeoutError) as exc_info:
        tm.check_global_timeout()
    err = exc_info.value
    assert err.limit == 0.01
    assert err.elapsed >= 0.01


def test_check_global_timeout_error_message() -> None:
    tm = TimeoutManager(TimeoutConfig(global_timeout=1.0))
    tm.start_workflow()
    # Simulate time passing by patching monotonic
    fake_start = tm._workflow_start
    with patch("src.core.timeout_manager.time.monotonic", return_value=fake_start + 2.0):
        with pytest.raises(GlobalTimeoutError) as exc_info:
            tm.check_global_timeout()
    assert "2.0s" in str(exc_info.value)
    assert "1.0s" in str(exc_info.value)


# ---------------------------------------------------------------------------
# StepTimeoutError
# ---------------------------------------------------------------------------


def test_step_timeout_error_attributes() -> None:
    err = StepTimeoutError("step timed out", step_order=3, elapsed=45.0, limit=30.0)
    assert err.step_order == 3
    assert err.elapsed == 45.0
    assert err.limit == 30.0
    assert "step timed out" in str(err)


def test_step_timeout_error_defaults() -> None:
    err = StepTimeoutError("oops")
    assert err.step_order == 0
    assert err.elapsed == 0.0
    assert err.limit == 0.0


# ---------------------------------------------------------------------------
# GlobalTimeoutError
# ---------------------------------------------------------------------------


def test_global_timeout_error_attributes() -> None:
    err = GlobalTimeoutError("global timeout", elapsed=120.0, limit=100.0)
    assert err.elapsed == 120.0
    assert err.limit == 100.0
    assert "global timeout" in str(err)


def test_global_timeout_error_defaults() -> None:
    err = GlobalTimeoutError("boom")
    assert err.elapsed == 0.0
    assert err.limit == 0.0


# ---------------------------------------------------------------------------
# __all__ exports
# ---------------------------------------------------------------------------


def test_module_all_exports() -> None:
    from src.core import timeout_manager
    assert hasattr(timeout_manager, "__all__")
    for name in ["GlobalTimeoutError", "StepTimeoutError", "TimeoutConfig", "TimeoutManager"]:
        assert name in timeout_manager.__all__
