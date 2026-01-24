"""
Circuit Breaker Pattern - Fail-fast mechanism for external dependencies

Prevents cascade failures by:
- Tracking failure rates over time
- Opening circuit after threshold breaches
- Auto-resetting after cooldown period
- Providing fallback mechanisms

Implementation based on Martin Fowler's Circuit Breaker pattern.
"""

import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Callable, Any, Dict
from dataclasses import dataclass, field
from threading import Lock
import logging

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    """Circuit breaker states"""
    CLOSED = "closed"       # Normal operation
    OPEN = "open"           # Failing - reject requests
    HALF_OPEN = "half_open" # Testing - allow limited requests


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior"""
    failure_threshold: int = 5           # Failures before opening
    success_threshold: int = 2           # Successes to close from half-open
    timeout_seconds: float = 60.0        # Cooldown before half-open
    window_seconds: float = 60.0         # Time window for failure tracking
    half_open_max_calls: int = 3         # Max calls allowed in half-open

    # Exceptions that should trigger circuit breaker
    expected_exceptions: tuple = (Exception,)


@dataclass
class CircuitBreakerStats:
    """Statistics for monitoring circuit breaker health"""
    total_calls: int = 0
    success_count: int = 0
    failure_count: int = 0
    rejected_count: int = 0
    state_changes: list = field(default_factory=list)
    last_failure_time: Optional[datetime] = None
    last_success_time: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging"""
        return {
            "total_calls": self.total_calls,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "rejected_count": self.rejected_count,
            "success_rate": self.success_count / max(1, self.total_calls),
            "failure_rate": self.failure_count / max(1, self.total_calls),
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "last_success": self.last_success_time.isoformat() if self.last_success_time else None,
            "state_changes": len(self.state_changes),
        }


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open and rejects calls"""
    pass


class CircuitBreaker:
    """
    Circuit Breaker implementation for resilient external API calls

    Usage:
        breaker = CircuitBreaker(name="payment_api")

        try:
            result = breaker.call(payment_api.charge, user_id, amount)
        except CircuitBreakerOpenError:
            # Use fallback or return cached data
            result = get_cached_payment_status(user_id)
    """

    def __init__(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None,
        fallback: Optional[Callable] = None
    ):
        """
        Initialize circuit breaker

        Args:
            name: Identifier for this circuit breaker (for logging)
            config: Configuration options
            fallback: Optional fallback function when circuit is open
        """
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.fallback = fallback

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._last_failure_time: Optional[float] = None
        self._opened_at: Optional[float] = None

        self.stats = CircuitBreakerStats()
        self._lock = Lock()

        logger.info(f"Circuit breaker '{name}' initialized with config: {self.config}")

    @property
    def state(self) -> CircuitState:
        """Get current circuit state"""
        return self._state

    @property
    def is_closed(self) -> bool:
        """Check if circuit is closed (normal operation)"""
        return self._state == CircuitState.CLOSED

    @property
    def is_open(self) -> bool:
        """Check if circuit is open (rejecting calls)"""
        return self._state == CircuitState.OPEN

    @property
    def is_half_open(self) -> bool:
        """Check if circuit is half-open (testing)"""
        return self._state == CircuitState.HALF_OPEN

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection

        Args:
            func: Function to execute
            *args: Positional arguments for function
            **kwargs: Keyword arguments for function

        Returns:
            Result from function call

        Raises:
            CircuitBreakerOpenError: If circuit is open
            Exception: Original exception from function
        """
        with self._lock:
            self._check_and_update_state()

            if self._state == CircuitState.OPEN:
                self.stats.rejected_count += 1
                logger.warning(f"Circuit '{self.name}' is OPEN - rejecting call")

                if self.fallback:
                    logger.info(f"Circuit '{self.name}' using fallback")
                    return self.fallback(*args, **kwargs)

                raise CircuitBreakerOpenError(
                    f"Circuit breaker '{self.name}' is open. "
                    f"Retry after {self.config.timeout_seconds}s"
                )

            if self._state == CircuitState.HALF_OPEN:
                if self._half_open_calls >= self.config.half_open_max_calls:
                    self.stats.rejected_count += 1
                    raise CircuitBreakerOpenError(
                        f"Circuit breaker '{self.name}' half-open call limit reached"
                    )
                self._half_open_calls += 1

        # Execute function outside lock to avoid blocking other calls
        self.stats.total_calls += 1
        start_time = time.time()

        try:
            result = func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            self._on_success(duration_ms)
            return result

        except self.config.expected_exceptions as e:
            duration_ms = (time.time() - start_time) * 1000
            self._on_failure(e, duration_ms)
            raise

    def _on_success(self, duration_ms: float):
        """Handle successful call"""
        with self._lock:
            self.stats.success_count += 1
            self.stats.last_success_time = datetime.utcnow()

            logger.debug(
                f"Circuit '{self.name}' call succeeded in {duration_ms:.2f}ms "
                f"(state={self._state})"
            )

            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                logger.info(
                    f"Circuit '{self.name}' half-open success "
                    f"({self._success_count}/{self.config.success_threshold})"
                )

                if self._success_count >= self.config.success_threshold:
                    self._transition_to_closed()

            elif self._state == CircuitState.CLOSED:
                # Reset failure count on success in closed state
                self._failure_count = 0

    def _on_failure(self, exception: Exception, duration_ms: float):
        """Handle failed call"""
        with self._lock:
            self.stats.failure_count += 1
            self.stats.last_failure_time = datetime.utcnow()
            self._last_failure_time = time.time()

            logger.warning(
                f"Circuit '{self.name}' call failed in {duration_ms:.2f}ms: {exception} "
                f"(state={self._state})"
            )

            if self._state == CircuitState.HALF_OPEN:
                # Any failure in half-open transitions back to open
                logger.error(f"Circuit '{self.name}' half-open test failed - reopening")
                self._transition_to_open()

            elif self._state == CircuitState.CLOSED:
                self._failure_count += 1
                logger.warning(
                    f"Circuit '{self.name}' failure count: "
                    f"{self._failure_count}/{self.config.failure_threshold}"
                )

                if self._failure_count >= self.config.failure_threshold:
                    self._transition_to_open()

    def _check_and_update_state(self):
        """Check if state should transition (called within lock)"""
        if self._state == CircuitState.OPEN and self._opened_at:
            elapsed = time.time() - self._opened_at

            if elapsed >= self.config.timeout_seconds:
                self._transition_to_half_open()

    def _transition_to_open(self):
        """Transition to OPEN state"""
        self._state = CircuitState.OPEN
        self._opened_at = time.time()
        self._record_state_change(CircuitState.OPEN)

        logger.error(
            f"Circuit '{self.name}' OPENED after {self._failure_count} failures. "
            f"Will retry in {self.config.timeout_seconds}s"
        )

    def _transition_to_half_open(self):
        """Transition to HALF_OPEN state"""
        self._state = CircuitState.HALF_OPEN
        self._success_count = 0
        self._half_open_calls = 0
        self._record_state_change(CircuitState.HALF_OPEN)

        logger.info(
            f"Circuit '{self.name}' entered HALF_OPEN state - testing with "
            f"max {self.config.half_open_max_calls} calls"
        )

    def _transition_to_closed(self):
        """Transition to CLOSED state"""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._opened_at = None
        self._record_state_change(CircuitState.CLOSED)

        logger.info(f"Circuit '{self.name}' CLOSED - resuming normal operation")

    def _record_state_change(self, new_state: CircuitState):
        """Record state change for monitoring"""
        self.stats.state_changes.append({
            "timestamp": datetime.utcnow().isoformat(),
            "from_state": self._state.value if hasattr(self._state, 'value') else str(self._state),
            "to_state": new_state.value,
        })

    def reset(self):
        """Manually reset circuit breaker to closed state"""
        with self._lock:
            logger.info(f"Circuit '{self.name}' manually reset")
            self._failure_count = 0
            self._success_count = 0
            self._half_open_calls = 0
            self._opened_at = None
            self._last_failure_time = None
            self._transition_to_closed()

    def get_stats(self) -> Dict[str, Any]:
        """Get current statistics"""
        with self._lock:
            return {
                "name": self.name,
                "state": self._state.value,
                "failure_count": self._failure_count,
                "success_count": self._success_count,
                **self.stats.to_dict()
            }


# Registry for managing multiple circuit breakers
_circuit_breakers: Dict[str, CircuitBreaker] = {}
_registry_lock = Lock()


def get_circuit_breaker(
    name: str,
    config: Optional[CircuitBreakerConfig] = None,
    fallback: Optional[Callable] = None
) -> CircuitBreaker:
    """
    Get or create a circuit breaker instance

    Args:
        name: Unique identifier for the circuit breaker
        config: Configuration (only used if creating new breaker)
        fallback: Fallback function (only used if creating new breaker)

    Returns:
        CircuitBreaker instance
    """
    with _registry_lock:
        if name not in _circuit_breakers:
            _circuit_breakers[name] = CircuitBreaker(name, config, fallback)
        return _circuit_breakers[name]


def get_all_circuit_breakers() -> Dict[str, CircuitBreaker]:
    """Get all registered circuit breakers"""
    with _registry_lock:
        return _circuit_breakers.copy()


def reset_all_circuit_breakers():
    """Reset all circuit breakers to closed state"""
    with _registry_lock:
        for breaker in _circuit_breakers.values():
            breaker.reset()
        logger.info(f"Reset {len(_circuit_breakers)} circuit breakers")
