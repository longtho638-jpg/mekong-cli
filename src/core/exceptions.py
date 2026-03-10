"""Mekong CLI - Custom Exceptions.

Structured error types for the Plan-Execute-Verify engine.
"""

from __future__ import annotations

from typing import Any


class MekongError(Exception):
    """Base exception for all Mekong CLI errors."""


class PlanningError(MekongError):
    """Raised when task planning/decomposition fails."""


class ExecutionError(MekongError):
    """Raised when step execution fails."""

    def __init__(self, message: str, step_order: int = 0, exit_code: int = 1) -> None:
        """Initialize ExecutionError with step context.

        Args:
            message: Human-readable error description.
            step_order: The order index of the failed step.
            exit_code: Process exit code from the failed execution.

        """
        self.step_order = step_order
        self.exit_code = exit_code
        super().__init__(message)


class VerificationError(MekongError):
    """Raised when verification criteria are not met."""

    def __init__(self, message: str, failed_checks: list[Any] | None = None) -> None:
        """Initialize VerificationError with failed check details.

        Args:
            message: Human-readable error description.
            failed_checks: List of verification checks that did not pass.

        """
        self.failed_checks = failed_checks or []
        super().__init__(message)


class RollbackError(MekongError):
    """Raised when rollback of a failed step fails."""

    def __init__(self, message: str, original_error: Exception | None = None) -> None:
        """Initialize RollbackError with the original cause.

        Args:
            message: Human-readable error description.
            original_error: The exception that triggered the rollback attempt.

        """
        self.original_error = original_error
        super().__init__(message)


class LLMClientError(MekongError):
    """Raised when LLM client encounters an error."""


class RecipeParseError(MekongError):
    """Raised when recipe markdown parsing fails."""


class AgentError(MekongError):
    """Raised when an agent operation fails."""

    def __init__(self, message: str, agent_name: str = "") -> None:
        """Initialize AgentError with the responsible agent's name.

        Args:
            message: Human-readable error description.
            agent_name: Name of the agent that encountered the error.

        """
        self.agent_name = agent_name
        super().__init__(message)


__all__ = [
    "AgentError",
    "ExecutionError",
    "LLMClientError",
    "MekongError",
    "PlanningError",
    "RecipeParseError",
    "RollbackError",
    "VerificationError",
]
