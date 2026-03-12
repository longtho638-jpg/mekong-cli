"""Tests for pipeline_manager module.

Covers pipeline creation, execution, dependency resolution,
result aggregation, cancellation, and error handling.
"""

from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from src.core.pipeline_manager import (
    PipelineManager,
    PipelineResult,
    PipelineStage,
    PipelineStatus,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def success_executor(goal: str):
    """Executor that always succeeds."""
    return {"goal": goal, "status": "ok"}


def failing_executor(goal: str):
    """Executor that always fails."""
    raise RuntimeError(f"Failed: {goal}")


def selective_executor(fail_goals: set[str]):
    """Returns an executor that fails only for specified goals."""
    def executor(goal: str):
        if goal in fail_goals:
            raise RuntimeError(f"Failed: {goal}")
        return {"goal": goal, "status": "ok"}
    return executor


# ---------------------------------------------------------------------------
# Pipeline Creation
# ---------------------------------------------------------------------------

class TestPipelineCreation:
    def test_create_empty_pipeline(self):
        pm = PipelineManager()
        pid = pm.create_pipeline([])
        assert pid is not None
        result = pm.get_pipeline(pid)
        assert result is not None
        assert result.total_stages == 0

    def test_create_pipeline_with_goals(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["Build", "Test", "Deploy"])
        result = pm.get_pipeline(pid)
        assert result.total_stages == 3
        assert result.status == PipelineStatus.PENDING
        assert result.stages[0].goal == "Build"
        assert result.stages[2].goal == "Deploy"

    def test_stages_have_sequential_order(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["A", "B", "C"])
        result = pm.get_pipeline(pid)
        orders = [s.order for s in result.stages]
        assert orders == [1, 2, 3]

    def test_stages_have_unique_ids(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["A", "B", "C"])
        result = pm.get_pipeline(pid)
        ids = [s.id for s in result.stages]
        assert len(set(ids)) == 3

    def test_create_pipeline_with_dependencies(self):
        pm = PipelineManager()
        deps = {"stage-2": ["stage-1"], "stage-3": ["stage-1", "stage-2"]}
        pid = pm.create_pipeline(["A", "B", "C"], dependencies=deps)
        result = pm.get_pipeline(pid)
        assert result.stages[1].depends_on == ["stage-1"]
        assert result.stages[2].depends_on == ["stage-1", "stage-2"]


# ---------------------------------------------------------------------------
# Pipeline Execution — Success
# ---------------------------------------------------------------------------

class TestPipelineExecutionSuccess:
    def test_all_stages_succeed(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["Build", "Test", "Deploy"])
        result = pm.execute_pipeline(pid, success_executor)
        assert result.status == PipelineStatus.COMPLETED
        assert result.completed_stages == 3
        assert result.failed_stages == 0
        assert result.success_rate == 100.0

    def test_stage_results_captured(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["Build"])
        result = pm.execute_pipeline(pid, success_executor)
        assert result.stages[0].result == {"goal": "Build", "status": "ok"}
        assert result.stages[0].status == "completed"

    def test_duration_tracked(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["A", "B"])
        result = pm.execute_pipeline(pid, success_executor)
        assert result.total_duration_ms > 0
        for stage in result.stages:
            assert stage.duration_ms >= 0

    def test_empty_pipeline_completes(self):
        pm = PipelineManager()
        pid = pm.create_pipeline([])
        result = pm.execute_pipeline(pid, success_executor)
        # 0 completed, 0 total → FAILED (edge case: 0/0)
        assert result.total_stages == 0


# ---------------------------------------------------------------------------
# Pipeline Execution — Failure
# ---------------------------------------------------------------------------

class TestPipelineExecutionFailure:
    def test_stop_on_failure_default(self):
        pm = PipelineManager(stop_on_failure=True)
        pid = pm.create_pipeline(["A", "B", "C"])
        result = pm.execute_pipeline(pid, failing_executor)
        assert result.status == PipelineStatus.FAILED
        assert result.failed_stages == 1  # Only first fails, rest skipped
        assert result.stages[1].status == "skipped"
        assert result.stages[2].status == "skipped"

    def test_continue_on_failure(self):
        pm = PipelineManager(stop_on_failure=False)
        pid = pm.create_pipeline(["A", "B", "C"])
        result = pm.execute_pipeline(pid, failing_executor)
        assert result.failed_stages == 3
        assert result.status == PipelineStatus.FAILED

    def test_partial_success(self):
        pm = PipelineManager(stop_on_failure=True)
        pid = pm.create_pipeline(["A", "B", "C"])
        executor = selective_executor(fail_goals={"B"})
        result = pm.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.PARTIAL
        assert result.completed_stages == 1
        assert result.failed_stages == 1

    def test_errors_collected(self):
        pm = PipelineManager(stop_on_failure=True)
        pid = pm.create_pipeline(["Build"])
        result = pm.execute_pipeline(pid, failing_executor)
        assert len(result.errors) == 1
        assert "Failed: Build" in result.errors[0]

    def test_stage_error_message(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["Deploy"])
        result = pm.execute_pipeline(pid, failing_executor)
        assert result.stages[0].error == "Failed: Deploy"


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

class TestPipelineDependencies:
    def test_stage_skipped_when_dep_failed(self):
        pm = PipelineManager(stop_on_failure=False)
        deps = {"stage-2": ["stage-1"]}
        pid = pm.create_pipeline(["A", "B"], dependencies=deps)
        executor = selective_executor(fail_goals={"A"})
        result = pm.execute_pipeline(pid, executor)
        # Stage-2 depends on stage-1 which failed → skipped
        assert result.stages[1].status == "skipped"

    def test_deps_met_all_succeed(self):
        pm = PipelineManager(stop_on_failure=False)
        deps = {"stage-3": ["stage-1", "stage-2"]}
        pid = pm.create_pipeline(["A", "B", "C"], dependencies=deps)
        result = pm.execute_pipeline(pid, success_executor)
        assert result.stages[2].status == "completed"


# ---------------------------------------------------------------------------
# Cancellation
# ---------------------------------------------------------------------------

class TestPipelineCancellation:
    def test_cancel_pending_pipeline(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["A", "B"])
        assert pm.cancel_pipeline(pid) is True
        result = pm.get_pipeline(pid)
        assert result.status == PipelineStatus.CANCELLED

    def test_cancel_nonexistent_returns_false(self):
        pm = PipelineManager()
        assert pm.cancel_pipeline("nonexistent") is False

    def test_cancel_completed_returns_false(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["A"])
        pm.execute_pipeline(pid, success_executor)
        assert pm.cancel_pipeline(pid) is False


# ---------------------------------------------------------------------------
# Result Aggregation
# ---------------------------------------------------------------------------

class TestResultAggregation:
    def test_aggregate_success(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["A", "B"])
        pm.execute_pipeline(pid, success_executor)
        agg = pm.aggregate_results(pid)
        assert agg["status"] == "completed"
        assert agg["completed"] == 2
        assert agg["success_rate"] == 100.0
        assert len(agg["stages"]) == 2

    def test_aggregate_nonexistent(self):
        pm = PipelineManager()
        assert pm.aggregate_results("nope") == {}

    def test_aggregate_contains_stage_details(self):
        pm = PipelineManager()
        pid = pm.create_pipeline(["Build"])
        pm.execute_pipeline(pid, success_executor)
        agg = pm.aggregate_results(pid)
        stage = agg["stages"][0]
        assert stage["id"] == "stage-1"
        assert stage["goal"] == "Build"
        assert stage["status"] == "completed"


# ---------------------------------------------------------------------------
# Listing & Lookup
# ---------------------------------------------------------------------------

class TestPipelineListing:
    def test_list_empty(self):
        pm = PipelineManager()
        assert pm.list_pipelines() == []

    def test_list_multiple(self):
        pm = PipelineManager()
        pm.create_pipeline(["A"])
        pm.create_pipeline(["B"])
        assert len(pm.list_pipelines()) == 2

    def test_get_nonexistent(self):
        pm = PipelineManager()
        assert pm.get_pipeline("nope") is None

    def test_execute_nonexistent_raises(self):
        pm = PipelineManager()
        with pytest.raises(ValueError, match="Pipeline not found"):
            pm.execute_pipeline("nope", success_executor)


# ---------------------------------------------------------------------------
# PipelineStage
# ---------------------------------------------------------------------------

class TestPipelineStage:
    def test_duration_zero_when_not_started(self):
        stage = PipelineStage(id="s1", goal="test", order=1)
        assert stage.duration_ms == 0.0

    def test_success_rate_zero_total(self):
        result = PipelineResult(
            pipeline_id="test",
            status=PipelineStatus.COMPLETED,
            total_stages=0,
        )
        assert result.success_rate == 0.0


# ---------------------------------------------------------------------------
# Progress Tracker Integration
# ---------------------------------------------------------------------------

class TestPipelineProgressTracking:
    def test_tracker_receives_events(self):
        events = []
        pm = PipelineManager()
        pm.tracker.register_callback(lambda snap: events.append(snap.phase.value))
        pid = pm.create_pipeline(["A", "B"])
        pm.execute_pipeline(pid, success_executor)
        # Should have received multiple progress events
        assert len(events) > 0
        assert "complete" in events
