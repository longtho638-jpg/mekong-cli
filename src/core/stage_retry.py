"""Mekong CLI - Stage Retry with Exponential Backoff.

Wraps pipeline stage execution with configurable retry logic.
Integrates with RetryPolicy, CircuitBreaker, and PipelineCheckpoint.

Usage:
    retry = StageRetryExecutor(policy=RetryPolicy(max_attempts=3))
    result = retry.execute_stage(stage_func, stage_index=0, stage_name="build")
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Callable, TypeVar

from src.core.circuit_breaker import CircuitBreaker, CircuitOpenError
from src.core.retry_policy import RetryPolicy

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class StageAttempt:
    """Record of a single stage execution attempt."""

    attempt_number: int
    started_at: float
    duration_ms: float = 0.0
    success: bool = False
    error: str | None = None


@dataclass
class StageRetryResult:
    """Result of executing a stage with retries.

    Attributes:
        stage_index: Index of the pipeline stage
        stage_name: Human-readable stage name
        success: Whether the stage ultimately succeeded
        result: Return value from successful execution
        attempts: List of all attempts made
        total_attempts: Number of attempts made
        total_duration_ms: Total time spent across all attempts
        final_error: Error from the last failed attempt
    """

    stage_index: int
    stage_name: str
    success: bool = False
    result: Any = None
    attempts: list[StageAttempt] = field(default_factory=list)
    total_attempts: int = 0
    total_duration_ms: float = 0.0
    final_error: str | None = None


class StageRetryExecutor:
    """Execute pipeline stages with retry and circuit breaker support.

    Args:
        policy: Retry policy for backoff configuration
        circuit_breaker: Optional circuit breaker for external calls
        on_retry: Callback(stage_index, attempt, delay, error) before retry
    """

    def __init__(
        self,
        policy: RetryPolicy | None = None,
        circuit_breaker: CircuitBreaker | None = None,
        on_retry: Callable[[int, int, float, str], None] | None = None,
    ) -> None:
        self.policy = policy or RetryPolicy()
        self.circuit_breaker = circuit_breaker
        self.on_retry = on_retry

    def execute_stage(
        self,
        func: Callable[[], T],
        stage_index: int = 0,
        stage_name: str = "",
    ) -> StageRetryResult:
        """Execute a stage function with retry logic.

        Args:
            func: Callable that performs the stage work
            stage_index: Pipeline stage index
            stage_name: Human-readable name for logging

        Returns:
            StageRetryResult with success/failure details
        """
        result = StageRetryResult(
            stage_index=stage_index,
            stage_name=stage_name or f"stage-{stage_index}",
        )
        overall_start = time.time()

        for attempt_num in range(self.policy.max_attempts):
            attempt = StageAttempt(
                attempt_number=attempt_num + 1,
                started_at=time.time(),
            )

            try:
                # Execute through circuit breaker if configured
                if self.circuit_breaker:
                    stage_result = self.circuit_breaker.call(func)
                else:
                    stage_result = func()

                attempt.duration_ms = (time.time() - attempt.started_at) * 1000
                attempt.success = True
                result.attempts.append(attempt)
                result.success = True
                result.result = stage_result
                result.total_attempts = attempt_num + 1
                result.total_duration_ms = (time.time() - overall_start) * 1000

                if attempt_num > 0:
                    logger.info(
                        "Stage '%s' succeeded on attempt %d",
                        result.stage_name, attempt_num + 1,
                    )
                return result

            except CircuitOpenError as e:
                # Circuit is open — don't retry, fail immediately
                attempt.duration_ms = (time.time() - attempt.started_at) * 1000
                attempt.error = str(e)
                result.attempts.append(attempt)
                result.final_error = str(e)
                result.total_attempts = attempt_num + 1
                result.total_duration_ms = (time.time() - overall_start) * 1000
                logger.warning(
                    "Stage '%s' blocked by circuit breaker: %s",
                    result.stage_name, e,
                )
                return result

            except Exception as e:
                error_msg = str(e)
                attempt.duration_ms = (time.time() - attempt.started_at) * 1000
                attempt.error = error_msg
                result.attempts.append(attempt)

                # Check if should retry
                if not self.policy.should_retry(attempt_num + 1, error_msg):
                    result.final_error = error_msg
                    result.total_attempts = attempt_num + 1
                    result.total_duration_ms = (time.time() - overall_start) * 1000
                    logger.warning(
                        "Stage '%s' failed (non-retryable): %s",
                        result.stage_name, error_msg,
                    )
                    return result

                # Calculate delay and wait
                delay = self.policy.compute_delay(attempt_num)
                logger.info(
                    "Stage '%s' attempt %d/%d failed, retrying in %.1fs: %s",
                    result.stage_name,
                    attempt_num + 1,
                    self.policy.max_attempts,
                    delay,
                    error_msg[:100],
                )

                if self.on_retry:
                    self.on_retry(stage_index, attempt_num + 1, delay, error_msg)

                time.sleep(delay)

        # All attempts exhausted
        result.total_attempts = self.policy.max_attempts
        result.total_duration_ms = (time.time() - overall_start) * 1000
        if result.attempts:
            result.final_error = result.attempts[-1].error
        logger.error(
            "Stage '%s' exhausted %d attempts",
            result.stage_name, self.policy.max_attempts,
        )
        return result


def execute_stage_with_retry(
    func: Callable[[], T],
    policy: RetryPolicy | None = None,
    circuit_breaker: CircuitBreaker | None = None,
    stage_index: int = 0,
    stage_name: str = "",
) -> StageRetryResult:
    """Convenience function for one-off stage retry execution."""
    executor = StageRetryExecutor(
        policy=policy,
        circuit_breaker=circuit_breaker,
    )
    return executor.execute_stage(func, stage_index, stage_name)


__all__ = [
    "StageAttempt",
    "StageRetryExecutor",
    "StageRetryResult",
    "execute_stage_with_retry",
]
