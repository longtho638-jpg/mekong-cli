"""Unit tests for orchestrator internal components.

Tests StepExecutor, RollbackHandler, ReportFormatter, and OrchestrationResult.
Uses mocks for external I/O (subprocess, LLM) while testing real logic.

NOTE: StepExecutor.execute_and_verify references self.console and self._reflection,
which are NOT set in __init__. Tests that trigger self-healing must patch these
attributes manually on the instance. This is a pre-existing bug in the code.
"""

from __future__ import annotations

import sys
import os
import subprocess
from unittest.mock import Mock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from src.core.orchestrator import (
    OrchestrationResult,
    OrchestrationStatus,
    ReportFormatter,
    RollbackHandler,
    StepExecutor,
    StepResult,
)
from src.core.parser import Recipe, RecipeStep
from src.core.verifier import (
    ExecutionResult,
    VerificationCheck,
    VerificationReport,
    VerificationStatus,
)


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

def make_recipe(name: str = "test-recipe", steps: list | None = None) -> Recipe:
    return Recipe(
        name=name,
        description="Test recipe",
        steps=steps or [],
        metadata={"source": "unit-test"},
    )


def make_step(
    order: int = 1,
    title: str = "Test step",
    description: str = "echo hello",
    params: dict | None = None,
    deps: list | None = None,
) -> RecipeStep:
    return RecipeStep(
        order=order,
        title=title,
        description=description,
        params=params or {},
        dependencies=deps or [],
    )


def passed_report() -> VerificationReport:
    return VerificationReport(
        passed=True,
        checks=[VerificationCheck(
            name="exit_code",
            status=VerificationStatus.PASSED,
            message="ok",
            expected=0,
            actual=0,
        )],
    )


def failed_report(error: str = "step failed") -> VerificationReport:
    return VerificationReport(
        passed=False,
        checks=[VerificationCheck(
            name="exit_code",
            status=VerificationStatus.FAILED,
            message=error,
            expected=0,
            actual=1,
        )],
        errors=[error],
    )


def ok_execution() -> ExecutionResult:
    return ExecutionResult(exit_code=0, stdout="hello", stderr="")


def fail_execution(stderr: str = "error!") -> ExecutionResult:
    return ExecutionResult(exit_code=1, stdout="", stderr=stderr)


def make_step_executor(
    llm_client=None,
    telemetry=None,
    history=None,
) -> StepExecutor:
    """Build a StepExecutor with mocked executor and verifier."""
    mock_executor = Mock()
    mock_verifier = Mock()
    se = StepExecutor(
        executor=mock_executor,
        verifier=mock_verifier,
        llm_client=llm_client,
        history=history if history is not None else [],
        telemetry=telemetry,
    )
    return se


# ---------------------------------------------------------------------------
# OrchestrationResult
# ---------------------------------------------------------------------------

class TestOrchestrationResult:
    def test_success_rate_zero_total(self):
        r = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=make_recipe(),
            total_steps=0,
            completed_steps=0,
        )
        assert r.success_rate == 0.0

    def test_success_rate_100(self):
        r = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=make_recipe(),
            total_steps=5,
            completed_steps=5,
        )
        assert r.success_rate == 100.0

    def test_success_rate_partial(self):
        r = OrchestrationResult(
            status=OrchestrationStatus.PARTIAL,
            recipe=make_recipe(),
            total_steps=4,
            completed_steps=3,
            failed_steps=1,
        )
        assert abs(r.success_rate - 75.0) < 0.01

    def test_success_rate_zero_completed(self):
        r = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            total_steps=3,
            completed_steps=0,
            failed_steps=3,
        )
        assert r.success_rate == 0.0

    def test_default_fields(self):
        r = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=make_recipe(),
        )
        assert r.step_results == []
        assert r.total_steps == 0
        assert r.completed_steps == 0
        assert r.failed_steps == 0
        assert r.warnings == []
        assert r.errors == []

    def test_append_errors_and_warnings(self):
        r = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
        )
        r.errors.append("something broke")
        r.warnings.append("heads up")
        assert len(r.errors) == 1
        assert len(r.warnings) == 1


# ---------------------------------------------------------------------------
# StepExecutor — success path
# ---------------------------------------------------------------------------

