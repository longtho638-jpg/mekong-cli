"""
Circuit Breaker — State machine for fault tolerance.

States: CLOSED (normal) → OPEN (tripped) → HALF_OPEN (testing)

Usage:
  breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=300)
  if breaker.allow_request():
      try:
          result = risky_operation()
          breaker.on_success()
      except Exception as e:
          breaker.on_failure()
          raise
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation, requests allowed
    OPEN = "open"  # Tripped, requests blocked
    HALF_OPEN = "half_open"  # Testing, single request allowed


@dataclass
class CircuitBreakerStats:
    """Statistics for circuit breaker."""

    state: str
    failure_count: int
    success_count: int
    last_failure: str | None
    last_success: str | None
    last_state_change: str
    trips: int


class CircuitBreaker:
    """
    Circuit breaker for protecting external services.

    Usage:
        breaker = CircuitBreaker(name="llm-api", failure_threshold=3)
        if breaker.can_execute():
            try:
                result = call_llm_api()
                breaker.on_success()
                return result
            except Exception as e:
                breaker.on_failure()
                raise
    """

    def __init__(
        self,
        name: str = "default",
        failure_threshold: int = 3,
        success_threshold: int = 2,
        recovery_timeout: int = 300,  # 5 minutes
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.success_threshold = success_threshold
        self.recovery_timeout = recovery_timeout

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure: str | None = None
        self._last_success: str | None = None
        self._last_state_change = datetime.now().isoformat()
        self._trips = 0  # Number of times circuit tripped

    @property
    def state(self) -> CircuitState:
        """Get current state, checking for automatic recovery."""
        if self._state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            last_failure_time = self._get_last_failure_time()
            if last_failure_time and (time.time() - last_failure_time) > self.recovery_timeout:
                logger.info(f"[CircuitBreaker:{self.name}] Recovery timeout elapsed → HALF_OPEN")
                self._transition_to(CircuitState.HALF_OPEN)
        return self._state

    def can_execute(self) -> bool:
        """
        Check if request should be allowed.

        Returns:
            True if request can proceed, False if circuit is open.
        """
        current_state = self.state  # Trigger state check

        if current_state == CircuitState.CLOSED:
            return True
        elif current_state == CircuitState.OPEN:
            logger.warning(f"[CircuitBreaker:{self.name}] Circuit OPEN - request blocked")
            return False
        else:  # HALF_OPEN
            logger.info(f"[CircuitBreaker:{self.name}] Circuit HALF_OPEN - allowing test request")
            return True

    def on_success(self) -> None:
        """Record successful request."""
        self._success_count += 1
        self._last_success = datetime.now().isoformat()

        if self._state == CircuitState.HALF_OPEN:
            if self._success_count >= self.success_threshold:
                logger.info(
                    f"[CircuitBreaker:{self.name}] Success threshold met ({self._success_count}) → CLOSED"
                )
                self._transition_to(CircuitState.CLOSED)
                self._failure_count = 0
                self._success_count = 0
        elif self._state == CircuitState.CLOSED:
            # Reset failure count on success
            self._failure_count = 0

        logger.debug(f"[CircuitBreaker:{self.name}] Success (count={self._success_count})")

    def on_failure(self, error: str | None = None) -> None:
        """Record failed request."""
        self._failure_count += 1
        self._last_failure = datetime.now().isoformat()

        if self._state == CircuitState.HALF_OPEN:
            # Immediate trip on failure during test
            logger.warning(
                f"[CircuitBreaker:{self.name}] Failure during HALF_OPEN → OPEN (trip #{self._trips + 1})"
            )
            self._transition_to(CircuitState.OPEN)
            self._trips += 1
        elif self._state == CircuitState.CLOSED:
            if self._failure_count >= self.failure_threshold:
                logger.warning(
                    f"[CircuitBreaker:{self.name}] Failure threshold reached ({self._failure_count}) → OPEN"
                )
                self._transition_to(CircuitState.OPEN)
                self._trips += 1
            else:
                logger.debug(
                    f"[CircuitBreaker:{self.name}] Failure {self._failure_count}/{self.failure_threshold}"
                )

        if error:
            logger.error(f"[CircuitBreaker:{self.name}] Failure reason: {error}")

    def reset(self) -> None:
        """Manually reset circuit breaker to CLOSED."""
        logger.info(f"[CircuitBreaker:{self.name}] Manual reset")
        self._transition_to(CircuitState.CLOSED)
        self._failure_count = 0
        self._success_count = 0

    def _transition_to(self, new_state: CircuitState) -> None:
        """Transition to new state."""
        old_state = self._state
        self._state = new_state
        self._last_state_change = datetime.now().isoformat()

        logger.info(
            f"[CircuitBreaker:{self.name}] State change: {old_state.value} → {new_state.value}"
        )

    def _get_last_failure_time(self) -> float | None:
        """Get timestamp of last failure as epoch seconds."""
        if not self._last_failure:
            return None
        try:
            dt = datetime.fromisoformat(self._last_failure)
            return dt.timestamp()
        except ValueError:
            return None

    def get_stats(self) -> CircuitBreakerStats:
        """Get circuit breaker statistics."""
        return CircuitBreakerStats(
            state=self.state.value,
            failure_count=self._failure_count,
            success_count=self._success_count,
            last_failure=self._last_failure,
            last_success=self._last_success,
            last_state_change=self._last_state_change,
            trips=self._trips,
        )

    def __repr__(self) -> str:
        return f"CircuitBreaker(name={self.name}, state={self.state.value}, failures={self._failure_count})"


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers.

    Usage:
        registry = CircuitBreakerRegistry()
        breaker = registry.get("llm-api")
        registry.get_stats()
    """

    def __init__(self) -> None:
        self._breakers: dict[str, CircuitBreaker] = {}

    def get(self, name: str, **kwargs) -> CircuitBreaker:
        """Get or create a circuit breaker by name."""
        if name not in self._breakers:
            self._breakers[name] = CircuitBreaker(name=name, **kwargs)
            logger.info(f"[CircuitBreakerRegistry] Created breaker: {name}")
        return self._breakers[name]

    def reset(self, name: str) -> bool:
        """Reset a specific circuit breaker."""
        if name in self._breakers:
            self._breakers[name].reset()
            return True
        return False

    def reset_all(self) -> int:
        """Reset all circuit breakers. Returns count reset."""
        count = len(self._breakers)
        for breaker in self._breakers.values():
            breaker.reset()
        return count

    def get_stats(self) -> dict[str, CircuitBreakerStats]:
        """Get stats for all breakers."""
        return {name: breaker.get_stats() for name, breaker in self._breakers.items()}

    def list_breakers(self) -> list[str]:
        """List all registered breaker names."""
        return list(self._breakers.keys())
