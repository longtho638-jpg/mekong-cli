"""
🎛️ Control Center Module
========================

Centralized control layer for the entire platform.
Unifies feature flags, circuit breakers, and rate governors.
"""

from .analytics import AnalyticsEvent, AnalyticsTracker  # Now a package
from .center import (
    ControlCenter,
    check_breaker,
    check_rate,
    get_control,
    is_enabled,
    protected,
)
from .circuit_breaker import CircuitBreaker, CircuitBreakerError, CircuitState
from .enhanced import (
    EnhancedControlCenter,
    get_control_center,
    is_feature_enabled,
    set_feature_flag,
)
from .feature_flags import FeatureFlag, FeatureFlagManager
from .rate_governor import RateGovernor
from .redis_client import REDIS_AVAILABLE, RedisClient

__all__ = [
    "RedisClient",
    "REDIS_AVAILABLE",
    "FeatureFlag",
    "FeatureFlagManager",
    "CircuitBreaker",
    "CircuitState",
    "CircuitBreakerError",
    "RateGovernor",
    "ControlCenter",
    "get_control",
    "is_enabled",
    "check_breaker",
    "check_rate",
    "protected",
    "AnalyticsEvent",
    "AnalyticsTracker",
    "EnhancedControlCenter",
    "get_control_center",
    "is_feature_enabled",
    "set_feature_flag",
]
