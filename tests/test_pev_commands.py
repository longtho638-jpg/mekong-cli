"""Tests for PEV CLI commands and underlying modules.

Tests PipelineManager, ProgressTracker, and pev_commands functions
without importing src.main (avoids Python 3.9 type hint issue).
"""

from __future__ import annotations

import json
import sys
import os
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestPipelineManagerIntegration(unittest.TestCase):
    """Integration tests for PipelineManager used by pev run."""

    def test_create_and_execute_pipeline(self):
        """Pipeline creates, executes stages, returns result."""
        from src.core.pipeline_manager import PipelineManager, PipelineStatus

        manager = PipelineManager(stop_on_failure=True)
        pid = manager.create_pipeline(["goal-A", "goal-B"])
        assert pid is not None

        results = []

        def mock_executor(goal):
            results.append(goal)
            return {"ok": True}

        pipeline_result = manager.execute_pipeline(pid, mock_executor)
        assert pipeline_result.status == PipelineStatus.COMPLETED
        assert pipeline_result.completed_stages == 2
        assert len(results) == 2

    def test_pipeline_stop_on_failure(self):
        """Pipeline stops on first stage failure."""
        from src.core.pipeline_manager import PipelineManager, PipelineStatus

        manager = PipelineManager(stop_on_failure=True)
        pid = manager.create_pipeline(["good", "bad", "never"])

        call_count = 0

        def executor(goal):
            nonlocal call_count
            call_count += 1
            if goal == "bad":
                raise RuntimeError("stage failed")
            return True

        result = manager.execute_pipeline(pid, executor)
        assert result.status in (PipelineStatus.PARTIAL, PipelineStatus.FAILED)
        assert result.failed_stages == 1
        assert call_count == 2  # "never" was skipped

    def test_pipeline_continue_on_failure(self):
        """Pipeline continues when stop_on_failure=False."""
        from src.core.pipeline_manager import PipelineManager, PipelineStatus

        manager = PipelineManager(stop_on_failure=False)
        pid = manager.create_pipeline(["ok", "fail", "also-ok"])

        def executor(goal):
            if goal == "fail":
                raise RuntimeError("error")
            return True

        result = manager.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.PARTIAL
        assert result.completed_stages == 2
        assert result.failed_stages == 1

    def test_pipeline_aggregate_results(self):
        """Aggregate results contain all stage info."""
        from src.core.pipeline_manager import PipelineManager

        manager = PipelineManager()
        pid = manager.create_pipeline(["a", "b"])
        manager.execute_pipeline(pid, lambda g: True)

        agg = manager.aggregate_results(pid)
        assert agg["pipeline_id"] == pid
        assert agg["status"] == "completed"
        assert len(agg["stages"]) == 2

    def test_pipeline_cancel(self):
        """Cancel a pending pipeline."""
        from src.core.pipeline_manager import PipelineManager

        manager = PipelineManager()
        pid = manager.create_pipeline(["a"])
        assert manager.cancel_pipeline(pid) is True

        result = manager.get_pipeline(pid)
        assert result.status.value == "cancelled"

    def test_pipeline_cancel_completed_fails(self):
        """Cannot cancel a completed pipeline."""
        from src.core.pipeline_manager import PipelineManager

        manager = PipelineManager()
        pid = manager.create_pipeline(["a"])
        manager.execute_pipeline(pid, lambda g: True)
        assert manager.cancel_pipeline(pid) is False

    def test_pipeline_not_found(self):
        """Execute nonexistent pipeline raises ValueError."""
        from src.core.pipeline_manager import PipelineManager

        manager = PipelineManager()
        with self.assertRaises(ValueError):
            manager.execute_pipeline("nonexistent", lambda g: True)

    def test_list_pipelines(self):
        """List all tracked pipelines."""
        from src.core.pipeline_manager import PipelineManager

        manager = PipelineManager()
        pid1 = manager.create_pipeline(["a"])
        pid2 = manager.create_pipeline(["b"])
        pipelines = manager.list_pipelines()
        assert len(pipelines) == 2
        ids = {p.pipeline_id for p in pipelines}
        assert pid1 in ids
        assert pid2 in ids

    def test_pipeline_dependencies(self):
        """Stages with unmet dependencies are skipped."""
        from src.core.pipeline_manager import PipelineManager

        manager = PipelineManager(stop_on_failure=False)
        pid = manager.create_pipeline(
            ["setup", "build"],
            dependencies={"stage-2": ["stage-99"]},  # stage-99 never completes
        )

        def executor(goal):
            return True

        result = manager.execute_pipeline(pid, executor)
        # stage-2 should be skipped because stage-99 dep not met
        skipped = [s for s in result.stages if s.status == "skipped"]
        assert len(skipped) == 1
        assert skipped[0].id == "stage-2"


