"""
Mekong CLI - Retry Policy Engine

Temporal-inspired configurable retry policies with exponential backoff,
jitter, and non-retryable error classification.

Maps to Temporal's RetryPolicy: initial_interval, backoff_coefficient,
max_interval, max_attempts, non_retryable_error_types.
"""

import random
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, List, Optional


class BackoffStrategy(str, Enum):
    """Backoff strategies for retry delays."""

    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    FULL_JITTER = "full_jitter"
    EQUAL_JITTER = "equal_jitter"


@dataclass
class RetryPolicy:
    """
    Configurable retry policy inspired by Temporal's RetryPolicy.

    Defaults mirror Temporal: exponential backoff, 1s initial, 100x max, unlimited attempts.
    """

    max_attempts: int = 3
    initial_interval_seconds: float = 1.0
    backoff_coefficient: float = 2.0
    max_interval_seconds: float = 60.0
    strategy: BackoffStrategy = BackoffStrategy.FULL_JITTER
    non_retryable_errors: List[str] = field(default_factory=list)
    non_retryable_exit_codes: List[int] = field(default_factory=lambda: [2])

    def compute_delay(self, attempt: int) -> float:
        """Calculate delay before next retry attempt.

        Args:
            attempt: Current attempt number (1-based, so attempt=1 means first retry)

        Returns:
            Delay in seconds before the next retry
        """
        base = min(
            self.initial_interval_seconds * (self.backoff_coefficient ** attempt),
            self.max_interval_seconds,
        )

        if self.strategy == BackoffStrategy.FIXED:
            return self.initial_interval_seconds
        elif self.strategy == BackoffStrategy.EXPONENTIAL:
            return base
        elif self.strategy == BackoffStrategy.FULL_JITTER:
            return random.uniform(0, base)
        elif self.strategy == BackoffStrategy.EQUAL_JITTER:
            half = base / 2
            return half + random.uniform(0, half)
        return base

    def is_retryable(self, error_msg: str, exit_code: int = 1) -> bool:
        """Check if an error should be retried based on policy.

        Args:
            error_msg: Error message or stderr output
            exit_code: Process exit code

        Returns:
            True if the error is eligible for retry
        """
        if exit_code in self.non_retryable_exit_codes:
            return False
        error_lower = error_msg.lower()
        for pattern in self.non_retryable_errors:
            if pattern.lower() in error_lower:
                return False
        return True

    def should_retry(self, attempt: int, error_msg: str, exit_code: int = 1) -> bool:
        """Determine if a retry should be attempted.

        Args:
            attempt: Current attempt number (0-based)
            error_msg: Error message from the failed execution
            exit_code: Process exit code

        Returns:
            True if retry should proceed
        """
        if attempt >= self.max_attempts:
            return False
        return self.is_retryable(error_msg, exit_code)


def execute_with_retry(
    func: Callable[[], object],
    policy: Optional[RetryPolicy] = None,
    on_retry: Optional[Callable[[int, float, str], None]] = None,
) -> object:
    """Execute a callable with retry policy.

    Args:
        func: Callable that returns result or raises exception
        policy: Retry policy (uses default if None)
        on_retry: Callback(attempt, delay, error_msg) called before each retry

    Returns:
        Result from successful func() call

    Raises:
        Last exception if all retries exhausted
    """
    policy = policy or RetryPolicy()
    last_error: Optional[Exception] = None

    for attempt in range(policy.max_attempts):
        try:
            return func()
        except Exception as e:
            last_error = e
            error_msg = str(e)

            if not policy.should_retry(attempt + 1, error_msg):
                raise

            delay = policy.compute_delay(attempt)
            if on_retry:
                on_retry(attempt + 1, delay, error_msg)
            time.sleep(delay)

    if last_error:
        raise last_error
    return None


# Pre-configured policies for common scenarios
AGGRESSIVE_RETRY = RetryPolicy(
    max_attempts=5,
    initial_interval_seconds=0.5,
    backoff_coefficient=1.5,
    strategy=BackoffStrategy.FULL_JITTER,
)

CONSERVATIVE_RETRY = RetryPolicy(
    max_attempts=2,
    initial_interval_seconds=2.0,
    backoff_coefficient=3.0,
    max_interval_seconds=30.0,
    strategy=BackoffStrategy.EQUAL_JITTER,
)

LLM_RETRY = RetryPolicy(
    max_attempts=3,
    initial_interval_seconds=1.0,
    backoff_coefficient=2.0,
    max_interval_seconds=30.0,
    strategy=BackoffStrategy.FULL_JITTER,
    non_retryable_errors=["invalid_api_key", "authentication", "forbidden"],
)

NO_RETRY = RetryPolicy(max_attempts=1)


__all__ = [
    "BackoffStrategy",
    "RetryPolicy",
    "execute_with_retry",
    "AGGRESSIVE_RETRY",
    "CONSERVATIVE_RETRY",
    "LLM_RETRY",
    "NO_RETRY",
]
