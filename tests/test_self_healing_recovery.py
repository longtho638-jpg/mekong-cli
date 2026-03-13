"""Tests for Phase 6: Self-Healing and Error Recovery.

Tests CircuitBreaker, PipelineCheckpoint, and StageRetryExecutor.
"""

from __future__ import annotations

import os
import sys
import time
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ============================================================================
# Circuit Breaker Tests
# ============================================================================

class TestCircuitBreaker(unittest.TestCase):
    """Tests for CircuitBreaker pattern."""

    def test_closed_state_allows_calls(self):
        """CLOSED state passes calls through normally."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker("test-svc", failure_threshold=3)
        result = cb.call(lambda: "ok")
        assert result == "ok"
        assert cb.state == CircuitState.CLOSED

    def test_opens_after_threshold_failures(self):
        """Circuit opens after consecutive failures reach threshold."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker("test-svc", failure_threshold=2, recovery_timeout=60.0)

        for _ in range(2):
            with self.assertRaises(ValueError):
                cb.call(lambda: (_ for _ in ()).throw(ValueError("fail")))

        assert cb.state == CircuitState.OPEN

    def test_open_rejects_calls(self):
        """OPEN state rejects calls with CircuitOpenError."""
        from src.core.circuit_breaker import (
            CircuitBreaker,
            CircuitOpenError,
            CircuitState,
        )

        cb = CircuitBreaker("test-svc", failure_threshold=1, recovery_timeout=60.0)

        with self.assertRaises(ValueError):
            cb.call(lambda: (_ for _ in ()).throw(ValueError("fail")))

        assert cb.state == CircuitState.OPEN

        with self.assertRaises(CircuitOpenError):
            cb.call(lambda: "should not execute")

    def test_open_uses_fallback(self):
        """OPEN state calls fallback when provided."""
        from src.core.circuit_breaker import CircuitBreaker

        cb = CircuitBreaker("test-svc", failure_threshold=1, recovery_timeout=60.0)

        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("fail")))

        result = cb.call(lambda: "primary", fallback=lambda: "fallback")
        assert result == "fallback"

    def test_half_open_after_timeout(self):
        """Circuit transitions to HALF_OPEN after recovery timeout."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker("test-svc", failure_threshold=1, recovery_timeout=0.1)

        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("fail")))

        assert cb.state == CircuitState.OPEN
        time.sleep(0.15)
        assert cb.state == CircuitState.HALF_OPEN

    def test_half_open_closes_on_success(self):
        """Successful probe in HALF_OPEN closes the circuit."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker("test-svc", failure_threshold=1, recovery_timeout=0.1)

        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("fail")))

        time.sleep(0.15)
        assert cb.state == CircuitState.HALF_OPEN

        result = cb.call(lambda: "recovered")
        assert result == "recovered"
        assert cb.state == CircuitState.CLOSED

    def test_half_open_reopens_on_failure(self):
        """Failed probe in HALF_OPEN reopens the circuit."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker("test-svc", failure_threshold=1, recovery_timeout=0.1)

        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("fail")))

        time.sleep(0.15)
        assert cb.state == CircuitState.HALF_OPEN

        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("still failing")))

        assert cb.state == CircuitState.OPEN

    def test_stats_tracking(self):
        """Stats accurately track calls, successes, and failures."""
        from src.core.circuit_breaker import CircuitBreaker

        cb = CircuitBreaker("test-svc", failure_threshold=5)

        cb.call(lambda: "ok")
        cb.call(lambda: "ok")

        try:
            cb.call(lambda: (_ for _ in ()).throw(ValueError("err")))
        except ValueError:
            pass

        stats = cb.stats
        assert stats.total_calls == 3
        assert stats.successful_calls == 2
        assert stats.failed_calls == 1
        assert stats.consecutive_failures == 1

    def test_excluded_exceptions_dont_trip(self):
        """Excluded exceptions don't count as failures."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker(
            "test-svc",
            failure_threshold=1,
            excluded_exceptions=(KeyError,),
        )

        with self.assertRaises(KeyError):
            cb.call(lambda: (_ for _ in ()).throw(KeyError("excluded")))

        # Should still be closed — KeyError is excluded
        assert cb.state == CircuitState.CLOSED
        assert cb.stats.successful_calls == 1

    def test_reset(self):
        """Manual reset returns circuit to CLOSED."""
        from src.core.circuit_breaker import CircuitBreaker, CircuitState

        cb = CircuitBreaker("test-svc", failure_threshold=1, recovery_timeout=60.0)

        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("fail")))

        assert cb.state == CircuitState.OPEN
        cb.reset()
        assert cb.state == CircuitState.CLOSED

    def test_registry_get_or_create(self):
        """Registry returns same breaker for same name."""
        from src.core.circuit_breaker import get_circuit_breaker, reset_all_breakers

        reset_all_breakers()
        b1 = get_circuit_breaker("api-svc")
        b2 = get_circuit_breaker("api-svc")
        assert b1 is b2
        reset_all_breakers()


