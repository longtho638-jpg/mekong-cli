"""Tests for Phase 2 executor integration: ExecutionContext, TimeoutManager, HookRegistry."""

import subprocess
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

import pytest

from src.core.execution_context import ExecutionContext
from src.core.execution_hooks import HookRegistry, HookResult
from src.core.executor import RecipeExecutor
from src.core.parser import Recipe, RecipeStep
from src.core.retry_policy import RetryPolicy
from src.core.timeout_manager import StepTimeoutError, TimeoutConfig, TimeoutManager


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _recipe(steps=None):
    """Create a minimal Recipe."""
    return Recipe(name="test-recipe", description="Test", steps=steps or [])


def _step(order=1, title="Test Step", description="echo hello", params=None):
    """Create a RecipeStep."""
    return RecipeStep(order=order, title=title, description=description, params=params or {})


def _safe_completed(stdout="output", stderr="", returncode=0):
    """Return a CompletedProcess mock for subprocess.run."""
    return subprocess.CompletedProcess(
        args=["echo"], returncode=returncode, stdout=stdout, stderr=stderr
    )


@contextmanager
def _patched_shell(executor, stdout="output", returncode=0):
    """Context manager: bypass security checks and mock subprocess.run."""
    result = _safe_completed(stdout=stdout, returncode=returncode)
    with patch.object(executor, "_is_safe_command", return_value=True), \
         patch("src.core.executor.CommandSanitizer") as mock_san_cls:
        mock_san = MagicMock()
        mock_san.sanitize.return_value = MagicMock(
            is_safe=True, sanitized_command="echo hello", warnings=[]
        )
        mock_san_cls.return_value = mock_san
        with patch("subprocess.run", return_value=result) as mock_run:
            yield mock_run


# ---------------------------------------------------------------------------
# Backward-compatibility: no new params = same behavior
# ---------------------------------------------------------------------------

class TestBackwardCompatibility:
    """RecipeExecutor(recipe) with no new args preserves existing behavior."""

    def test_init_no_new_params(self):
        """Legacy constructor signature still works."""
        recipe = _recipe()
        executor = RecipeExecutor(recipe)
        assert executor.context is None
        assert executor.timeout_mgr is None
        assert executor.hooks is None
        assert executor.retry_policy is None

    def test_execute_step_no_context_no_hooks(self):
        """execute_step works when no context/hooks are set."""
        recipe = _recipe()
        executor = RecipeExecutor(recipe)
        step = _step(description="echo backward-compat")
        with _patched_shell(executor, stdout="output") as mock_run:
            result = executor.execute_step(step)
        assert result.exit_code == 0
        mock_run.assert_called_once()

    def test_shell_timeout_defaults_to_300(self):
        """Without timeout_mgr, shell step uses 300s default."""
        recipe = _recipe()
        executor = RecipeExecutor(recipe)
        step = _step(description="echo test")
        with _patched_shell(executor) as mock_run:
            executor.execute_step(step)
        _, kwargs = mock_run.call_args
        assert kwargs.get("timeout") == 300.0

    def test_step_params_timeout_without_timeout_mgr(self):
        """step.params['timeout'] respected when no timeout_mgr provided."""
        recipe = _recipe()
        executor = RecipeExecutor(recipe)
        step = _step(description="echo test", params={"timeout": 60})
        with _patched_shell(executor) as mock_run:
            executor.execute_step(step)
        _, kwargs = mock_run.call_args
        assert kwargs.get("timeout") == 60.0


# ---------------------------------------------------------------------------
# ExecutionContext integration
# ---------------------------------------------------------------------------

