"""Mekong CLI - Timeout Manager.

Per-step and global workflow timeout tracking for the PEV engine.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any


class StepTimeoutError(Exception):
    """Raised when a single step exceeds its timeout limit."""

    def __init__(self, message: str, step_order: int = 0, elapsed: float = 0.0, limit: float = 0.0) -> None:
        """Initialize with structured timeout context.

        Args:
            message: Human-readable description.
            step_order: Order index of the timed-out step.
            elapsed: Seconds elapsed before timeout.
            limit: Timeout limit that was exceeded.

        """
        self.step_order = step_order
        self.elapsed = elapsed
        self.limit = limit
        super().__init__(message)


class GlobalTimeoutError(Exception):
    """Raised when the overall workflow exceeds its global timeout limit."""

    def __init__(self, message: str, elapsed: float = 0.0, limit: float = 0.0) -> None:
        """Initialize with structured timeout context.

        Args:
            message: Human-readable description.
            elapsed: Seconds elapsed before timeout.
            limit: Global timeout limit that was exceeded.

        """
        self.elapsed = elapsed
        self.limit = limit
        super().__init__(message)


@dataclass
class TimeoutConfig:
    """Configuration for timeout behaviour across a workflow."""

    step_timeout: float = 300.0
    """Per-step default timeout in seconds."""

    global_timeout: float | None = None
    """Optional workflow-level timeout in seconds. None = unlimited."""

    grace_period: float = 5.0
    """Seconds between SIGTERM and SIGKILL when terminating a subprocess."""


@dataclass
class TimeoutManager:
    """Tracks per-step and global timeouts for a PEV execution run."""

    config: TimeoutConfig = field(default_factory=TimeoutConfig)
    _workflow_start: float | None = field(default=None, init=False, repr=False)

    def start_workflow(self) -> None:
        """Record the workflow start time. Call once before the first step."""
        self._workflow_start = time.monotonic()

    def get_step_timeout(self, step: Any) -> float:
        """Return the effective timeout for a given step in seconds.

        Resolution order:
        1. ``step.params["timeout"]`` if present and positive
        2. ``config.step_timeout`` default
        3. Capped by remaining global time (if global_timeout is set)

        Args:
            step: A RecipeStep instance with a ``params`` dict.

        Returns:
            Positive float: seconds the step is allowed to run.

        """
        raw: float = float(step.params.get("timeout") or self.config.step_timeout)
        if raw <= 0:
            raw = self.config.step_timeout

        remaining = self.remaining_global()
        if remaining is not None:
            return min(raw, remaining)
        return raw

    def check_global_timeout(self) -> None:
        """Raise GlobalTimeoutError if the workflow has exceeded its limit.

        Does nothing when no global timeout is configured or workflow has not
        been started yet.

        Raises:
            GlobalTimeoutError: When elapsed time exceeds ``config.global_timeout``.

        """
        if self.config.global_timeout is None or self._workflow_start is None:
            return
        elapsed = time.monotonic() - self._workflow_start
        if elapsed >= self.config.global_timeout:
            raise GlobalTimeoutError(
                f"Global timeout of {self.config.global_timeout}s exceeded "
                f"(elapsed {elapsed:.1f}s)",
                elapsed=elapsed,
                limit=self.config.global_timeout,
            )

    def remaining_global(self) -> float | None:
        """Return seconds remaining under the global timeout, or None.

        Returns:
            Positive float if global timeout is active and time remains,
            0.0 if already expired,
            None if no global timeout is configured or workflow not started.

        """
        if self.config.global_timeout is None or self._workflow_start is None:
            return None
        elapsed = time.monotonic() - self._workflow_start
        return max(0.0, self.config.global_timeout - elapsed)


__all__ = [
    "GlobalTimeoutError",
    "StepTimeoutError",
    "TimeoutConfig",
    "TimeoutManager",
]