# ============================================================================
# Pipeline Checkpoint Tests
# ============================================================================

class TestPipelineCheckpoint(unittest.TestCase):
    """Tests for PipelineCheckpoint persistence."""

    def setUp(self):
        """Create temp checkpoint directory."""
        import tempfile
        self._tmpdir = tempfile.mkdtemp()
        self._cp_dir = os.path.join(self._tmpdir, "checkpoints")

    def tearDown(self):
        """Clean up temp directory."""
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)

    def _make_checkpoint(self, pid="test-pipe", total=3):
        from pathlib import Path
        from src.core.pipeline_checkpoint import PipelineCheckpoint
        return PipelineCheckpoint(pid, total, checkpoint_dir=Path(self._cp_dir))

    def test_save_and_load_stage(self):
        """Save a stage and verify it persists."""
        cp = self._make_checkpoint()
        cp.save_stage(0, result={"output": "hello"})

        # Create new instance to verify persistence
        cp2 = self._make_checkpoint()
        assert cp2.is_stage_completed(0)
        stage = cp2.get_stage(0)
        assert stage is not None
        assert stage.result == {"output": "hello"}

    def test_resume_index(self):
        """Resume index skips completed stages."""
        cp = self._make_checkpoint(total=5)
        cp.save_stage(0, result="ok")
        cp.save_stage(1, result="ok")
        assert cp.get_resume_index() == 2

    def test_resume_index_with_gap(self):
        """Resume index returns first non-completed."""
        cp = self._make_checkpoint(total=5)
        cp.save_stage(0, result="ok")
        # Stage 1 skipped/failed
        cp.save_stage(2, result="ok")
        assert cp.get_resume_index() == 1

    def test_failed_stage_not_completed(self):
        """Failed stage is not counted as completed."""
        cp = self._make_checkpoint()
        cp.save_stage(0, error="something broke")
        assert not cp.is_stage_completed(0)
        assert cp.get_resume_index() == 0

    def test_metadata_updates(self):
        """Metadata counts update on save."""
        cp = self._make_checkpoint(total=3)
        cp.save_stage(0, result="ok")
        cp.save_stage(1, error="fail")
        assert cp.metadata is not None
        assert cp.metadata.completed_stages == 1
        assert cp.metadata.failed_stages == 1

    def test_mark_completed(self):
        """Mark pipeline as completed."""
        cp = self._make_checkpoint()
        cp.save_stage(0, result="ok")
        cp.mark_completed()

        cp2 = self._make_checkpoint()
        assert cp2.metadata is not None
        assert cp2.metadata.status == "completed"

    def test_clear_removes_files(self):
        """Clear removes all checkpoint files."""
        cp = self._make_checkpoint()
        cp.save_stage(0, result="ok")
        assert cp.has_checkpoint
        cp.clear()
        assert not cp.has_checkpoint

    def test_has_checkpoint(self):
        """has_checkpoint reflects saved state."""
        cp = self._make_checkpoint()
        assert not cp.has_checkpoint
        cp.save_stage(0, result="ok")
        assert cp.has_checkpoint

    def test_list_incomplete(self):
        """List incomplete pipelines."""
        from pathlib import Path
        from src.core.pipeline_checkpoint import list_incomplete_pipelines

        cp1 = self._make_checkpoint("pipe-1", total=2)
        cp1.save_stage(0, result="ok")

        cp2 = self._make_checkpoint("pipe-2", total=2)
        cp2.save_stage(0, result="ok")
        cp2.mark_completed()

        incomplete = list_incomplete_pipelines(Path(self._cp_dir))
        assert "pipe-1" in incomplete
        assert "pipe-2" not in incomplete


