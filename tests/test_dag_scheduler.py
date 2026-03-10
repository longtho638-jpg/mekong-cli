"""Tests for DAG Scheduler module.

Tests verify dependency-aware parallel execution:
1. DAGStepResult dataclass
2. DAGScheduler initialization and state management
3. get_ready_steps() - dependency resolution
4. mark_completed(), mark_failed() - state transitions
5. _cancel_downstream() - transitive cancellation
6. is_done() - completion detection
7. has_dependencies() - DAG detection
8. execute_all() - parallel execution with ThreadPoolExecutor
9. validate_dag() - circular dependency detection

NOTE: Dependencies reference ORDER values, not array indices!
If step A has order=10 and step B depends on A, then B.dependencies=[10].
"""

from __future__ import annotations

import unittest
from dataclasses import dataclass
from typing import Any
from unittest.mock import MagicMock

from src.core.dag_scheduler import DAGScheduler, DAGStepResult, validate_dag


@dataclass
class MockStep:
    """Mock recipe step for testing."""
    order: int
    title: str = ""
    description: str = ""
    dependencies: list[int] | None = None
    params: dict[str, Any] | None = None


class TestDAGStepResult(unittest.TestCase):
    """Test DAGStepResult dataclass."""

    def test_default_values(self):
        """DAGStepResult should have sensible defaults."""
        result = DAGStepResult(order=1, success=True)
        self.assertEqual(result.order, 1)
        self.assertTrue(result.success)
        self.assertIsNone(result.result)
        self.assertIsNone(result.error)

    def test_with_result(self):
        """DAGStepResult should store execution result."""
        exec_result = {"exit_code": 0, "stdout": "ok"}
        result = DAGStepResult(order=2, success=True, result=exec_result)
        self.assertEqual(result.result, exec_result)

    def test_with_error(self):
        """DAGStepResult should store error message."""
        result = DAGStepResult(order=3, success=False, error="Step failed")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "Step failed")


class TestDAGSchedulerInit(unittest.TestCase):
    """Test DAGScheduler initialization."""

    def test_init_with_steps(self):
        """DAGScheduler should initialize with steps."""
        steps = [MockStep(order=1), MockStep(order=2)]
        scheduler = DAGScheduler(steps)
        self.assertEqual(len(scheduler._steps), 2)
        self.assertEqual(scheduler._max_workers, 4)

    def test_init_with_custom_workers(self):
        """DAGScheduler should accept custom max_workers."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps, max_workers=8)
        self.assertEqual(scheduler._max_workers, 8)

    def test_init_empty_steps(self):
        """DAGScheduler should handle empty steps."""
        scheduler = DAGScheduler([])
        self.assertEqual(len(scheduler._steps), 0)

    def test_init_state_sets(self):
        """DAGScheduler should initialize empty state sets."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps)
        self.assertEqual(scheduler._completed, set())
        self.assertEqual(scheduler._failed, set())
        self.assertEqual(scheduler._cancelled, set())


class TestGetReadySteps(unittest.TestCase):
    """Test get_ready_steps() method."""

    def test_no_dependencies_all_ready(self):
        """Steps without dependencies should all be ready."""
        steps = [MockStep(order=1), MockStep(order=2), MockStep(order=3)]
        scheduler = DAGScheduler(steps)
        ready = scheduler.get_ready_steps()
        self.assertEqual(len(ready), 3)

    def test_with_dependencies(self):
        """Steps with satisfied dependencies should be ready."""
        # Dependencies reference ORDER values, not indices
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
            MockStep(order=30, dependencies=[10, 20]),
        ]
        scheduler = DAGScheduler(steps)
        ready = scheduler.get_ready_steps()
        self.assertEqual(len(ready), 1)
        self.assertEqual(ready[0].order, 10)

    def test_after_mark_completed(self):
        """Marking step completed should unlock dependents."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler.mark_completed(10)
        ready = scheduler.get_ready_steps()
        self.assertEqual(len(ready), 1)
        self.assertEqual(ready[0].order, 20)

    def test_completed_steps_not_in_ready(self):
        """Completed steps should not appear in ready list."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps)
        scheduler.mark_completed(1)
        ready = scheduler.get_ready_steps()
        self.assertEqual(len(ready), 0)


class TestMarkCompleted(unittest.TestCase):
    """Test mark_completed() method."""

    def test_mark_completed_adds_to_set(self):
        """mark_completed should add order to completed set."""
        scheduler = DAGScheduler([MockStep(order=1)])
        scheduler.mark_completed(1)
        self.assertIn(1, scheduler._completed)

    def test_mark_multiple_completed(self):
        """Multiple steps can be marked completed."""
        scheduler = DAGScheduler([MockStep(order=i) for i in range(1, 4)])
        scheduler.mark_completed(1)
        scheduler.mark_completed(2)
        scheduler.mark_completed(3)
        self.assertEqual(scheduler._completed, {1, 2, 3})


