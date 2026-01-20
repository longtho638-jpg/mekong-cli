"""
🎛️ ControlCenter - Feature Flags, Circuit Breakers, Rate Governors
====================================================================

Centralized control layer for the entire platform.
Enable/disable features remotely, prevent cascade failures.

Binh Pháp: "Pháp" - Rules and governance for stable operations

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.control package.
"""

from antigravity.core.control import (
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    ControlCenter,
    FeatureFlag,
    FeatureFlagManager,
    RateGovernor,
    check_breaker,
    check_rate,
    get_control,
    is_enabled,
    protected,
)

__all__ = [
    "ControlCenter",
    "FeatureFlag",
    "FeatureFlagManager",
    "CircuitBreaker",
    "CircuitState",
    "CircuitBreakerError",
    "RateGovernor",
    "get_control",
    "is_enabled",
    "check_breaker",
    "check_rate",
    "protected",
]
