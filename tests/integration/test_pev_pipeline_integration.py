"""Integration tests for PEV pipeline: PipelineManager + CircuitBreaker + PipelineCheckpoint."""

from __future__ import annotations

import json
import time

import pytest

from src.core.circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    reset_all_breakers,
)
from src.core.pipeline_checkpoint import PipelineCheckpoint, list_incomplete_pipelines
from src.core.pipeline_manager import PipelineManager, PipelineStatus


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def clean_breakers():
    """Reset circuit breaker registry before each test."""
    reset_all_breakers()
    yield
    reset_all_breakers()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_executor(results: list):
    """Return an executor_fn that pops results left-to-right; raises if result is Exception."""
    idx = {"i": 0}

    def executor(goal: str):
        val = results[idx["i"]]
        idx["i"] += 1
        if isinstance(val, Exception):
            raise val
        return val

    return executor


# ---------------------------------------------------------------------------
# Pipeline + Circuit Breaker Integration
# ---------------------------------------------------------------------------


class TestPipelineCircuitBreakerIntegration:
    def test_pipeline_with_circuit_breaker_protection(self):
        """All stages succeed; circuit stays CLOSED."""
        breaker = CircuitBreaker("svc", failure_threshold=3, recovery_timeout=30.0)
        pm = PipelineManager(stop_on_failure=False)
        pid = pm.create_pipeline(["goal-1", "goal-2", "goal-3"])

        def executor(goal: str):
            return breaker.call(lambda: f"ok:{goal}")

        result = pm.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.COMPLETED
        assert result.completed_stages == 3
        assert result.failed_stages == 0
        assert breaker.state == CircuitState.CLOSED

    def test_pipeline_circuit_breaker_opens_on_failures(self):
        """Stage fails threshold times → circuit opens → later calls get CircuitOpenError."""
        breaker = CircuitBreaker("svc", failure_threshold=2, recovery_timeout=60.0)
        pm = PipelineManager(stop_on_failure=False)
        pid = pm.create_pipeline(["g1", "g2", "g3", "g4"])

        call_count = {"n": 0}

        def executor(goal: str):
            call_count["n"] += 1
            # First two calls fail; third+ call goes through breaker normally
            if call_count["n"] <= 2:
                return breaker.call(lambda: (_ for _ in ()).throw(RuntimeError("boom")))
            return breaker.call(lambda: "ok")

        result = pm.execute_pipeline(pid, executor)
        # Circuit opened after 2 failures; third call to breaker.call raises CircuitOpenError
        assert result.failed_stages >= 2
        assert breaker.state in (CircuitState.OPEN, CircuitState.HALF_OPEN)

    def test_pipeline_circuit_breaker_fallback(self):
        """Circuit open but fallback provided → pipeline gets degraded result, not error."""
        breaker = CircuitBreaker("svc", failure_threshold=1, recovery_timeout=60.0)
        # Trip the circuit manually
        try:
            breaker.call(lambda: (_ for _ in ()).throw(RuntimeError("trip")))
        except RuntimeError:
            pass
        assert breaker.state == CircuitState.OPEN

        pm = PipelineManager(stop_on_failure=False)
        pid = pm.create_pipeline(["g1", "g2"])

        def executor(goal: str):
            return breaker.call(lambda: "live", fallback=lambda: "degraded")

        result = pm.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.COMPLETED
        assert result.completed_stages == 2
        # Both stages got fallback value
        for stage in result.stages:
            assert stage.result == "degraded"

    def test_pipeline_circuit_breaker_recovery(self, monkeypatch):
        """Circuit opens, recovery timeout elapses, half-open probe succeeds → closed."""
        breaker = CircuitBreaker("svc", failure_threshold=1, recovery_timeout=0.01)
        # Trip
        try:
            breaker.call(lambda: (_ for _ in ()).throw(RuntimeError("trip")))
        except RuntimeError:
            pass
        assert breaker.state == CircuitState.OPEN

        time.sleep(0.02)  # exceed recovery_timeout
        assert breaker.state == CircuitState.HALF_OPEN

        # Successful probe
        result = breaker.call(lambda: "probe_ok")
        assert result == "probe_ok"
        assert breaker.state == CircuitState.CLOSED


# ---------------------------------------------------------------------------
# Pipeline + Checkpoint Resume
# ---------------------------------------------------------------------------