class TestExecutionContextIntegration:
    """Step stdout is recorded in ExecutionContext after execution."""

    def test_step_output_recorded_in_context(self):
        """After execute_step, stdout is stored in context at step.order."""
        ctx = ExecutionContext()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx)
        step = _step(order=3, description="echo hello")
        with _patched_shell(executor, stdout="hello\n"):
            executor.execute_step(step)
        assert ctx.get_step_output(3) == "hello\n"

    def test_step_output_truncated_at_10kb(self):
        """Outputs > 10 KB are truncated in context."""
        ctx = ExecutionContext()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx)
        step = _step(order=1, description="echo big")
        big_output = "x" * 20_000
        with _patched_shell(executor, stdout=big_output):
            executor.execute_step(step)
        stored = ctx.get_step_output(1)
        assert stored is not None
        assert len(stored) <= 10_240

    def test_failed_step_output_still_recorded(self):
        """Output from a failed step is still recorded in context."""
        ctx = ExecutionContext()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx)
        step = _step(order=2, description="false")
        err = subprocess.CalledProcessError(1, "false", output="partial", stderr="err")
        with patch.object(executor, "_is_safe_command", return_value=True), \
             patch("src.core.executor.CommandSanitizer") as mock_san_cls:
            mock_san = MagicMock()
            mock_san.sanitize.return_value = MagicMock(
                is_safe=True, sanitized_command="false", warnings=[]
            )
            mock_san_cls.return_value = mock_san
            with patch("subprocess.run", side_effect=err):
                executor.execute_step(step)
        # context records empty string for failed step (stdout from exception)
        recorded = ctx.get_step_output(2)
        assert recorded is not None

    def test_context_isolated_per_step(self):
        """Different step orders get separate context entries."""
        ctx = ExecutionContext()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx)
        step_a = _step(order=1, description="echo alpha")
        step_b = _step(order=2, description="echo beta")
        with _patched_shell(executor, stdout="alpha"):
            executor.execute_step(step_a)
        with _patched_shell(executor, stdout="beta"):
            executor.execute_step(step_b)
        assert ctx.get_step_output(1) == "alpha"
        assert ctx.get_step_output(2) == "beta"

    def test_context_not_mutated_without_context_param(self):
        """When no context is passed, no AttributeError is raised."""
        recipe = _recipe()
        executor = RecipeExecutor(recipe)  # no context
        step = _step(order=1, description="echo hello")
        with _patched_shell(executor, stdout="hello"):
            result = executor.execute_step(step)
        assert result.exit_code == 0


# ---------------------------------------------------------------------------
# TimeoutManager integration
# ---------------------------------------------------------------------------

class TestTimeoutManagerIntegration:
    """Shell step uses TimeoutManager.get_step_timeout() instead of hardcoded 300."""

    def test_step_timeout_from_timeout_manager(self):
        """timeout_mgr.get_step_timeout() is used as subprocess timeout."""
        cfg = TimeoutConfig(step_timeout=42.0)
        tmgr = TimeoutManager(config=cfg)
        tmgr.start_workflow()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, timeout_mgr=tmgr)
        step = _step(description="echo test")
        with _patched_shell(executor) as mock_run:
            executor.execute_step(step)
        _, kwargs = mock_run.call_args
        assert kwargs.get("timeout") == 42.0

    def test_step_params_override_default_timeout(self):
        """step.params['timeout'] overrides TimeoutManager default when no global cap."""
        cfg = TimeoutConfig(step_timeout=100.0, global_timeout=None)
        tmgr = TimeoutManager(config=cfg)
        tmgr.start_workflow()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, timeout_mgr=tmgr)
        step = _step(description="echo test", params={"timeout": 15})
        with _patched_shell(executor) as mock_run:
            executor.execute_step(step)
        _, kwargs = mock_run.call_args
        assert kwargs.get("timeout") == 15.0

    def test_timeout_expired_raises_step_timeout_error(self):
        """subprocess.TimeoutExpired is re-raised as StepTimeoutError when timeout_mgr set."""
        cfg = TimeoutConfig(step_timeout=1.0)
        tmgr = TimeoutManager(config=cfg)
        tmgr.start_workflow()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, timeout_mgr=tmgr)
        step = _step(order=5, description="sleep 99")
        with patch.object(executor, "_is_safe_command", return_value=True), \
             patch("src.core.executor.CommandSanitizer") as mock_san_cls:
            mock_san = MagicMock()
            mock_san.sanitize.return_value = MagicMock(
                is_safe=True, sanitized_command="sleep 99", warnings=[]
            )
            mock_san_cls.return_value = mock_san
            with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("sleep", 1.0)):
                with pytest.raises(StepTimeoutError) as exc_info:
                    executor.execute_step(step)
        assert exc_info.value.step_order == 5

    def test_timeout_expired_returns_error_result_without_timeout_mgr(self):
        """subprocess.TimeoutExpired returns error ExecutionResult when no timeout_mgr."""
        recipe = _recipe()
        executor = RecipeExecutor(recipe)  # no timeout_mgr
        step = _step(description="sleep 99")
        with patch.object(executor, "_is_safe_command", return_value=True), \
             patch("src.core.executor.CommandSanitizer") as mock_san_cls:
            mock_san = MagicMock()
            mock_san.sanitize.return_value = MagicMock(
                is_safe=True, sanitized_command="sleep 99", warnings=[]
            )
            mock_san_cls.return_value = mock_san
            with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("sleep", 300)):
                result = executor.execute_step(step)
        assert result.exit_code == 1
        assert "timed out" in result.stderr.lower()