class TestStepExecutorSuccess:
    def test_execute_and_verify_success(self):
        """Shell step succeeds, verification passes → StepResult.self_healed=False."""
        se = make_step_executor()
        step = make_step(description="echo hello")

        se.executor.execute_step.return_value = ok_execution()
        se.verifier.verify.return_value = passed_report()

        result = se.execute_and_verify(step)

        assert isinstance(result, StepResult)
        assert result.step is step
        assert result.verification.passed is True
        assert result.self_healed is False
        se.executor.execute_step.assert_called_once_with(step)
        se.verifier.verify.assert_called_once()

    def test_execute_passes_verification_criteria(self):
        """Params with 'verification' dict are passed to verifier."""
        se = make_step_executor()
        step = make_step(params={"verification": {"exit_code": 0}})
        se.executor.execute_step.return_value = ok_execution()
        se.verifier.verify.return_value = passed_report()

        se.execute_and_verify(step)

        _, criteria_arg = se.verifier.verify.call_args[0]
        assert criteria_arg == {"exit_code": 0}

    def test_execute_empty_params_passes_empty_criteria(self):
        """Step with no params → empty criteria dict passed to verifier."""
        se = make_step_executor()
        step = make_step(params={})
        se.executor.execute_step.return_value = ok_execution()
        se.verifier.verify.return_value = passed_report()

        se.execute_and_verify(step)

        _, criteria_arg = se.verifier.verify.call_args[0]
        assert criteria_arg == {}

    def test_step_result_contains_execution(self):
        """StepResult.execution is the ExecutionResult from executor."""
        se = make_step_executor()
        step = make_step()
        exec_result = ok_execution()
        se.executor.execute_step.return_value = exec_result
        se.verifier.verify.return_value = passed_report()

        result = se.execute_and_verify(step)

        assert result.execution is exec_result

    def test_telemetry_record_step_called_on_success(self):
        """Telemetry.record_step is called after successful execution."""
        mock_telemetry = Mock()
        se = make_step_executor(telemetry=mock_telemetry)
        step = make_step(order=3, title="my step")
        se.executor.execute_step.return_value = ok_execution()
        se.verifier.verify.return_value = passed_report()

        se.execute_and_verify(step, step_order=3)

        mock_telemetry.record_step.assert_called_once()
        call_kwargs = mock_telemetry.record_step.call_args[1]
        assert call_kwargs["step_order"] == 3
        assert call_kwargs["title"] == "my step"
        assert call_kwargs["exit_code"] == 0
        assert call_kwargs["self_healed"] is False


# ---------------------------------------------------------------------------
# StepExecutor — failure without self-healing
# ---------------------------------------------------------------------------

class TestStepExecutorFailureNoHealing:
    def test_failed_step_no_llm_client(self):
        """Shell step fails, no llm_client → StepResult.self_healed=False."""
        se = make_step_executor(llm_client=None)
        step = make_step()
        se.executor.execute_step.return_value = fail_execution()
        se.verifier.verify.return_value = failed_report()

        result = se.execute_and_verify(step)

        assert result.verification.passed is False
        assert result.self_healed is False

    def test_llm_step_type_skips_healing(self):
        """LLM-type steps don't trigger self-healing even on failure."""
        mock_llm = Mock()
        mock_llm.generate = Mock(return_value="echo fixed")
        se = make_step_executor(llm_client=mock_llm)
        step = make_step(params={"type": "llm"})  # not shell
        se.executor.execute_step.return_value = fail_execution()
        se.verifier.verify.return_value = failed_report()

        result = se.execute_and_verify(step)

        # generate should NOT be called for llm-type steps
        mock_llm.generate.assert_not_called()
        assert result.self_healed is False

    def test_telemetry_record_step_called_on_failure(self):
        """Telemetry is recorded even when step fails."""
        mock_telemetry = Mock()
        se = make_step_executor(telemetry=mock_telemetry)
        step = make_step()
        se.executor.execute_step.return_value = fail_execution()
        se.verifier.verify.return_value = failed_report()

        se.execute_and_verify(step)

        mock_telemetry.record_step.assert_called_once()
        call_kwargs = mock_telemetry.record_step.call_args[1]
        assert call_kwargs["exit_code"] == 1


# ---------------------------------------------------------------------------
# StepExecutor — self-healing paths
# ---------------------------------------------------------------------------