class TestMarkFailed(unittest.TestCase):
    """Test mark_failed() method."""

    def test_mark_failed_adds_to_failed(self):
        """mark_failed should add order to failed set."""
        scheduler = DAGScheduler([MockStep(order=1)])
        scheduler.mark_failed(1)
        self.assertIn(1, scheduler._failed)

    def test_mark_failed_cancels_downstream(self):
        """mark_failed should cancel dependent steps."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler.mark_failed(10)
        self.assertIn(20, scheduler._cancelled)


class TestCancelDownstream(unittest.TestCase):
    """Test _cancel_downstream() method - transitive cancellation."""

    def test_cancel_direct_dependent(self):
        """Direct dependent should be cancelled."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler._cancel_downstream(10)
        self.assertIn(20, scheduler._cancelled)

    def test_cancel_transitive(self):
        """Transitive dependents should be cancelled."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
            MockStep(order=30, dependencies=[20]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler._cancel_downstream(10)
        self.assertIn(20, scheduler._cancelled)
        self.assertIn(30, scheduler._cancelled)

    def test_cancel_no_dependents(self):
        """Cancelling step with no dependents should be no-op."""
        steps = [MockStep(order=10)]
        scheduler = DAGScheduler(steps)
        scheduler._cancel_downstream(10)
        self.assertEqual(len(scheduler._cancelled), 0)

    def test_cancel_independent_steps(self):
        """Independent steps should not be cancelled."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
            MockStep(order=30, dependencies=[]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler._cancel_downstream(10)
        self.assertIn(20, scheduler._cancelled)
        self.assertNotIn(30, scheduler._cancelled)


class TestIsDone(unittest.TestCase):
    """Test is_done() method."""

    def test_empty_scheduler_is_done(self):
        """Empty scheduler should be done."""
        scheduler = DAGScheduler([])
        self.assertTrue(scheduler.is_done())

    def test_not_done_when_steps_pending(self):
        """Scheduler with pending steps is not done."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps)
        self.assertFalse(scheduler.is_done())

    def test_done_when_all_completed(self):
        """Scheduler is done when all steps completed."""
        steps = [MockStep(order=i) for i in range(1, 4)]
        scheduler = DAGScheduler(steps)
        scheduler.mark_completed(1)
        scheduler.mark_completed(2)
        scheduler.mark_completed(3)
        self.assertTrue(scheduler.is_done())

    def test_done_when_all_failed(self):
        """Scheduler is done when all steps failed."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps)
        scheduler.mark_failed(1)
        self.assertTrue(scheduler.is_done())

    def test_done_when_all_cancelled(self):
        """Scheduler is done when all steps cancelled."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler.mark_failed(10)  # This cancels step 20
        self.assertTrue(scheduler.is_done())

    def test_done_with_mixed_states(self):
        """Scheduler is done with mixed completed/failed/cancelled."""
        # Step 30 depends on step 20, which depends on step 10
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
            MockStep(order=30, dependencies=[20]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler.mark_completed(10)
        scheduler.mark_failed(20)  # Cancels 30 (depends on 20)
        self.assertTrue(scheduler.is_done())


class TestCancelledSteps(unittest.TestCase):
    """Test cancelled_steps property."""

    def test_cancelled_steps_returns_copy(self):
        """cancelled_steps should return a copy, not the internal set."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
        ]
        scheduler = DAGScheduler(steps)
        scheduler.mark_failed(10)
        cancelled = scheduler.cancelled_steps
        self.assertIn(20, cancelled)
        cancelled.add(999)
        self.assertNotIn(999, scheduler._cancelled)


class TestHasDependencies(unittest.TestCase):
    """Test has_dependencies() method."""

    def test_no_dependencies(self):
        """Steps without dependencies return False."""
        steps = [MockStep(order=1), MockStep(order=2)]
        scheduler = DAGScheduler(steps)
        self.assertFalse(scheduler.has_dependencies())

    def test_with_dependencies(self):
        """Steps with dependencies return True."""
        steps = [
            MockStep(order=10, dependencies=[]),
            MockStep(order=20, dependencies=[10]),
        ]
        scheduler = DAGScheduler(steps)
        self.assertTrue(scheduler.has_dependencies())

    def test_empty_dependencies_list(self):
        """Empty dependencies list is treated as no dependencies."""
        steps = [MockStep(order=1, dependencies=[])]
        scheduler = DAGScheduler(steps)
        self.assertFalse(scheduler.has_dependencies())

    def test_none_dependencies(self):
        """None dependencies is treated as no dependencies."""
        steps = [MockStep(order=1, dependencies=None)]
        scheduler = DAGScheduler(steps)
        self.assertFalse(scheduler.has_dependencies())


