"""Tests for src/core/execution_hooks.py.

Covers: HookResult, HookRegistry registration/removal/ordering,
before-hook short-circuit, after/error-hook swallow-on-error,
and built-in hook behaviour.
"""

from __future__ import annotations

from src.core.execution_context import ExecutionContext
from src.core.execution_hooks import (
    HookRegistry,
    HookResult,
    env_injection_hook,
    logging_after_hook,
    logging_before_hook,
    timing_after_hook,
)
from src.core.parser import RecipeStep
from src.core.verifier import ExecutionResult


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _step(order: int = 1, title: str = "test-step") -> RecipeStep:
    return RecipeStep(order=order, title=title, description="desc")


def _ctx() -> ExecutionContext:
    return ExecutionContext()


def _result(exit_code: int = 0) -> ExecutionResult:
    return ExecutionResult(exit_code=exit_code, stdout="ok", stderr="")


# ---------------------------------------------------------------------------
# HookResult dataclass
# ---------------------------------------------------------------------------

class TestHookResult:
    def test_defaults(self) -> None:
        r = HookResult()
        assert r.proceed is True
        assert r.modified_step is None

    def test_proceed_false(self) -> None:
        r = HookResult(proceed=False)
        assert r.proceed is False


# ---------------------------------------------------------------------------
# HookRegistry – registration
# ---------------------------------------------------------------------------

class TestHookRegistryRegistration:
    def test_register_before_appears_in_list(self) -> None:
        reg = HookRegistry()
        reg.register_before("log", logging_before_hook)
        assert "log" in reg.list_hooks()["before"]

    def test_register_after_appears_in_list(self) -> None:
        reg = HookRegistry()
        reg.register_after("log", logging_after_hook)
        assert "log" in reg.list_hooks()["after"]

    def test_register_error_appears_in_list(self) -> None:
        reg = HookRegistry()
        reg.register_error("err", lambda s, c, e: None)
        assert "err" in reg.list_hooks()["error"]

    def test_unregister_removes_from_all_phases(self) -> None:
        reg = HookRegistry()
        reg.register_before("x", lambda s, c: HookResult())
        reg.register_after("x", lambda s, c, r: None)
        reg.unregister("x")
        hooks = reg.list_hooks()
        assert "x" not in hooks["before"]
        assert "x" not in hooks["after"]

    def test_unregister_nonexistent_is_noop(self) -> None:
        reg = HookRegistry()
        reg.unregister("ghost")  # must not raise

    def test_empty_registry_list_hooks(self) -> None:
        reg = HookRegistry()
        hooks = reg.list_hooks()
        assert hooks == {"before": [], "after": [], "error": []}


# ---------------------------------------------------------------------------
# HookRegistry – run_before
# ---------------------------------------------------------------------------

class TestRunBefore:
    def test_returns_proceed_true_when_no_hooks(self) -> None:
        reg = HookRegistry()
        result = reg.run_before(_step(), _ctx())
        assert result.proceed is True

    def test_hooks_run_in_registration_order(self) -> None:
        order: list[str] = []
        reg = HookRegistry()
        reg.register_before("first", lambda s, c: (order.append("first"), HookResult())[1])
        reg.register_before("second", lambda s, c: (order.append("second"), HookResult())[1])
        reg.run_before(_step(), _ctx())
        assert order == ["first", "second"]

    def test_short_circuit_on_proceed_false(self) -> None:
        called: list[str] = []
        reg = HookRegistry()
        reg.register_before("stopper", lambda s, c: HookResult(proceed=False))
        reg.register_before("never", lambda s, c: (called.append("never"), HookResult())[1])
        result = reg.run_before(_step(), _ctx())
        assert result.proceed is False
        assert "never" not in called

    def test_modified_step_propagates(self) -> None:
        step = _step(order=1, title="original")
        modified = RecipeStep(order=1, title="modified", description="desc")

        def hook(s: RecipeStep, c: ExecutionContext) -> HookResult:
            return HookResult(proceed=True, modified_step=modified)

        reg = HookRegistry()
        reg.register_before("mutator", hook)
        result = reg.run_before(step, _ctx())
        assert result.proceed is True
        assert result.modified_step is modified

    def test_hook_exception_is_swallowed(self) -> None:
        reg = HookRegistry()
        reg.register_before("crasher", lambda s, c: (_ for _ in ()).throw(RuntimeError("boom")))
        # Should not raise
        result = reg.run_before(_step(), _ctx())
        assert result.proceed is True

    def test_all_hooks_pass_returns_proceed_true(self) -> None:
        reg = HookRegistry()
        reg.register_before("a", lambda s, c: HookResult(proceed=True))
        reg.register_before("b", lambda s, c: HookResult(proceed=True))
        result = reg.run_before(_step(), _ctx())
        assert result.proceed is True


