"""
Circuit Breaker - Fault Tolerance Pattern
==========================================

Implements the circuit breaker pattern for:
- Automatic failure detection
- Service protection during outages
- Exponential backoff recovery
- Thread-safe state management
"""

import logging
import threading
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Optional, Type

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation, requests pass through
    OPEN = "open"  # Blocking all requests due to failures
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerError(Exception):
    """Raised when circuit breaker is OPEN."""

    pass


class CircuitBreaker:
    """
    Circuit breaker pattern for fault tolerance.

    Prevents cascading failures by stopping requests to failing services.
    Automatically attempts recovery after a timeout period.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        success_threshold: int = 2,
        expected_exception: Type[Exception] = Exception,
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            timeout: Seconds to wait before attempting recovery
            success_threshold: Successful calls needed to close circuit from half-open
            expected_exception: Exception type to catch and count as failure
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold
        self.expected_exception = expected_exception

        # State tracking
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED

        # Thread safety
        self.lock = threading.Lock()

        logger.info(
            f"CircuitBreaker initialized: failure_threshold={failure_threshold}, "
            f"timeout={timeout}s, success_threshold={success_threshold}"
        )

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments

        Returns:
            Function result

        Raises:
            CircuitBreakerError: If circuit is OPEN
            Exception: If function raises expected_exception
        """
        with self.lock:
            if self.state == CircuitState.OPEN:
                # Check if we should attempt recovery
                if self._should_attempt_reset():
                    logger.info("Circuit transitioning to HALF_OPEN for recovery attempt")
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise CircuitBreakerError(
                        f"Circuit breaker is OPEN (failures={self.failure_count}, "
                        f"timeout in {self._time_until_retry()}s)"
                    )

        # Execute function outside lock to prevent blocking
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result

        except self.expected_exception as e:
            self._on_failure()
            raise e

    def _on_success(self):
        """Handle successful execution."""
        with self.lock:
            self.success_count += 1

            if self.state == CircuitState.HALF_OPEN:
                # Check if we've had enough successes to close circuit
                if self.success_count >= self.success_threshold:
                    logger.info(f"Circuit closing after {self.success_count} successful calls")
                    self._reset()
            elif self.state == CircuitState.CLOSED:
                # Reset failure count on success
                if self.failure_count > 0:
                    logger.debug("Resetting failure count after successful call")
                    self.failure_count = 0

    def _on_failure(self):
        """Handle failed execution."""
        with self.lock:
            self.failure_count += 1
            self.success_count = 0  # Reset success count
            self.last_failure_time = datetime.now()

            logger.warning(
                f"Circuit breaker failure {self.failure_count}/{self.failure_threshold} "
                f"(state={self.state.value})"
            )

            # Check if we should open the circuit
            if self.failure_count >= self.failure_threshold:
                if self.state != CircuitState.OPEN:
                    logger.error(
                        f"Circuit breaker OPENING after {self.failure_count} failures "
                        f"(timeout={self.timeout}s)"
                    )
                    self.state = CircuitState.OPEN

    def _should_attempt_reset(self) -> bool:
        """
        Check if timeout has passed and we should attempt recovery.

        Returns:
            True if we should attempt reset
        """
        if not self.last_failure_time:
            return False

        elapsed = datetime.now() - self.last_failure_time
        return elapsed > timedelta(seconds=self.timeout)

    def _time_until_retry(self) -> int:
        """
        Calculate seconds until next retry attempt.

        Returns:
            Seconds until retry
        """
        if not self.last_failure_time:
            return 0

        elapsed = datetime.now() - self.last_failure_time
        remaining = timedelta(seconds=self.timeout) - elapsed
        return max(0, int(remaining.total_seconds()))

    def _reset(self):
        """Reset circuit breaker to CLOSED state."""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        logger.info("Circuit breaker CLOSED - normal operation resumed")

    def get_state(self) -> CircuitState:
        """Get current circuit state."""
        return self.state

    def get_stats(self) -> dict:
        """
        Get circuit breaker statistics.

        Returns:
            Dictionary with current stats
        """
        with self.lock:
            return {
                "state": self.state.value,
                "failure_count": self.failure_count,
                "success_count": self.success_count,
                "failure_threshold": self.failure_threshold,
                "success_threshold": self.success_threshold,
                "timeout": self.timeout,
                "time_until_retry": self._time_until_retry() if self.state == CircuitState.OPEN else 0,
            }

    def reset(self):
        """Manually reset circuit breaker to CLOSED state."""
        with self.lock:
            logger.info("Manual circuit breaker reset triggered")
            self._reset()

    # Manual Control Methods (for ControlCenter integration)
    def can_execute(self) -> bool:
        """
        Check if execution is allowed.
        Transitions to HALF_OPEN if timeout has passed.
        """
        with self.lock:
            if self.state == CircuitState.CLOSED:
                return True

            if self.state == CircuitState.HALF_OPEN:
                return True

            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    logger.info("Circuit transitioning to HALF_OPEN for recovery attempt")
                    self.state = CircuitState.HALF_OPEN
                    return True
                return False

            return False

    def record_failure(self):
        """Record a failure manually."""
        self._on_failure()

    def record_success(self):
        """Record a success manually."""
        self._on_success()


__all__ = ["CircuitBreaker", "CircuitState", "CircuitBreakerError"]
