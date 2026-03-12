"""Mekong CLI - Assertion Engine.

Assertion-based validation framework for the VERIFY phase of PEV Engine.
Provides composable, named assertions that can be registered and run against
execution results.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, List, Optional

from .verifier import ExecutionResult


class AssertionSeverity(Enum):
    """Severity level for failed assertions."""

    ERROR = "error"
    WARNING = "warning"


@dataclass
class Assertion:
    """Defines a single named assertion.

    Attributes:
        name: Unique identifier for this assertion.
        check_fn: Callable that receives ExecutionResult and returns bool.
        message: Human-readable description of what is being asserted.
        severity: ERROR causes hard failure; WARNING is advisory.

    """

    name: str
    check_fn: Callable[[ExecutionResult], bool]
    message: str
    severity: AssertionSeverity = AssertionSeverity.ERROR


@dataclass
class AssertionResult:
    """Result of running a single assertion.

    Attributes:
        passed: Whether the assertion passed.
        assertion: The Assertion that was evaluated.
        actual_value: The value observed during evaluation (optional).
        message: Override message or additional context.

    """

    passed: bool
    assertion: Assertion
    actual_value: Optional[Any] = None
    message: str = ""

    def __post_init__(self) -> None:
        """Use assertion message if no override provided."""
        if not self.message:
            self.message = self.assertion.message


class AssertionEngine:
    """Runs named assertions against execution results.

    Supports built-in assertions and custom registration.
    """

    def __init__(self) -> None:
        """Initialize engine with built-in assertions pre-registered."""
        self._assertions: dict[str, Assertion] = {}
        self._register_builtins()

    def _register_builtins(self) -> None:
        """Register built-in assertion set."""
        self.register_assertion(Assertion(
            name="exit_code_zero",
            check_fn=lambda r: r.exit_code == 0,
            message="Exit code must be 0",
            severity=AssertionSeverity.ERROR,
        ))
        self.register_assertion(Assertion(
            name="no_stderr",
            check_fn=lambda r: not r.stderr.strip(),
            message="Stderr must be empty",
            severity=AssertionSeverity.WARNING,
        ))
        self.register_assertion(Assertion(
            name="output_not_empty",
            check_fn=lambda r: bool(r.stdout.strip()),
            message="Stdout must not be empty",
            severity=AssertionSeverity.WARNING,
        ))
        self.register_assertion(Assertion(
            name="no_timeout",
            check_fn=lambda r: not (
                r.error is not None
                and (
                    "timeout" in str(r.error).lower()
                    or "timeout" in type(r.error).__name__.lower()
                )
            ),
            message="Execution must not have timed out",
            severity=AssertionSeverity.ERROR,
        ))
        self.register_assertion(Assertion(
            name="no_exception",
            check_fn=lambda r: r.error is None,
            message="Execution must not raise an exception",
            severity=AssertionSeverity.ERROR,
        ))

    def register_assertion(self, assertion: Assertion) -> None:
        """Register an assertion by name (overwrites existing).

        Args:
            assertion: Assertion to register.

        """
        self._assertions[assertion.name] = assertion

    def get_assertion(self, name: str) -> Optional[Assertion]:
        """Retrieve a registered assertion by name.

        Args:
            name: Assertion name.

        Returns:
            Assertion if found, else None.

        """
        return self._assertions.get(name)

    def run_assertions(
        self,
        execution_result: ExecutionResult,
        names: Optional[List[str]] = None,
    ) -> List[AssertionResult]:
        """Run assertions against an execution result.

        Args:
            execution_result: The result to validate.
            names: Optional subset of assertion names to run.
                   If None, runs all registered assertions.

        Returns:
            List of AssertionResult in registration order.

        """
        targets = (
            [self._assertions[n] for n in names if n in self._assertions]
            if names is not None
            else list(self._assertions.values())
        )

        results: List[AssertionResult] = []
        for assertion in targets:
            try:
                passed = assertion.check_fn(execution_result)
                actual = execution_result.exit_code if "exit_code" in assertion.name else None
                results.append(AssertionResult(
                    passed=passed,
                    assertion=assertion,
                    actual_value=actual,
                ))
            except Exception as exc:  # noqa: BLE001
                results.append(AssertionResult(
                    passed=False,
                    assertion=assertion,
                    message=f"Assertion raised exception: {exc}",
                ))

        return results

    def all_passed(self, results: List[AssertionResult]) -> bool:
        """Return True only if all ERROR-severity assertions passed.

        Args:
            results: List of AssertionResult from run_assertions.

        Returns:
            True if no ERROR-severity assertion failed.

        """
        return all(
            r.passed
            for r in results
            if r.assertion.severity == AssertionSeverity.ERROR
        )

    @property
    def registered_names(self) -> List[str]:
        """Return list of all registered assertion names."""
        return list(self._assertions.keys())


__all__ = [
    "Assertion",
    "AssertionEngine",
    "AssertionResult",
    "AssertionSeverity",
]
