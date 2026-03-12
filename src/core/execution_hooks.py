"""Mekong CLI - Execution Hooks.

Pre/post execution hooks per step with middleware chain pattern.
Enables cross-cutting concerns (logging, telemetry, env injection)
without modifying executor core logic.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Callable

from src.core.parser import RecipeStep
from src.core.verifier import ExecutionResult

if TYPE_CHECKING:
    from src.core.execution_context import ExecutionContext

logger = logging.getLogger(__name__)


@dataclass
class HookResult:
    """Result returned by a before-hook."""

    proceed: bool = True
    modified_step: RecipeStep | None = None


# Type aliases for hook callables
BeforeHook = Callable[["RecipeStep", "ExecutionContext"], HookResult]
AfterHook = Callable[["RecipeStep", "ExecutionContext", ExecutionResult], None]
ErrorHook = Callable[["RecipeStep", "ExecutionContext", Exception], None]


class HookRegistry:
    """Registry for step-level execution hooks.

    Before-hooks run in registration order before a step executes.
    After-hooks run in registration order after a step executes.
    Error-hooks run when a step raises an unhandled exception.

    Before-hook can short-circuit execution by returning HookResult(proceed=False).
    After/error hook exceptions are swallowed (logged as warnings).
    """

    def __init__(self) -> None:
        """Initialize empty hook lists."""
        self._before: list[tuple[str, BeforeHook]] = []
        self._after: list[tuple[str, AfterHook]] = []
        self._error: list[tuple[str, ErrorHook]] = []

    # --- Registration ---

    def register_before(self, name: str, hook: BeforeHook) -> None:
        """Register a before-step hook.

        Args:
            name: Unique name used for removal.
            hook: Callable(step, context) -> HookResult.

        """
        self._before.append((name, hook))

    def register_after(self, name: str, hook: AfterHook) -> None:
        """Register an after-step hook.

        Args:
            name: Unique name used for removal.
            hook: Callable(step, context, result) -> None.

        """
        self._after.append((name, hook))

    def register_error(self, name: str, hook: ErrorHook) -> None:
        """Register an error hook.

        Args:
            name: Unique name used for removal.
            hook: Callable(step, context, exc) -> None.

        """
        self._error.append((name, hook))

    def unregister(self, name: str) -> None:
        """Remove a hook by name from all phases.

        Args:
            name: Name passed during registration.

        """
        self._before = [(n, h) for n, h in self._before if n != name]
        self._after = [(n, h) for n, h in self._after if n != name]
        self._error = [(n, h) for n, h in self._error if n != name]

    # --- Execution ---

    def run_before(self, step: RecipeStep, context: ExecutionContext) -> HookResult:
        """Run all before-hooks in order. Short-circuit on proceed=False.

        Args:
            step: The step about to be executed.
            context: Shared execution context.

        Returns:
            First failing HookResult, or HookResult(proceed=True) if all pass.

        """
        current_step = step
        for name, hook in self._before:
            try:
                result = hook(current_step, context)
            except Exception as exc:
                logger.warning("[Hook:%s] before-hook raised: %s", name, exc)
                continue
            if result.modified_step is not None:
                current_step = result.modified_step
            if not result.proceed:
                return result
        return HookResult(proceed=True, modified_step=current_step if current_step is not step else None)

    def run_after(self, step: RecipeStep, context: ExecutionContext, result: ExecutionResult) -> None:
        """Run all after-hooks. Errors are swallowed.

        Args:
            step: The step that just executed.
            context: Shared execution context.
            result: Execution result from the step.

        """
        for name, hook in self._after:
            try:
                hook(step, context, result)
            except Exception as exc:
                logger.warning("[Hook:%s] after-hook raised: %s", name, exc)

    def run_error_hooks(self, step: RecipeStep, context: ExecutionContext, exc: Exception) -> None:
        """Run all error-hooks. Errors are swallowed.

        Args:
            step: The step that raised.
            context: Shared execution context.
            exc: The exception raised.

        """
        for name, hook in self._error:
            try:
                hook(step, context, exc)
            except Exception as inner:
                logger.warning("[Hook:%s] error-hook raised: %s", name, inner)

    def list_hooks(self) -> dict[str, list[str]]:
        """Return hook names grouped by phase.

        Returns:
            Dict with keys 'before', 'after', 'error'.

        """
        return {
            "before": [n for n, _ in self._before],
            "after": [n for n, _ in self._after],
            "error": [n for n, _ in self._error],
        }


# --- Built-in hooks ---

def logging_before_hook(step: RecipeStep, ctx: ExecutionContext) -> HookResult:  # noqa: ARG001
    """Log step title before execution."""
    logger.debug("[Step %d] Starting: %s", step.order, step.title)
    return HookResult(proceed=True)


def logging_after_hook(step: RecipeStep, ctx: ExecutionContext, result: ExecutionResult) -> None:  # noqa: ARG001
    """Log step completion with exit code."""
    logger.debug("[Step %d] Finished: %s (exit=%d)", step.order, step.title, result.exit_code)


def env_injection_hook(step: RecipeStep, ctx: ExecutionContext) -> HookResult:
    """Inject context env vars into step params under 'env' key.

    Reads all env overrides from context and merges them into
    step.params['env'] so executor can apply them to subprocess calls.

    Args:
        step: Step to inject env into.
        ctx: Execution context with env overrides.

    Returns:
        HookResult with modified_step carrying the env payload.

    """
    snapshot = ctx.snapshot()
    env_overrides: dict[str, str] = snapshot.get("env", {})
    if not env_overrides:
        return HookResult(proceed=True)

    # Build a modified step with env merged into params
    import copy
    new_params: dict[str, Any] = copy.deepcopy(step.params or {})
    existing_env: dict[str, str] = new_params.get("env", {})
    merged_env = {**existing_env, **env_overrides}
    new_params["env"] = merged_env

    modified = RecipeStep(
        order=step.order,
        title=step.title,
        description=step.description,
        agent=step.agent,
        params=new_params,
        dependencies=list(step.dependencies),
    )
    return HookResult(proceed=True, modified_step=modified)


def timing_after_hook(step: RecipeStep, ctx: ExecutionContext, result: ExecutionResult) -> None:
    """Record step duration in context under 'step_duration_{order}'."""
    key = f"step_duration_{step.order}"
    existing: float = ctx.get(key, 0.0)  # type: ignore[assignment]
    if existing == 0.0:
        # Record current timestamp as end; caller should set start via before-hook
        ctx.set(key, time.monotonic())
    else:
        ctx.set(key, time.monotonic() - existing)
    result.metadata["step_order"] = step.order


__all__ = [
    "AfterHook",
    "BeforeHook",
    "ErrorHook",
    "HookRegistry",
    "HookResult",
    "env_injection_hook",
    "logging_after_hook",
    "logging_before_hook",
    "timing_after_hook",
]