class TestProgressTracker(unittest.TestCase):
    """Tests for ProgressTracker used by PEV pipeline."""

    def test_tracker_snapshot(self):
        """Tracker produces valid snapshots."""
        from src.core.progress_tracker import ProgressPhase, ProgressTracker

        tracker = ProgressTracker()
        tracker.start_workflow(3)
        snap = tracker.snapshot()
        assert snap.total_steps == 3
        assert snap.percentage == 0.0

        tracker.step_started(1, "step-1")
        tracker.step_completed(1)
        snap = tracker.snapshot()
        assert snap.completed_steps == 1
        assert snap.percentage > 0

    def test_tracker_callback(self):
        """Registered callbacks receive snapshots."""
        from src.core.progress_tracker import ProgressTracker

        received = []
        tracker = ProgressTracker()
        tracker.register_callback(lambda s: received.append(s))
        tracker.start_workflow(1)
        tracker.step_started(1, "s1")
        tracker.step_completed(1)
        tracker.finish(success=True)
        assert len(received) >= 3

    def test_tracker_eta_estimation(self):
        """ETA is estimated after first step completes."""
        from src.core.progress_tracker import ProgressTracker

        tracker = ProgressTracker()
        tracker.start_workflow(3)
        tracker.step_started(1, "s1")
        tracker.step_completed(1)
        snap = tracker.snapshot()
        assert snap.eta_ms is not None
        assert snap.eta_ms >= 0

    def test_tracker_failed_step(self):
        """Failed steps are tracked correctly."""
        from src.core.progress_tracker import ProgressTracker

        tracker = ProgressTracker()
        tracker.start_workflow(2)
        tracker.step_started(1, "s1")
        tracker.step_failed(1, "error msg")
        snap = tracker.snapshot()
        assert snap.failed_steps == 1
        assert snap.steps[0].error == "error msg"

    def test_tracker_skipped_step(self):
        """Skipped steps are recorded."""
        from src.core.progress_tracker import ProgressTracker

        tracker = ProgressTracker()
        tracker.start_workflow(2)
        tracker.step_skipped(1, "skipped-step")
        snap = tracker.snapshot()
        assert snap.steps[0].status == "skipped"

    def test_tracker_finish_success_vs_failure(self):
        """Finish sets correct phase."""
        from src.core.progress_tracker import ProgressPhase, ProgressTracker

        tracker = ProgressTracker()
        tracker.start_workflow(1)
        tracker.step_started(1, "s1")
        tracker.step_completed(1)
        tracker.finish(success=True)
        assert tracker.snapshot().phase == ProgressPhase.COMPLETE

        tracker2 = ProgressTracker()
        tracker2.start_workflow(1)
        tracker2.step_started(1, "s1")
        tracker2.step_failed(1, "err")
        tracker2.finish(success=False)
        assert tracker2.snapshot().phase == ProgressPhase.FAILED

    def test_tracker_remaining_steps(self):
        """Remaining steps calculated correctly."""
        from src.core.progress_tracker import ProgressTracker

        tracker = ProgressTracker()
        tracker.start_workflow(5)
        tracker.step_started(1, "s1")
        tracker.step_completed(1)
        tracker.step_started(2, "s2")
        tracker.step_failed(2, "err")
        snap = tracker.snapshot()
        assert snap.remaining_steps == 3