class TestPipelineCheckpointResume:
    def test_pipeline_checkpoint_save_and_resume(self, tmp_path):
        """Save progress through stage 1, then resume from index 1."""
        cp = PipelineCheckpoint("pipe-1", total_stages=3, checkpoint_dir=tmp_path)
        cp.save_stage(0, result="r0")

        resume_cp = PipelineCheckpoint("pipe-1", checkpoint_dir=tmp_path)
        assert resume_cp.get_resume_index() == 1

    def test_pipeline_checkpoint_skip_completed_stages(self, tmp_path):
        """Completed stages are recognised as completed after reload."""
        cp = PipelineCheckpoint("pipe-2", total_stages=4, checkpoint_dir=tmp_path)
        cp.save_stage(0, result="r0")
        cp.save_stage(1, result="r1")

        cp2 = PipelineCheckpoint("pipe-2", checkpoint_dir=tmp_path)
        assert cp2.is_stage_completed(0)
        assert cp2.is_stage_completed(1)
        assert not cp2.is_stage_completed(2)
        assert cp2.get_resume_index() == 2

    def test_pipeline_checkpoint_persistence(self, tmp_path):
        """Checkpoint JSON files exist on disk and round-trip correctly."""
        cp = PipelineCheckpoint("pipe-3", total_stages=2, checkpoint_dir=tmp_path)
        sc = cp.save_stage(0, result={"key": "val"})
        assert sc.status == "completed"

        stage_file = tmp_path / "pipe-3" / "stage_0.json"
        assert stage_file.exists()
        data = json.loads(stage_file.read_text())
        assert data["stage_index"] == 0
        assert data["result"] == {"key": "val"}

    def test_pipeline_checkpoint_clear(self, tmp_path):
        """Clear removes all checkpoint files."""
        cp = PipelineCheckpoint("pipe-4", total_stages=2, checkpoint_dir=tmp_path)
        cp.save_stage(0, result="r0")
        cp.save_stage(1, result="r1")
        assert (tmp_path / "pipe-4").exists()

        cp.clear()
        assert not (tmp_path / "pipe-4").exists()


# ---------------------------------------------------------------------------
# Full Integration: Pipeline + Circuit Breaker + Checkpoint
# ---------------------------------------------------------------------------


class TestFullPipelineIntegration:
    def test_full_pipeline_with_breaker_and_checkpoint(self, tmp_path):
        """Stage fails, checkpoint saved, resume with reset breaker succeeds."""
        breaker = CircuitBreaker("svc", failure_threshold=3, recovery_timeout=60.0)
        cp = PipelineCheckpoint("full-1", total_stages=3, checkpoint_dir=tmp_path)

        # Simulate partial run: stage 0 completed, stage 1 failed
        cp.save_stage(0, result="ok0")
        cp.save_stage(1, error="oops")

        resume_idx = cp.get_resume_index()
        assert resume_idx == 1  # stage 1 was failed, not completed

        # Resume pipeline from scratch but skip already-completed stages
        pm = PipelineManager(stop_on_failure=False)
        goals = ["g0", "g1", "g2"]
        pid = pm.create_pipeline(goals)

        executed = []

        def executor(goal: str):
            stage_idx = goals.index(goal)
            if cp.is_stage_completed(stage_idx):
                return "cached"
            result = breaker.call(lambda: f"done:{goal}")
            cp.save_stage(stage_idx, result=result)
            executed.append(stage_idx)
            return result

        result = pm.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.COMPLETED
        # Stage 0 was skipped (cached), stages 1 and 2 ran
        assert 0 not in executed
        assert 1 in executed
        assert 2 in executed

    def test_pipeline_stop_on_failure_with_checkpoint(self, tmp_path):
        """stop_on_failure=True: pipeline stops, checkpoint reflects partial progress."""
        cp = PipelineCheckpoint("stop-1", total_stages=3, checkpoint_dir=tmp_path)
        pm = PipelineManager(stop_on_failure=True)
        pid = pm.create_pipeline(["g0", "g1", "g2"])

        call_count = {"n": 0}

        def executor(goal: str):
            call_count["n"] += 1
            idx = call_count["n"] - 1
            if idx == 1:
                cp.save_stage(idx, error="fail")
                raise RuntimeError("fail")
            cp.save_stage(idx, result=f"ok{idx}")
            return f"ok{idx}"

        result = pm.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.PARTIAL
        assert result.failed_stages == 1
        # Remaining stage was skipped by manager
        skipped = [s for s in result.stages if s.status == "skipped"]
        assert len(skipped) == 1
        # Checkpoint shows 1 completed, 1 failed
        assert cp.is_stage_completed(0)
        assert not cp.is_stage_completed(1)

    def test_pipeline_continue_on_failure_with_checkpoint(self, tmp_path):
        """stop_on_failure=False: all stages execute, checkpoint reflects all."""
        cp = PipelineCheckpoint("cont-1", total_stages=3, checkpoint_dir=tmp_path)
        pm = PipelineManager(stop_on_failure=False)
        pid = pm.create_pipeline(["g0", "g1", "g2"])

        call_count = {"n": 0}

        def executor(goal: str):
            idx = call_count["n"]
            call_count["n"] += 1
            if idx == 1:
                cp.save_stage(idx, error="mid-fail")
                raise RuntimeError("mid-fail")
            cp.save_stage(idx, result=f"ok{idx}")
            return f"ok{idx}"

        result = pm.execute_pipeline(pid, executor)
        assert result.status == PipelineStatus.PARTIAL
        assert result.completed_stages == 2
        assert result.failed_stages == 1
        assert cp.is_stage_completed(0)
        assert not cp.is_stage_completed(1)
        assert cp.is_stage_completed(2)