# ---------------------------------------------------------------------------
# HookRegistry integration
# ---------------------------------------------------------------------------

class TestHookRegistryIntegration:
    """Hooks fire correctly around execute_step()."""

    def test_before_hook_called(self):
        """before-hook is called before step execution."""
        ctx = ExecutionContext()
        hooks = HookRegistry()
        called = []

        def before_hook(step, context):
            called.append("before")
            return HookResult(proceed=True)

        hooks.register_before("test_before", before_hook)
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx, hooks=hooks)
        step = _step(description="echo test")
        with _patched_shell(executor):
            executor.execute_step(step)
        assert "before" in called

    def test_after_hook_called_on_success(self):
        """after-hook is called after successful execution."""
        ctx = ExecutionContext()
        hooks = HookRegistry()
        called = []

        def after_hook(step, context, result):
            called.append(("after", result.exit_code))

        hooks.register_after("test_after", after_hook)
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx, hooks=hooks)
        step = _step(description="echo test")
        with _patched_shell(executor):
            executor.execute_step(step)
        assert ("after", 0) in called

    def test_before_hook_shortcircuit_skips_execution(self):
        """When before-hook returns proceed=False, step is skipped."""
        ctx = ExecutionContext()
        hooks = HookRegistry()
        hooks.register_before("blocker", lambda s, c: HookResult(proceed=False))
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx, hooks=hooks)
        step = _step(description="echo test")
        with _patched_shell(executor) as mock_run:
            result = executor.execute_step(step)
        mock_run.assert_not_called()
        assert result.exit_code == 0
        assert result.metadata.get("hook_skipped") is True

    def test_before_hook_shortcircuit_records_in_context(self):
        """Skipped step still records its output in context."""
        ctx = ExecutionContext()
        hooks = HookRegistry()
        hooks.register_before("blocker", lambda s, c: HookResult(proceed=False))
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx, hooks=hooks)
        step = _step(order=7, description="echo test")
        with _patched_shell(executor):
            executor.execute_step(step)
        assert ctx.get_step_output(7) is not None

    def test_error_hook_called_on_raised_exception(self):
        """error-hook fires when execute_step raises an unhandled exception."""
        ctx = ExecutionContext()
        hooks = HookRegistry()
        errors_caught = []

        def error_hook(step, context, exc):
            errors_caught.append(str(exc))

        hooks.register_error("test_error", error_hook)
        cfg = TimeoutConfig(step_timeout=1.0)
        tmgr = TimeoutManager(config=cfg)
        tmgr.start_workflow()
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx, hooks=hooks, timeout_mgr=tmgr)
        step = _step(description="sleep 99")
        with patch.object(executor, "_is_safe_command", return_value=True), \
             patch("src.core.executor.CommandSanitizer") as mock_san_cls:
            mock_san = MagicMock()
            mock_san.sanitize.return_value = MagicMock(
                is_safe=True, sanitized_command="sleep 99", warnings=[]
            )
            mock_san_cls.return_value = mock_san
            with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("sleep", 1.0)):
                with pytest.raises(StepTimeoutError):
                    executor.execute_step(step)
        assert len(errors_caught) == 1

    def test_hooks_not_called_without_context(self):
        """Hooks are not invoked when no context is set."""
        hooks = HookRegistry()
        called = []

        def before_hook(s, c):
            called.append("before")
            return HookResult(proceed=True)

        hooks.register_before("test", before_hook)
        recipe = _recipe()
        executor = RecipeExecutor(recipe, hooks=hooks)  # no context
        step = _step(description="echo test")
        with _patched_shell(executor):
            executor.execute_step(step)
        assert called == []

    def test_after_hook_not_called_on_skipped_step(self):
        """after-hook does not fire when before-hook short-circuits."""
        ctx = ExecutionContext()
        hooks = HookRegistry()
        hooks.register_before("blocker", lambda s, c: HookResult(proceed=False))
        after_called = []
        hooks.register_after("tracker", lambda s, c, r: after_called.append("after"))
        recipe = _recipe()
        executor = RecipeExecutor(recipe, context=ctx, hooks=hooks)
        step = _step(description="echo test")
        with _patched_shell(executor):
            executor.execute_step(step)
        assert after_called == []