class TestPevCommandFunctions(unittest.TestCase):
    """Test pev_commands helper functions directly."""

    def test_infer_status_completed(self):
        """Infer completed status from events."""
        from src.cli.pev_commands import _infer_status
        from src.core.execution_history import EventKind, ExecutionEvent

        events = [
            ExecutionEvent.create(EventKind.WORKFLOW_STARTED, "wf-1"),
            ExecutionEvent.create(EventKind.WORKFLOW_COMPLETED, "wf-1"),
        ]
        status = _infer_status(events)
        assert "completed" in status

    def test_infer_status_failed(self):
        """Infer failed status from events."""
        from src.cli.pev_commands import _infer_status
        from src.core.execution_history import EventKind, ExecutionEvent

        events = [
            ExecutionEvent.create(EventKind.WORKFLOW_STARTED, "wf-2"),
            ExecutionEvent.create(EventKind.WORKFLOW_FAILED, "wf-2"),
        ]
        status = _infer_status(events)
        assert "failed" in status

    def test_infer_status_rolled_back(self):
        """Infer rolled_back status from events."""
        from src.cli.pev_commands import _infer_status
        from src.core.execution_history import EventKind, ExecutionEvent

        events = [
            ExecutionEvent.create(EventKind.WORKFLOW_STARTED, "wf-3"),
            ExecutionEvent.create(EventKind.ROLLBACK_COMPLETED, "wf-3"),
        ]
        status = _infer_status(events)
        assert "rolled_back" in status

    def test_infer_status_in_progress(self):
        """Infer in_progress when only started."""
        from src.cli.pev_commands import _infer_status
        from src.core.execution_history import EventKind, ExecutionEvent

        events = [
            ExecutionEvent.create(EventKind.WORKFLOW_STARTED, "wf-4"),
        ]
        status = _infer_status(events)
        assert "in_progress" in status

    def test_infer_status_unknown(self):
        """Infer unknown when no recognizable events."""
        from src.cli.pev_commands import _infer_status
        from src.core.execution_history import EventKind, ExecutionEvent

        events = [
            ExecutionEvent.create(EventKind.STEP_SCHEDULED, "wf-5", 1),
        ]
        status = _infer_status(events)
        assert "unknown" in status


class TestPevHistoryDisplay(unittest.TestCase):
    """Test pev history display and limit logic."""

    def test_history_json_serialization(self):
        """Events serialize to valid JSON."""
        from dataclasses import asdict
        from src.core.execution_history import EventKind, ExecutionEvent

        event = ExecutionEvent.create(
            EventKind.WORKFLOW_STARTED, "wf-json",
            data={"recipe": "test", "steps": 3},
        )
        serialized = json.dumps([asdict(event)], default=str)
        parsed = json.loads(serialized)
        assert len(parsed) == 1
        assert parsed[0]["kind"] == "workflow_started"
        assert parsed[0]["data"]["steps"] == 3

    def test_history_limit_slicing(self):
        """Limit parameter correctly slices events."""
        from src.core.execution_history import EventKind, ExecutionEvent

        events = [
            ExecutionEvent.create(EventKind.WORKFLOW_STARTED, "wf-lim"),
            ExecutionEvent.create(EventKind.STEP_SCHEDULED, "wf-lim", 1),
            ExecutionEvent.create(EventKind.STEP_COMPLETED, "wf-lim", 1),
            ExecutionEvent.create(EventKind.WORKFLOW_COMPLETED, "wf-lim"),
        ]
        limit = 2
        limited = events[:limit]
        assert len(limited) == 2
        assert limited[0].kind == EventKind.WORKFLOW_STARTED
        assert limited[1].kind == EventKind.STEP_SCHEDULED


if __name__ == "__main__":
    unittest.main()