class TestExecuteAll(unittest.TestCase):
    """Test execute_all() method - parallel execution."""

    def test_execute_single_step(self):
        """Single step execution should succeed."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps, max_workers=2)
        mock_result = MagicMock()
        mock_result.verification.passed = True
        executor_fn = MagicMock(return_value=mock_result)
        results = scheduler.execute_all(executor_fn)
        self.assertEqual(len(results), 1)
        self.assertIn(1, results)
        self.assertTrue(results[1].success)
        executor_fn.assert_called_once()

    def test_execute_parallel_steps(self):
        """Independent steps should execute in parallel."""
        steps = [MockStep(order=1), MockStep(order=2), MockStep(order=3)]
        scheduler = DAGScheduler(steps, max_workers=4)
        mock_result = MagicMock()
        mock_result.verification.passed = True
        executor_fn = MagicMock(return_value=mock_result)
        results = scheduler.execute_all(executor_fn)
        self.assertEqual(len(results), 3)
        self.assertEqual(executor_fn.call_count, 3)
        for order in [1, 2, 3]:
            self.assertTrue(results[order].success)

    def test_execute_with_failure(self):
        """Failed step should mark result as unsuccessful."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps, max_workers=2)
        mock_result = MagicMock()
        mock_result.verification.passed = False
        executor_fn = MagicMock(return_value=mock_result)
        results = scheduler.execute_all(executor_fn)
        self.assertFalse(results[1].success)

    def test_execute_with_exception(self):
        """Exception in executor should be caught and recorded."""
        steps = [MockStep(order=1)]
        scheduler = DAGScheduler(steps, max_workers=2)
        executor_fn = MagicMock(side_effect=RuntimeError("Executor error"))
        results = scheduler.execute_all(executor_fn)
        self.assertFalse(results[1].success)
        self.assertIn("Executor error", results[1].error)

    def test_execute_with_callback(self):
        """on_complete callback should be called for each step."""
        steps = [MockStep(order=1), MockStep(order=2)]
        scheduler = DAGScheduler(steps, max_workers=2)
        mock_result = MagicMock()
        mock_result.verification.passed = True
        executor_fn = MagicMock(return_value=mock_result)
        callback = MagicMock()
        scheduler.execute_all(executor_fn, on_complete=callback)
        self.assertEqual(callback.call_count, 2)


class TestValidateDag(unittest.TestCase):
    """Test validate_dag() function - circular dependency detection."""

    def test_valid_dag_no_dependencies(self):
        """DAG with no dependencies is valid."""
        steps = [MockStep(order=1), MockStep(order=2)]
        error = validate_dag(steps)
        self.assertIsNone(error)

    def test_valid_dag_linear(self):
        """Linear dependency chain is valid."""
        # Dependencies reference ORDER values
        steps = [
            MockStep(order=1, dependencies=[]),
            MockStep(order=2, dependencies=[1]),
            MockStep(order=3, dependencies=[2]),
        ]
        error = validate_dag(steps)
        self.assertIsNone(error)

    def test_valid_dag_diamond(self):
        """Diamond dependency pattern is valid."""
        steps = [
            MockStep(order=1, dependencies=[]),
            MockStep(order=2, dependencies=[1]),
            MockStep(order=3, dependencies=[1]),
            MockStep(order=4, dependencies=[2, 3]),
        ]
        error = validate_dag(steps)
        self.assertIsNone(error)

    def test_circular_self_dependency(self):
        """Self-dependency should be detected as circular."""
        steps = [MockStep(order=1, dependencies=[1])]
        error = validate_dag(steps)
        self.assertIsNotNone(error)
        self.assertIn("circular", error.lower())

    def test_circular_two_step(self):
        """Two-step circular dependency should be detected."""
        steps = [
            MockStep(order=1, dependencies=[2]),
            MockStep(order=2, dependencies=[1]),
        ]
        error = validate_dag(steps)
        self.assertIsNotNone(error)
        self.assertIn("circular", error.lower())

    def test_circular_three_step(self):
        """Three-step circular dependency should be detected."""
        steps = [
            MockStep(order=1, dependencies=[3]),
            MockStep(order=2, dependencies=[1]),
            MockStep(order=3, dependencies=[2]),
        ]
        error = validate_dag(steps)
        self.assertIsNotNone(error)
        self.assertIn("circular", error.lower())

    def test_empty_steps(self):
        """Empty steps list is valid."""
        error = validate_dag([])
        self.assertIsNone(error)


if __name__ == "__main__":
    unittest.main()
