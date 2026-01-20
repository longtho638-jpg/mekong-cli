"""
Circuit Breaker Metrics - Failure Tracking
==========================================

Handles failure/success counting and state transition logic.
"""

import logging
from antigravity.core.control.circuit_states import CircuitState
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


class CircuitMetrics:
    """
    Tracks circuit breaker metrics and determines state transitions.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        success_threshold: int = 2,
    ):
        """
        Initialize metrics tracker.

        Args:
            failure_threshold: Number of failures before opening circuit
            timeout: Seconds to wait before attempting recovery
            success_threshold: Successful calls needed to close circuit from half-open
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.success_threshold = success_threshold

        # Counters
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None

    def record_failure(self, current_state: CircuitState) -> CircuitState:
        """
        Record a failure and return new state.

        Args:
            current_state: Current circuit state

        Returns:
            New circuit state after recording failure
        """
        self.failure_count += 1
        self.success_count = 0
        self.last_failure_time = datetime.now()

        logger.warning(
            f"Circuit breaker failure {self.failure_count}/{self.failure_threshold} "
            f"(state={current_state.value})"
        )

        # Check if we should open the circuit
        if self.failure_count >= self.failure_threshold:
            if current_state != CircuitState.OPEN:
                logger.error(
                    f"Circuit breaker OPENING after {self.failure_count} failures "
                    f"(timeout={self.timeout}s)"
                )
                return CircuitState.OPEN

        return current_state

    def record_success(self, current_state: CircuitState) -> CircuitState:
        """
        Record a success and return new state.

        Args:
            current_state: Current circuit state

        Returns:
            New circuit state after recording success
        """
        self.success_count += 1

        if current_state == CircuitState.HALF_OPEN:
            if self.success_count >= self.success_threshold:
                logger.info(f"Circuit closing after {self.success_count} successful calls")
                self.reset()
                return CircuitState.CLOSED

        elif current_state == CircuitState.CLOSED:
            if self.failure_count > 0:
                logger.debug("Resetting failure count after successful call")
                self.failure_count = 0

        return current_state

    def should_attempt_reset(self) -> bool:
        """
        Check if timeout has passed and we should attempt recovery.

        Returns:
            True if we should attempt reset
        """
        if not self.last_failure_time:
            return False

        elapsed = datetime.now() - self.last_failure_time
        return elapsed > timedelta(seconds=self.timeout)

    def time_until_retry(self) -> int:
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

    def reset(self):
        """Reset all metrics."""
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        logger.info("Circuit breaker metrics reset")

    def get_stats(self, current_state: CircuitState) -> dict:
        """
        Get current metrics.

        Args:
            current_state: Current circuit state

        Returns:
            Dictionary with current stats
        """
        return {
            "state": current_state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "failure_threshold": self.failure_threshold,
            "success_threshold": self.success_threshold,
            "timeout": self.timeout,
            "time_until_retry": self.time_until_retry() if current_state == CircuitState.OPEN else 0,
        }