# ============================================================================
# Stage Retry Tests
# ============================================================================

class TestStageRetryExecutor(unittest.TestCase):
    """Tests for StageRetryExecutor with exponential backoff."""

    def test_success_on_first_attempt(self):
        """Successful stage needs only one attempt."""
        from src.core.stage_retry import StageRetryExecutor

        executor = StageRetryExecutor()
        result = executor.execute_stage(lambda: 42, stage_name="compute")
        assert result.success
        assert result.result == 42
        assert result.total_attempts == 1
        assert len(result.attempts) == 1

    def test_success_after_retries(self):
        """Stage succeeds after transient failures."""
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        call_count = 0

        def flaky():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ConnectionError("transient")
            return "recovered"

        policy = RetryPolicy(
            max_attempts=5,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
        )
        executor = StageRetryExecutor(policy=policy)
        result = executor.execute_stage(flaky, stage_name="flaky-svc")

        assert result.success
        assert result.result == "recovered"
        assert result.total_attempts == 3
        assert len(result.attempts) == 3

    def test_exhausts_all_attempts(self):
        """Stage fails after all retry attempts exhausted."""
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        policy = RetryPolicy(
            max_attempts=3,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
        )
        executor = StageRetryExecutor(policy=policy)
        result = executor.execute_stage(
            lambda: (_ for _ in ()).throw(RuntimeError("always fails")),
            stage_name="broken",
        )

        assert not result.success
        assert result.total_attempts == 3
        assert result.final_error is not None
        assert "always fails" in result.final_error

    def test_non_retryable_error_stops_immediately(self):
        """Non-retryable errors stop without further retries."""
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        policy = RetryPolicy(
            max_attempts=5,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
            non_retryable_errors=["authentication"],
        )
        executor = StageRetryExecutor(policy=policy)
        result = executor.execute_stage(
            lambda: (_ for _ in ()).throw(RuntimeError("authentication failed")),
            stage_name="auth-call",
        )

        assert not result.success
        assert result.total_attempts == 1

    def test_on_retry_callback(self):
        """on_retry callback is called before each retry."""
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        retries = []
        call_count = 0

        def flaky():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise RuntimeError("transient")
            return "ok"

        policy = RetryPolicy(
            max_attempts=5,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
        )
        executor = StageRetryExecutor(
            policy=policy,
            on_retry=lambda idx, attempt, delay, err: retries.append((idx, attempt)),
        )
        result = executor.execute_stage(flaky, stage_index=7, stage_name="callback-test")

        assert result.success
        assert len(retries) == 2
        assert retries[0] == (7, 1)
        assert retries[1] == (7, 2)

    def test_circuit_breaker_integration(self):
        """Stage retry respects circuit breaker state."""
        from src.core.circuit_breaker import CircuitBreaker
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        cb = CircuitBreaker("test-retry-svc", failure_threshold=1, recovery_timeout=60.0)

        # Trip the circuit
        with self.assertRaises(RuntimeError):
            cb.call(lambda: (_ for _ in ()).throw(RuntimeError("trip")))

        policy = RetryPolicy(
            max_attempts=3,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
        )
        executor = StageRetryExecutor(policy=policy, circuit_breaker=cb)
        result = executor.execute_stage(lambda: "should not run", stage_name="blocked")

        assert not result.success
        assert "Circuit open" in (result.final_error or "")
        assert result.total_attempts == 1

    def test_total_duration_tracked(self):
        """Total duration is tracked across all attempts."""
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        policy = RetryPolicy(
            max_attempts=2,
            initial_interval_seconds=0.05,
            strategy=BackoffStrategy.FIXED,
        )
        executor = StageRetryExecutor(policy=policy)
        result = executor.execute_stage(
            lambda: (_ for _ in ()).throw(RuntimeError("fail")),
            stage_name="timed",
        )

        assert result.total_duration_ms > 40  # At least one 50ms sleep


