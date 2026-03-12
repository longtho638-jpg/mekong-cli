"""Tests for progress_tracker module.

Covers ProgressTracker lifecycle, callbacks, ETA estimation,
and ProgressSnapshot data integrity.
"""

from __future__ import annotations

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.progress_tracker import (
    ProgressPhase,
    ProgressSnapshot,
    ProgressTracker,
    StepProgress,
)


class TestStepProgress:
    def test_duration_zero_when_not_started(self):
        sp = StepProgress(step_order=1, title="test")
        assert sp.duration_ms == 0.0

    def test_duration_when_running(self):
        sp = StepProgress(step_order=1, title="test", start_time=time.time() - 1.0)
        assert sp.duration_ms >= 900  # ~1000ms with tolerance

    def test_duration_when_completed(self):
        start = time.time() - 2.0
        end = time.time() - 1.0
        sp = StepProgress(step_order=1, title="test", start_time=start, end_time=end)
        assert 900 < sp.duration_ms < 1200


class TestProgressTrackerLifecycle:
    def test_initial_state(self):
        t = ProgressTracker()
        snap = t.snapshot()
        assert snap.phase == ProgressPhase.PLANNING
        assert snap.total_steps == 0
        assert snap.percentage == 0.0

    def test_start_workflow(self):
        t = ProgressTracker()
        t.start_workflow(5)
        snap = t.snapshot()
        assert snap.total_steps == 5
        assert snap.completed_steps == 0
        assert snap.percentage == 0.0

    def test_step_started(self):
        t = ProgressTracker()
        t.start_workflow(3)
        t.step_started(1, "Build project")
        snap = t.snapshot()
        assert snap.current_step == 1
        assert snap.phase == ProgressPhase.EXECUTING
        assert len(snap.steps) == 1
        assert snap.steps[0].status == "running"

    def test_step_completed(self):
        t = ProgressTracker()
        t.start_workflow(3)
        t.step_started(1, "Build")
        t.step_completed(1)
        snap = t.snapshot()
        assert snap.completed_steps == 1
        assert snap.current_step is None
        assert snap.percentage > 30  # 1/3 = 33%

    def test_step_failed(self):
        t = ProgressTracker()
        t.start_workflow(2)
        t.step_started(1, "Deploy")
        t.step_failed(1, "timeout")
        snap = t.snapshot()
        assert snap.failed_steps == 1
        assert snap.steps[0].status == "failed"
        assert snap.steps[0].error == "timeout"

    def test_step_skipped(self):
        t = ProgressTracker()
        t.start_workflow(2)
        t.step_skipped(1, "Optional step")
        snap = t.snapshot()
        assert len(snap.steps) == 1
        assert snap.steps[0].status == "skipped"

    def test_finish_success(self):
        t = ProgressTracker()
        t.start_workflow(1)
        t.step_started(1, "Test")
        t.step_completed(1)
        t.finish(success=True)
        snap = t.snapshot()
        assert snap.phase == ProgressPhase.COMPLETE

    def test_finish_failure(self):
        t = ProgressTracker()
        t.start_workflow(1)
        t.step_started(1, "Test")
        t.step_failed(1)
        t.finish(success=False)
        snap = t.snapshot()
        assert snap.phase == ProgressPhase.FAILED

    def test_full_workflow(self):
        t = ProgressTracker()
        t.start_workflow(3)
        for i in range(1, 4):
            t.step_started(i, f"Step {i}")
            t.step_completed(i)
        t.finish(success=True)
        snap = t.snapshot()
        assert snap.completed_steps == 3
        assert snap.percentage == 100.0
        assert snap.phase == ProgressPhase.COMPLETE


class TestProgressTrackerPercentage:
    def test_zero_total(self):
        t = ProgressTracker()
        t.start_workflow(0)
        assert t.snapshot().percentage == 0.0

    def test_partial_completion(self):
        t = ProgressTracker()
        t.start_workflow(4)
        t.step_started(1, "A")
        t.step_completed(1)
        t.step_started(2, "B")
        t.step_failed(2)
        snap = t.snapshot()
        assert abs(snap.percentage - 50.0) < 0.01  # 2/4 done


class TestProgressTrackerETA:
    def test_eta_none_when_no_steps_done(self):
        t = ProgressTracker()
        t.start_workflow(5)
        snap = t.snapshot()
        assert snap.eta_ms is None

    def test_eta_estimated_after_step(self):
        t = ProgressTracker()
        t.start_workflow(3)
        t.step_started(1, "A")
        time.sleep(0.05)  # 50ms
        t.step_completed(1)
        snap = t.snapshot()
        assert snap.eta_ms is not None
        assert snap.eta_ms > 0  # Should estimate ~100ms for 2 remaining


class TestProgressTrackerCallbacks:
    def test_callback_called_on_start(self):
        events = []
        t = ProgressTracker()
        t.register_callback(lambda snap: events.append(snap.phase))
        t.start_workflow(1)
        assert ProgressPhase.PLANNING in events

    def test_callback_called_on_step_events(self):
        events = []
        t = ProgressTracker()
        t.register_callback(lambda snap: events.append(snap.completed_steps))
        t.start_workflow(2)
        t.step_started(1, "X")
        t.step_completed(1)
        # start_workflow(0), step_started(0), step_completed(1)
        assert 1 in events

    def test_callback_exception_does_not_crash(self):
        def bad_cb(snap):
            raise RuntimeError("bad callback")

        t = ProgressTracker()
        t.register_callback(bad_cb)
        # Should not raise
        t.start_workflow(1)
        t.step_started(1, "Test")
        t.step_completed(1)

    def test_multiple_callbacks(self):
        calls_a = []
        calls_b = []
        t = ProgressTracker()
        t.register_callback(lambda snap: calls_a.append(1))
        t.register_callback(lambda snap: calls_b.append(1))
        t.start_workflow(1)
        assert len(calls_a) == 1
        assert len(calls_b) == 1


class TestProgressSnapshot:
    def test_remaining_steps(self):
        snap = ProgressSnapshot(
            phase=ProgressPhase.EXECUTING,
            total_steps=5,
            completed_steps=2,
            failed_steps=1,
            current_step=4,
            percentage=60.0,
            elapsed_ms=1000,
            eta_ms=500,
        )
        assert snap.remaining_steps == 2

    def test_remaining_steps_all_done(self):
        snap = ProgressSnapshot(
            phase=ProgressPhase.COMPLETE,
            total_steps=3,
            completed_steps=3,
            failed_steps=0,
            current_step=None,
            percentage=100.0,
            elapsed_ms=2000,
            eta_ms=None,
        )
        assert snap.remaining_steps == 0