class TestStepExecutorSelfHealing:
    """Tests for the self-healing code path.

    StepExecutor.execute_and_verify uses self.console and self._reflection
    which are NOT set in __init__. Tests patch these on the instance.
    """

    def _make_healer(self, llm_generate_returns: str) -> tuple:
        """Return (se, step, mock_llm) with self-healing configured."""
        mock_llm = Mock()
        mock_llm.generate = Mock(return_value=llm_generate_returns)
        se = make_step_executor(llm_client=mock_llm)

        # Patch missing attributes that the self-heal code path accesses
        se.console = Mock()
        se._reflection = None
        se.history = []

        step = make_step(
            description="bad_command_xyz",
            params={"type": "shell"},  # explicitly shell
        )
        return se, step, mock_llm

    def test_self_healing_success(self):
        """Shell fails → LLM suggests fix → retry succeeds → self_healed=True."""
        se, step, mock_llm = self._make_healer("echo fixed_command")

        fail_result = fail_execution(stderr="command not found")
        ok_result = ok_execution()

        # First call fails, second (healed) succeeds
        se.executor.execute_step.side_effect = [fail_result, ok_result]
        se.verifier.verify.return_value = passed_report()

        result = se.execute_and_verify(step)

        assert result.self_healed is True
        assert se.executor.execute_step.call_count == 2
        mock_llm.generate.assert_called_once()

    def test_self_healing_llm_same_command_no_retry(self):
        """LLM returns same command as original → no retry performed."""
        original_cmd = "bad_command_xyz"
        se, step, mock_llm = self._make_healer(original_cmd)  # same command

        fail_result = fail_execution()
        se.executor.execute_step.return_value = fail_result
        se.verifier.verify.return_value = failed_report()

        result = se.execute_and_verify(step)

        # Only one call to execute_step (no retry when corrected == command)
        assert se.executor.execute_step.call_count == 1
        assert result.self_healed is False

    def test_self_healing_retry_also_fails(self):
        """LLM suggests fix but retried command also fails → self_healed=False."""
        se, step, mock_llm = self._make_healer("echo different_command")

        fail_result = fail_execution()
        # Both original and healed commands fail
        se.executor.execute_step.side_effect = [fail_result, fail_result]
        se.verifier.verify.return_value = failed_report()

        result = se.execute_and_verify(step)

        assert result.self_healed is False
        assert se.executor.execute_step.call_count == 2

    def test_self_healing_llm_raises_exception(self):
        """LLM throws during generate → healing fails gracefully, no crash."""
        se, step, _ = self._make_healer("irrelevant")
        se.llm_client.generate.side_effect = RuntimeError("LLM error")

        fail_result = fail_execution()
        se.executor.execute_step.return_value = fail_result
        se.verifier.verify.return_value = failed_report()

        # Should not raise
        result = se.execute_and_verify(step)

        assert result.self_healed is False
        assert result.verification.passed is False

    def test_self_healing_with_reflection(self):
        """Reflection hint is requested when _reflection is set."""
        mock_llm = Mock()
        mock_llm.generate = Mock(return_value="echo healed")
        se = make_step_executor(llm_client=mock_llm)
        se.console = Mock()
        se.history = []

        mock_reflection = Mock()
        mock_reflection.get_strategy_suggestion.return_value = "use different approach"
        se._reflection = mock_reflection

        step = make_step(description="bad_cmd", params={"type": "shell"})
        fail_result = fail_execution(stderr="not found")
        ok_result = ok_execution()

        se.executor.execute_step.side_effect = [fail_result, ok_result]
        se.verifier.verify.return_value = passed_report()

        result = se.execute_and_verify(step)

        mock_reflection.get_strategy_suggestion.assert_called_once()
        assert result.self_healed is True

    def test_self_healing_telemetry_llm_call_recorded(self):
        """Telemetry.record_llm_call is invoked when self-healing triggers."""
        mock_telemetry = Mock()
        mock_llm = Mock()
        mock_llm.generate = Mock(return_value="echo healed")
        se = make_step_executor(llm_client=mock_llm, telemetry=mock_telemetry)
        se.console = Mock()
        se._reflection = None
        se.history = []

        step = make_step(description="fail_cmd", params={"type": "shell"})
        se.executor.execute_step.side_effect = [fail_execution(), ok_execution()]
        se.verifier.verify.return_value = passed_report()

        se.execute_and_verify(step)

        mock_telemetry.record_llm_call.assert_called_once()

    def test_self_healing_history_event_appended(self):
        """ExecutionEvent for SELF_HEAL_ATTEMPTED is appended to history."""
        from src.core.execution_history import EventKind

        mock_llm = Mock()
        mock_llm.generate = Mock(return_value="echo healed")
        history = []
        se = make_step_executor(llm_client=mock_llm, history=history)
        se.console = Mock()
        se._reflection = None

        step = make_step(description="fail_cmd", params={"type": "shell"})
        se.executor.execute_step.side_effect = [fail_execution("stderr"), ok_execution()]
        se.verifier.verify.return_value = passed_report()

        se.execute_and_verify(step, workflow_id="wf-abc", step_order=1)

        # History should have at least one SELF_HEAL_ATTEMPTED event
        heal_events = [
            e for e in history
            if hasattr(e, "kind") and e.kind == EventKind.SELF_HEAL_ATTEMPTED
        ]
        assert len(heal_events) >= 1