# ---------------------------------------------------------------------------
# HookRegistry – run_after
# ---------------------------------------------------------------------------

class TestRunAfter:
    def test_hooks_run_in_registration_order(self) -> None:
        order: list[str] = []
        reg = HookRegistry()
        reg.register_after("a", lambda s, c, r: order.append("a"))
        reg.register_after("b", lambda s, c, r: order.append("b"))
        reg.run_after(_step(), _ctx(), _result())
        assert order == ["a", "b"]

    def test_hook_exception_is_swallowed(self) -> None:
        reg = HookRegistry()
        reg.register_after("crasher", lambda s, c, r: (_ for _ in ()).throw(RuntimeError("boom")))
        # Must not raise
        reg.run_after(_step(), _ctx(), _result())

    def test_no_hooks_runs_cleanly(self) -> None:
        reg = HookRegistry()
        reg.run_after(_step(), _ctx(), _result())  # no exception


# ---------------------------------------------------------------------------
# HookRegistry – run_error_hooks
# ---------------------------------------------------------------------------

class TestRunErrorHooks:
    def test_error_hook_receives_exception(self) -> None:
        received: list[Exception] = []
        reg = HookRegistry()
        reg.register_error("capture", lambda s, c, e: received.append(e))
        exc = ValueError("fail")
        reg.run_error_hooks(_step(), _ctx(), exc)
        assert received == [exc]

    def test_error_hook_exception_is_swallowed(self) -> None:
        reg = HookRegistry()
        reg.register_error("crasher", lambda s, c, e: (_ for _ in ()).throw(RuntimeError("meta")))
        reg.run_error_hooks(_step(), _ctx(), ValueError("original"))  # no raise

    def test_no_hooks_runs_cleanly(self) -> None:
        reg = HookRegistry()
        reg.run_error_hooks(_step(), _ctx(), Exception("x"))


# ---------------------------------------------------------------------------
# Built-in hooks
# ---------------------------------------------------------------------------

class TestLoggingBeforeHook:
    def test_returns_proceed_true(self) -> None:
        result = logging_before_hook(_step(), _ctx())
        assert result.proceed is True

    def test_no_modified_step(self) -> None:
        result = logging_before_hook(_step(), _ctx())
        assert result.modified_step is None


class TestLoggingAfterHook:
    def test_does_not_raise(self) -> None:
        logging_after_hook(_step(), _ctx(), _result())
        logging_after_hook(_step(), _ctx(), _result(exit_code=1))


class TestEnvInjectionHook:
    def test_no_env_returns_proceed_true_no_modified(self) -> None:
        ctx = _ctx()
        result = env_injection_hook(_step(), ctx)
        assert result.proceed is True
        assert result.modified_step is None

    def test_injects_env_into_step_params(self) -> None:
        ctx = _ctx()
        ctx.set_env("MY_VAR", "hello")
        step = _step()
        result = env_injection_hook(step, ctx)
        assert result.proceed is True
        assert result.modified_step is not None
        assert result.modified_step.params["env"]["MY_VAR"] == "hello"

    def test_merges_with_existing_params_env(self) -> None:
        ctx = _ctx()
        ctx.set_env("NEW", "value")
        step = RecipeStep(order=1, title="t", description="d", params={"env": {"EXISTING": "x"}})
        result = env_injection_hook(step, ctx)
        assert result.modified_step is not None
        env = result.modified_step.params["env"]
        assert env["EXISTING"] == "x"
        assert env["NEW"] == "value"

    def test_does_not_mutate_original_step(self) -> None:
        ctx = _ctx()
        ctx.set_env("X", "1")
        step = RecipeStep(order=1, title="t", description="d", params={"key": "v"})
        env_injection_hook(step, ctx)
        assert "env" not in step.params


class TestTimingAfterHook:
    def test_sets_step_order_in_metadata(self) -> None:
        ctx = _ctx()
        result = _result()
        timing_after_hook(_step(order=3), ctx, result)
        assert result.metadata["step_order"] == 3

    def test_does_not_raise(self) -> None:
        timing_after_hook(_step(), _ctx(), _result())


# ---------------------------------------------------------------------------
# Integration: registry with built-in hooks
# ---------------------------------------------------------------------------

class TestRegistryWithBuiltins:
    def test_full_before_after_cycle(self) -> None:
        reg = HookRegistry()
        reg.register_before("log", logging_before_hook)
        reg.register_before("env", env_injection_hook)
        reg.register_after("log", logging_after_hook)
        reg.register_after("timing", timing_after_hook)

        ctx = _ctx()
        ctx.set_env("TOKEN", "abc")
        step = _step()
        result = reg.run_before(step, ctx)
        assert result.proceed is True

        exec_result = _result()
        reg.run_after(step, ctx, exec_result)
        assert exec_result.metadata.get("step_order") == step.order
