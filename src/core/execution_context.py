"""Mekong CLI - Execution Context.

Shared state container passed between steps in the PEV engine.
Enables step N output to be forwarded to step N+1.
Thread-safe for DAG parallel execution.
"""

from __future__ import annotations

import copy
import threading
from typing import Any

# Max bytes stored per step output (prevents unbounded memory growth)
_MAX_STEP_OUTPUT_BYTES = 10_240  # 10 KB


class ExecutionContext:
    """Thread-safe shared state container for step execution.

    Stores arbitrary key-value data, step outputs, and env var overrides.
    All mutations are guarded by a single threading.Lock.
    """

    def __init__(self) -> None:
        """Initialize an empty execution context."""
        self._data: dict[str, Any] = {}
        self._step_outputs: dict[int, str] = {}
        self._env: dict[str, str] = {}
        self._lock = threading.Lock()

    # --- Generic key/value store ---

    def set(self, key: str, value: Any) -> None:
        """Store an arbitrary value under key.

        Args:
            key: Lookup key.
            value: Any serialisable value.

        """
        with self._lock:
            self._data[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Retrieve a value by key.

        Args:
            key: Lookup key.
            default: Returned when key is absent.

        Returns:
            Stored value or default.

        """
        with self._lock:
            return self._data.get(key, default)

    # --- Step output storage ---

    def record_step_output(self, step_order: int, stdout: str) -> None:
        """Persist stdout from a completed step.

        Output is truncated to 10 KB to prevent unbounded memory growth.

        Args:
            step_order: Zero-based step index.
            stdout: Combined stdout captured from the step.

        """
        if len(stdout) > _MAX_STEP_OUTPUT_BYTES:
            stdout = stdout[:_MAX_STEP_OUTPUT_BYTES]
        with self._lock:
            self._step_outputs[step_order] = stdout

    def get_step_output(self, step_order: int) -> str | None:
        """Retrieve stdout captured from a prior step.

        Args:
            step_order: Zero-based step index.

        Returns:
            Captured stdout string, or None if step not recorded.

        """
        with self._lock:
            return self._step_outputs.get(step_order)

    # --- Environment variable overrides ---

    def set_env(self, key: str, value: str) -> None:
        """Override or set an environment variable for subsequent steps.

        Args:
            key: Environment variable name.
            value: String value.

        """
        with self._lock:
            self._env[key] = value

    def get_env(self, key: str) -> str | None:
        """Retrieve an env var override.

        Args:
            key: Environment variable name.

        Returns:
            String value, or None if not set.

        """
        with self._lock:
            return self._env.get(key)

    # --- Snapshot ---

    def snapshot(self) -> dict[str, Any]:
        """Return a deep-copied, read-only view of current state.

        Mutations to the returned dict do not affect this context.

        Returns:
            Dict with keys 'data', 'step_outputs', 'env'.

        """
        with self._lock:
            return {
                "data": copy.deepcopy(self._data),
                "step_outputs": copy.deepcopy(self._step_outputs),
                "env": copy.deepcopy(self._env),
            }

    def clear(self) -> None:
        """Reset all stored state. Useful between recipe runs."""
        with self._lock:
            self._data.clear()
            self._step_outputs.clear()
            self._env.clear()


__all__ = ["ExecutionContext"]