# ---------------------------------------------------------------------------
# RollbackHandler
# ---------------------------------------------------------------------------

class TestRollbackHandlerDisabled:
    def test_rollback_disabled_is_noop(self):
        """enable_rollback=False → rollback() does nothing."""
        handler = RollbackHandler(enable_rollback=False)
        recipe = make_recipe()
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=recipe,
            total_steps=1,
            completed_steps=1,
        )
        step = make_step()
        step_result = StepResult(
            step=step,
            execution=ok_execution(),
            verification=passed_report(),
        )
        result.step_results.append(step_result)
        original_status = result.status

        handler.rollback(result, step)

        # Status unchanged — rollback did not fire
        assert result.status == original_status

    def test_rollback_disabled_no_subprocess(self):
        """No subprocess.run calls when rollback is disabled."""
        handler = RollbackHandler(enable_rollback=False)
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED, recipe=make_recipe()
        )

        with patch("subprocess.run") as mock_run:
            handler.rollback(result, make_step())
            mock_run.assert_not_called()


class TestRollbackHandlerEnabled:
    def test_rollback_sets_status_rolled_back(self):
        """Successful rollback sets status to ROLLED_BACK."""
        handler = RollbackHandler(enable_rollback=True)
        step = make_step(params={"rollback": "echo undo_me"})
        step_result = StepResult(
            step=step,
            execution=ok_execution(),
            verification=passed_report(),
        )
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[step_result],
        )

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="", stderr="")
            handler.rollback(result, step)

        assert result.status == OrchestrationStatus.ROLLED_BACK

    def test_rollback_skips_step_without_rollback_param(self):
        """Steps with no 'rollback' param are silently skipped."""
        handler = RollbackHandler(enable_rollback=True)
        step = make_step(params={})  # no rollback key
        step_result = StepResult(
            step=step,
            execution=ok_execution(),
            verification=passed_report(),
        )
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[step_result],
        )

        with patch("subprocess.run") as mock_run:
            handler.rollback(result, step)
            mock_run.assert_not_called()

        assert result.status == OrchestrationStatus.ROLLED_BACK

    def test_rollback_skips_failed_steps(self):
        """Only completed (passed) steps are rolled back."""
        handler = RollbackHandler(enable_rollback=True)

        passed_step = make_step(order=1, params={"rollback": "echo undo_1"})
        failed_step = make_step(order=2, params={"rollback": "echo undo_2"})

        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[
                StepResult(step=passed_step, execution=ok_execution(), verification=passed_report()),
                StepResult(step=failed_step, execution=fail_execution(), verification=failed_report()),
            ],
        )

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stdout="", stderr="")
            handler.rollback(result, failed_step)
            # Only the passed step should trigger rollback
            assert mock_run.call_count == 1

    def test_rollback_command_failure_adds_error(self):
        """Failed rollback command adds to result.errors."""
        handler = RollbackHandler(enable_rollback=True)
        step = make_step(order=1, params={"rollback": "echo undo"})
        step_result = StepResult(
            step=step, execution=ok_execution(), verification=passed_report()
        )
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[step_result],
        )

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=1, stdout="", stderr="rollback failed")
            handler.rollback(result, step)

        assert any("rollback" in e.lower() for e in result.errors)

    def test_rollback_timeout_adds_error(self):
        """subprocess.TimeoutExpired during rollback → error recorded."""
        handler = RollbackHandler(enable_rollback=True)
        step = make_step(order=1, params={"rollback": "echo undo"})
        step_result = StepResult(
            step=step, execution=ok_execution(), verification=passed_report()
        )
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[step_result],
        )

        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="echo", timeout=30)):
            handler.rollback(result, step)

        assert any("timed out" in e.lower() for e in result.errors)

    def test_rollback_dangerous_command_blocked(self):
        """CommandSanitizer blocks dangerous rollback commands."""
        handler = RollbackHandler(enable_rollback=True)
        # rm -rf /* is dangerous — sanitizer should block
        step = make_step(order=1, params={"rollback": "rm -rf /*"})
        step_result = StepResult(
            step=step, execution=ok_execution(), verification=passed_report()
        )
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[step_result],
        )

        with patch("subprocess.run") as mock_run:
            handler.rollback(result, step)
            # subprocess.run should NOT have been called
            mock_run.assert_not_called()

        # Error should be recorded about the blocked command
        assert any("blocked" in e.lower() or "security" in e.lower() for e in result.errors)

    def test_rollback_warns_on_errors(self):
        """Rollback with errors adds a warning to result.warnings."""
        handler = RollbackHandler(enable_rollback=True)
        step = make_step(order=1, params={"rollback": "echo undo"})
        step_result = StepResult(
            step=step, execution=ok_execution(), verification=passed_report()
        )
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[step_result],
        )

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=1, stdout="", stderr="fail")
            handler.rollback(result, step)

        assert len(result.warnings) > 0

    def test_rollback_reversed_order(self):
        """Steps are rolled back in reverse order (LIFO)."""
        handler = RollbackHandler(enable_rollback=True)
        rollback_order = []

        step1 = make_step(order=1, params={"rollback": "echo undo_1"})
        step2 = make_step(order=2, params={"rollback": "echo undo_2"})
        step3 = make_step(order=3, params={"rollback": "echo undo_3"})

        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            step_results=[
                StepResult(step=step1, execution=ok_execution(), verification=passed_report()),
                StepResult(step=step2, execution=ok_execution(), verification=passed_report()),
                StepResult(step=step3, execution=ok_execution(), verification=passed_report()),
            ],
        )

        def track_call(args, **kwargs):
            cmd = " ".join(args)
            rollback_order.append(cmd)
            return Mock(returncode=0, stdout="", stderr="")

        with patch("subprocess.run", side_effect=track_call):
            handler.rollback(result, step3)

        # Should be 3, 2, 1 order
        assert "undo_3" in rollback_order[0]
        assert "undo_2" in rollback_order[1]
        assert "undo_1" in rollback_order[2]