# ---------------------------------------------------------------------------
# RetryPolicy integration
# ---------------------------------------------------------------------------

class TestRetryPolicyIntegration:
    """RetryPolicy drives retry behavior when provided."""

    def test_retry_policy_max_attempts_used(self):
        """RetryPolicy.max_attempts controls how many times subprocess is called."""
        policy = RetryPolicy(max_attempts=2, initial_interval_seconds=0.0)
        recipe = _recipe()
        executor = RecipeExecutor(recipe, retry_policy=policy)
        step = _step(description="false")
        call_count = 0

        def failing_run(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            err = subprocess.CalledProcessError(1, "false", output="", stderr="err")
            raise err

        with patch.object(executor, "_is_safe_command", return_value=True), \
             patch("src.core.executor.CommandSanitizer") as mock_san_cls:
            mock_san = MagicMock()
            mock_san.sanitize.return_value = MagicMock(
                is_safe=True, sanitized_command="false", warnings=[]
            )
            mock_san_cls.return_value = mock_san
            with patch("subprocess.run", side_effect=failing_run), \
                 patch("time.sleep"):
                executor.execute_step(step)
        # max_attempts=2 means 2 total calls
        assert call_count == 2

    def test_retry_policy_non_retryable_exit_code_stops_immediately(self):
        """RetryPolicy stops retrying when exit code is non-retryable."""
        policy = RetryPolicy(
            max_attempts=5,
            initial_interval_seconds=0.0,
            non_retryable_exit_codes=[2],
        )
        recipe = _recipe()
        executor = RecipeExecutor(recipe, retry_policy=policy)
        step = _step(description="cmd")
        call_count = 0

        def failing_run(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            err = subprocess.CalledProcessError(2, "cmd", output="", stderr="fatal")
            raise err

        with patch.object(executor, "_is_safe_command", return_value=True), \
             patch("src.core.executor.CommandSanitizer") as mock_san_cls:
            mock_san = MagicMock()
            mock_san.sanitize.return_value = MagicMock(
                is_safe=True, sanitized_command="cmd", warnings=[]
            )
            mock_san_cls.return_value = mock_san
            with patch("subprocess.run", side_effect=failing_run), \
                 patch("time.sleep"):
                result = executor.execute_step(step)
        # Should stop after first failure because exit_code=2 is non-retryable
        assert call_count == 1
        assert result.exit_code == 2
