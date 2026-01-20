"""
Circuit Breaker States - State Machine Definitions
===================================================

Defines circuit breaker states and exceptions.
"""

from enum import Enum


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation, requests pass through
    OPEN = "open"  # Blocking all requests due to failures
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerError(Exception):
    """Raised when circuit breaker is OPEN."""

    pass