# ---------------------------------------------------------------------------
# ReportFormatter
# ---------------------------------------------------------------------------

class TestReportFormatter:
    def test_format_status_success(self):
        formatter = ReportFormatter()
        formatted = formatter._format_status(OrchestrationStatus.SUCCESS)
        assert "success" in formatted.lower()
        assert "green" in formatted

    def test_format_status_failed(self):
        formatter = ReportFormatter()
        formatted = formatter._format_status(OrchestrationStatus.FAILED)
        assert "failed" in formatted.lower()
        assert "red" in formatted

    def test_format_status_partial(self):
        formatter = ReportFormatter()
        formatted = formatter._format_status(OrchestrationStatus.PARTIAL)
        assert "partial" in formatted.lower()
        assert "yellow" in formatted

    def test_format_status_rolled_back(self):
        formatter = ReportFormatter()
        formatted = formatter._format_status(OrchestrationStatus.ROLLED_BACK)
        assert "rolled_back" in formatted.lower()
        assert "magenta" in formatted

    def test_display_does_not_raise_on_success(self):
        """display() runs without error for a success result."""
        formatter = ReportFormatter()
        result = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=make_recipe(),
            total_steps=2,
            completed_steps=2,
        )
        # Should not raise
        formatter.display(result)

    def test_display_does_not_raise_with_errors(self):
        """display() runs without error when result has errors."""
        formatter = ReportFormatter()
        result = OrchestrationResult(
            status=OrchestrationStatus.FAILED,
            recipe=make_recipe(),
            total_steps=1,
            completed_steps=0,
            failed_steps=1,
            errors=["Step 1: command failed"],
        )
        formatter.display(result)

    def test_display_does_not_raise_with_warnings(self):
        """display() runs without error when result has warnings."""
        formatter = ReportFormatter()
        result = OrchestrationResult(
            status=OrchestrationStatus.PARTIAL,
            recipe=make_recipe(),
            total_steps=2,
            completed_steps=1,
            failed_steps=1,
            warnings=["Step 2: non-fatal issue"],
        )
        formatter.display(result)

    def test_display_with_rolled_back_status(self):
        """display() handles ROLLED_BACK status without error."""
        formatter = ReportFormatter()
        result = OrchestrationResult(
            status=OrchestrationStatus.ROLLED_BACK,
            recipe=make_recipe(),
            total_steps=2,
            completed_steps=1,
            errors=["rollback triggered"],
        )
        formatter.display(result)

    def test_format_status_all_statuses_covered(self):
        """All OrchestrationStatus values produce non-empty strings."""
        formatter = ReportFormatter()
        for status in OrchestrationStatus:
            formatted = formatter._format_status(status)
            assert isinstance(formatted, str)
            assert len(formatted) > 0