# ---------------------------------------------------------------------------
# Edge Cases
# ---------------------------------------------------------------------------


class TestEdgeCases:
    def test_pipeline_empty_goals(self):
        """Empty goals list produces completed pipeline with 0 stages."""
        pm = PipelineManager()
        pid = pm.create_pipeline([])
        result = pm.execute_pipeline(pid, lambda g: g)
        assert result.total_stages == 0
        assert result.completed_stages == 0
        # success_rate undefined for 0 stages
        assert result.success_rate == 0.0

    def test_pipeline_with_dependencies(self):
        """Stage with unmet dependency is skipped."""
        pm = PipelineManager(stop_on_failure=False)
        # stage-2 depends on stage-1; stage-1 will fail
        pid = pm.create_pipeline(
            ["g1", "g2"],
            dependencies={"stage-2": ["stage-1"]},
        )

        def executor(goal: str):
            if goal == "g1":
                raise RuntimeError("g1 failed")
            return "ok"

        result = pm.execute_pipeline(pid, executor)
        stages = {s.goal: s for s in result.stages}
        assert stages["g1"].status == "failed"
        assert stages["g2"].status == "skipped"

    def test_circuit_breaker_excluded_exceptions(self):
        """Excluded exceptions don't count as failures; circuit stays CLOSED."""
        breaker = CircuitBreaker(
            "svc",
            failure_threshold=2,
            recovery_timeout=30.0,
            excluded_exceptions=(ValueError,),
        )

        for _ in range(5):
            with pytest.raises(ValueError):
                breaker.call(lambda: (_ for _ in ()).throw(ValueError("excluded")))

        assert breaker.state == CircuitState.CLOSED
        assert breaker.stats.consecutive_failures == 0

    def test_checkpoint_corrupt_file_recovery(self, tmp_path):
        """Corrupt stage JSON is skipped gracefully; other stages load fine."""
        pipe_dir = tmp_path / "corrupt-1"
        pipe_dir.mkdir()

        # Write valid checkpoint metadata
        meta = {
            "pipeline_id": "corrupt-1",
            "total_stages": 2,
            "created_at": time.time(),
            "updated_at": time.time(),
            "completed_stages": 1,
            "failed_stages": 0,
            "status": "in_progress",
        }
        (pipe_dir / "checkpoint.json").write_text(json.dumps(meta))

        # Write valid stage_0
        stage0 = {
            "stage_index": 0,
            "status": "completed",
            "result": "ok",
            "error": None,
            "started_at": time.time(),
            "completed_at": time.time(),
            "attempt_count": 1,
        }
        (pipe_dir / "stage_0.json").write_text(json.dumps(stage0))

        # Write corrupt stage_1
        (pipe_dir / "stage_1.json").write_text("{bad json :::}")

        cp = PipelineCheckpoint("corrupt-1", checkpoint_dir=tmp_path)
        # Valid stage loaded; corrupt stage skipped
        assert cp.is_stage_completed(0)
        assert not cp.is_stage_completed(1)

    def test_list_incomplete_pipelines(self, tmp_path):
        """list_incomplete_pipelines returns only in_progress pipeline IDs."""
        for pid, status in [("p-done", "completed"), ("p-wip", "in_progress")]:
            d = tmp_path / pid
            d.mkdir()
            meta = {
                "pipeline_id": pid,
                "total_stages": 1,
                "created_at": time.time(),
                "updated_at": time.time(),
                "completed_stages": 0,
                "failed_stages": 0,
                "status": status,
            }
            (d / "checkpoint.json").write_text(json.dumps(meta))

        incomplete = list_incomplete_pipelines(tmp_path)
        assert "p-wip" in incomplete
        assert "p-done" not in incomplete