# ============================================================================
# Integration: Retry + Checkpoint
# ============================================================================

class TestRetryWithCheckpoint(unittest.TestCase):
    """Integration tests for retry + checkpoint workflow."""

    def setUp(self):
        import tempfile
        self._tmpdir = tempfile.mkdtemp()

    def tearDown(self):
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)

    def test_checkpoint_saves_after_retry_success(self):
        """Successful retry saves checkpoint for resume."""
        from pathlib import Path
        from src.core.pipeline_checkpoint import PipelineCheckpoint
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        cp = PipelineCheckpoint(
            "retry-pipe", total_stages=3,
            checkpoint_dir=Path(self._tmpdir) / "cp",
        )
        policy = RetryPolicy(
            max_attempts=3,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
        )
        executor = StageRetryExecutor(policy=policy)

        call_count = 0

        def flaky_stage():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise RuntimeError("transient")
            return {"data": "processed"}

        # Execute stage with retry
        result = executor.execute_stage(flaky_stage, stage_index=0, stage_name="flaky")

        # Save to checkpoint
        if result.success:
            cp.save_stage(0, result=result.result, attempt_count=result.total_attempts)
        else:
            cp.save_stage(0, error=result.final_error, attempt_count=result.total_attempts)

        assert cp.is_stage_completed(0)
        stage = cp.get_stage(0)
        assert stage is not None
        assert stage.attempt_count == 2
        assert cp.get_resume_index() == 1

    def test_full_pipeline_with_checkpoint_resume(self):
        """Simulate pipeline interruption and resume."""
        from pathlib import Path
        from src.core.pipeline_checkpoint import PipelineCheckpoint
        from src.core.retry_policy import RetryPolicy, BackoffStrategy
        from src.core.stage_retry import StageRetryExecutor

        cp_dir = Path(self._tmpdir) / "cp"
        policy = RetryPolicy(
            max_attempts=2,
            initial_interval_seconds=0.01,
            strategy=BackoffStrategy.FIXED,
        )

        stages = ["setup", "build", "deploy"]

        # First run: complete stage 0 and 1, then "crash"
        cp = PipelineCheckpoint("resume-pipe", len(stages), cp_dir)
        executor = StageRetryExecutor(policy=policy)

        for i in range(2):  # Only complete first 2
            result = executor.execute_stage(lambda: "ok", stage_index=i, stage_name=stages[i])
            cp.save_stage(i, result=result.result)

        # Simulate crash + resume
        cp2 = PipelineCheckpoint("resume-pipe", len(stages), cp_dir)
        resume_from = cp2.get_resume_index()
        assert resume_from == 2  # Should resume from stage 2

        # Complete remaining stages
        for i in range(resume_from, len(stages)):
            result = executor.execute_stage(lambda: "ok", stage_index=i, stage_name=stages[i])
            cp2.save_stage(i, result=result.result)

        cp2.mark_completed()
        assert cp2.metadata.status == "completed"
        assert cp2.metadata.completed_stages == 3


# ============================================================================
# Convenience function test
# ============================================================================

class TestConvenienceFunction(unittest.TestCase):
    """Test module-level convenience functions."""

    def test_execute_stage_with_retry(self):
        """Convenience function works for simple cases."""
        from src.core.stage_retry import execute_stage_with_retry

        result = execute_stage_with_retry(
            lambda: "quick",
            stage_name="simple",
        )
        assert result.success
        assert result.result == "quick"


if __name__ == "__main__":
    unittest.main()
