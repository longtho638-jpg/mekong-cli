"""Mekong CLI - Circuit Breaker Pattern.

Protects external service calls (LLM, API, webhooks) from cascading failures.
States: CLOSED (normal) → OPEN (failing, reject fast) → HALF_OPEN (probe).

Usage:
    breaker = CircuitBreaker("llm-service", failure_threshold=3, recovery_timeout=30.0)
    result = breaker.call(lambda: llm_client.generate("prompt"))
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass
from enum import Enum
from typing import Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitOpenError(Exception):
    """Raised when circuit is open and call is rejected."""

    def __init__(self, service_name: str, retry_after: float) -> None:
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(
            f"Circuit open for '{service_name}', retry after {retry_after:.1f}s"
        )


@dataclass
class CircuitStats:
    """Statistics for a circuit breaker instance."""

    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    rejected_calls: int = 0
    last_failure_time: float = 0.0
    last_success_time: float = 0.0
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    state_changes: int = 0


class CircuitBreaker:
    """Circuit breaker for external service calls.

    Tracks consecutive failures. When threshold is reached, opens the circuit
    and rejects calls fast for `recovery_timeout` seconds. After timeout,
    allows one probe call (HALF_OPEN). If probe succeeds, circuit closes.

    Args:
        service_name: Name for logging/metrics
        failure_threshold: Consecutive failures before opening (default: 3)
        recovery_timeout: Seconds to wait before probe (default: 30.0)
        success_threshold: Consecutive successes in HALF_OPEN to close (default: 1)
        excluded_exceptions: Exception types that don't count as failures
    """

    def __init__(
        self,
        service_name: str,
        failure_threshold: int = 3,
        recovery_timeout: float = 30.0,
        success_threshold: int = 1,
        excluded_exceptions: tuple[type[Exception], ...] | None = None,
    ) -> None:
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.excluded_exceptions = excluded_exceptions or ()

        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._lock = threading.Lock()
        self._opened_at: float = 0.0

    @property
    def state(self) -> CircuitState:
        """Current circuit state, auto-transitions OPEN → HALF_OPEN on timeout."""
        with self._lock:
            if self._state == CircuitState.OPEN:
                if time.time() - self._opened_at >= self.recovery_timeout:
                    self._transition(CircuitState.HALF_OPEN)
            return self._state

    @property
    def stats(self) -> CircuitStats:
        """Copy of current stats."""
        with self._lock:
            return CircuitStats(
                total_calls=self._stats.total_calls,
                successful_calls=self._stats.successful_calls,
                failed_calls=self._stats.failed_calls,
                rejected_calls=self._stats.rejected_calls,
                last_failure_time=self._stats.last_failure_time,
                last_success_time=self._stats.last_success_time,
                consecutive_failures=self._stats.consecutive_failures,
                consecutive_successes=self._stats.consecutive_successes,
                state_changes=self._stats.state_changes,
            )

    def call(self, func: Callable[[], T], fallback: Callable[[], T] | None = None) -> T:
        """Execute function through circuit breaker.

        Args:
            func: Callable to protect
            fallback: Optional fallback when circuit is open

        Returns:
            Result from func() or fallback()

        Raises:
            CircuitOpenError: When circuit is open and no fallback provided
        """
        current_state = self.state

        if current_state == CircuitState.OPEN:
            self._stats.rejected_calls += 1
            retry_after = self.recovery_timeout - (time.time() - self._opened_at)
            if fallback is not None:
                logger.info("Circuit open for '%s', using fallback", self.service_name)
                return fallback()
            raise CircuitOpenError(self.service_name, max(0, retry_after))

        with self._lock:
            self._stats.total_calls += 1

        try:
            result = func()
            self._on_success()
            return result
        except Exception as exc:
            if isinstance(exc, self.excluded_exceptions):
                self._on_success()
                raise
            self._on_failure()
            raise

    def _on_success(self) -> None:
        """Record successful call."""
        with self._lock:
            self._stats.successful_calls += 1
            self._stats.consecutive_failures = 0
            self._stats.consecutive_successes += 1
            self._stats.last_success_time = time.time()

            if self._state == CircuitState.HALF_OPEN:
                if self._stats.consecutive_successes >= self.success_threshold:
                    self._transition(CircuitState.CLOSED)

    def _on_failure(self) -> None:
        """Record failed call."""
        with self._lock:
            self._stats.failed_calls += 1
            self._stats.consecutive_failures += 1
            self._stats.consecutive_successes = 0
            self._stats.last_failure_time = time.time()

            if self._state == CircuitState.HALF_OPEN:
                self._transition(CircuitState.OPEN)
            elif self._stats.consecutive_failures >= self.failure_threshold:
                self._transition(CircuitState.OPEN)

    def _transition(self, new_state: CircuitState) -> None:
        """Transition to new state (must hold lock)."""
        old_state = self._state
        self._state = new_state
        self._stats.state_changes += 1

        if new_state == CircuitState.OPEN:
            self._opened_at = time.time()
        elif new_state == CircuitState.CLOSED:
            self._stats.consecutive_failures = 0

        logger.info(
            "Circuit '%s': %s → %s",
            self.service_name, old_state.value, new_state.value,
        )

    def reset(self) -> None:
        """Manually reset circuit to CLOSED."""
        with self._lock:
            self._transition(CircuitState.CLOSED)
            self._stats.consecutive_failures = 0
            self._stats.consecutive_successes = 0


# Registry for managing multiple breakers
_breakers: dict[str, CircuitBreaker] = {}
_registry_lock = threading.Lock()


def get_circuit_breaker(
    service_name: str,
    failure_threshold: int = 3,
    recovery_timeout: float = 30.0,
) -> CircuitBreaker:
    """Get or create a named circuit breaker."""
    with _registry_lock:
        if service_name not in _breakers:
            _breakers[service_name] = CircuitBreaker(
                service_name=service_name,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
            )
        return _breakers[service_name]


def reset_all_breakers() -> None:
    """Reset all circuit breakers (for testing)."""
    with _registry_lock:
        _breakers.clear()


__all__ = [
    "CircuitBreaker",
    "CircuitOpenError",
    "CircuitState",
    "CircuitStats",
    "get_circuit_breaker",
    "reset_all_breakers",
]
