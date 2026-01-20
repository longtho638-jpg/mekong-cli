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
from antigravity.core.control.circuit_metrics import CircuitMetrics
from antigravity.core.control.circuit_states import CircuitBreakerError, CircuitState
from typing import Callable, Type, TypeVar

logger = logging.getLogger(__name__)

# TypeVar for preserving return type of wrapped functions
T = TypeVar("T")


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
        self.expected_exception = expected_exception
        self.state = CircuitState.CLOSED
        self.lock = threading.Lock()

        # Delegate metrics tracking
        self.metrics = CircuitMetrics(
            failure_threshold=failure_threshold,
            timeout=timeout,
            success_threshold=success_threshold,
        )

        logger.info(
            f"CircuitBreaker initialized: failure_threshold={failure_threshold}, "
            f"timeout={timeout}s, success_threshold={success_threshold}"
        )

    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
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
                if self.metrics.should_attempt_reset():
                    logger.info("Circuit transitioning to HALF_OPEN for recovery attempt")
                    self.state = CircuitState.HALF_OPEN
                else:
                    raise CircuitBreakerError(
                        f"Circuit breaker is OPEN (failures={self.metrics.failure_count}, "
                        f"timeout in {self.metrics.time_until_retry()}s)"
                    )

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
            new_state = self.metrics.record_success(self.state)
            self.state = new_state

    def _on_failure(self):
        """Handle failed execution."""
        with self.lock:
            new_state = self.metrics.record_failure(self.state)
            self.state = new_state

    def get_state(self) -> CircuitState:
        """Get current circuit state."""
        return self.state

    def get_stats(self) -> dict:
        """Get circuit breaker statistics."""
        with self.lock:
            return self.metrics.get_stats(self.state)

    def reset(self):
        """Manually reset circuit breaker to CLOSED state."""
        with self.lock:
            logger.info("Manual circuit breaker reset triggered")
            self.metrics.reset()
            self.state = CircuitState.CLOSED

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
                if self.metrics.should_attempt_reset():
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

    # Expose thresholds for backward compatibility
    @property
    def failure_threshold(self) -> int:
        return self.metrics.failure_threshold

    @property
    def timeout(self) -> int:
        return self.metrics.timeout

    @property
    def success_threshold(self) -> int:
        return self.metrics.success_threshold

    @property
    def failure_count(self) -> int:
        return self.metrics.failure_count

    @property
    def success_count(self) -> int:
        return self.metrics.success_count


__all__ = ["CircuitBreaker", "CircuitState", "CircuitBreakerError"]
