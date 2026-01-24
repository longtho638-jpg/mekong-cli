"""
Resilience Package - Fault tolerance and stability patterns

Contains:
- Circuit Breaker: Fail-fast mechanism for external dependencies
- (Future) Retry logic with exponential backoff
- (Future) Bulkhead pattern for resource isolation
"""

from .circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitBreakerOpenError,
    CircuitState,
    CircuitBreakerStats,
    get_circuit_breaker,
    get_all_circuit_breakers,
    reset_all_circuit_breakers,
)

__all__ = [
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitBreakerOpenError",
    "CircuitState",
    "CircuitBreakerStats",
    "get_circuit_breaker",
    "get_all_circuit_breakers",
    "reset_all_circuit_breakers",
]
