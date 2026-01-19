"""
🎛️ ControlCenter - Feature Flags, Circuit Breakers, Rate Governors
====================================================================

Centralized control layer for the entire platform.
Enable/disable features remotely, prevent cascade failures.

Binh Pháp: "Pháp" - Rules and governance for stable operations
"""

import logging
import threading
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class FeatureFlag:
    """Feature flag configuration."""

    name: str
    enabled: bool = True
    rollout_percent: int = 100
    allowed_tenants: list = field(default_factory=list)
    description: str = ""
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class CircuitBreaker:
    """Circuit breaker for service protection."""

    service: str
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    failure_threshold: int = 5
    recovery_timeout: int = 30  # seconds
    last_failure: Optional[datetime] = None

    def record_failure(self):
        """Record a failure and potentially open circuit."""
        self.failure_count += 1
        self.last_failure = datetime.now()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(
                f"🔴 Circuit OPENED for {self.service} after {self.failure_count} failures"
            )

    def record_success(self):
        """Record success and reset if recovering."""
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            logger.info(f"🟢 Circuit CLOSED for {self.service} - recovered")

    def can_execute(self) -> bool:
        """Check if requests can proceed."""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            # Check if recovery timeout passed
            if self.last_failure:
                elapsed = (datetime.now() - self.last_failure).seconds
                if elapsed >= self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    logger.info(f"🟡 Circuit HALF-OPEN for {self.service} - testing recovery")
                    return True
            return False

        # HALF_OPEN - allow one request to test
        return True


@dataclass
class RateGovernor:
    """Rate limiter for resource protection."""

    resource: str
    max_requests: int = 100
    window_seconds: int = 60
    current_count: int = 0
    window_start: datetime = field(default_factory=datetime.now)

    def check_rate(self) -> bool:
        """Check if request is within rate limit."""
        now = datetime.now()
        elapsed = (now - self.window_start).seconds

        # Reset window if expired
        if elapsed >= self.window_seconds:
            self.window_start = now
            self.current_count = 0

        if self.current_count >= self.max_requests:
            logger.warning(f"⚠️ Rate limit exceeded for {self.resource}")
            return False

        self.current_count += 1
        return True


class ControlCenter:
    """
    🎛️ Centralized Control for Platform Operations

    - Feature flags: Enable/disable features remotely
    - Circuit breakers: Prevent cascade failures
    - Rate governors: Prevent runaway costs
    """

    def __init__(self):
        self.flags: Dict[str, FeatureFlag] = {}
        self.breakers: Dict[str, CircuitBreaker] = {}
        self.governors: Dict[str, RateGovernor] = {}
        self._lock = threading.Lock()

        # Initialize default flags
        self._init_default_flags()

    def _init_default_flags(self):
        """Initialize default feature flags."""
        defaults = [
            FeatureFlag("gumroad_webhook", True, 100, [], "Gumroad purchase webhook"),
            FeatureFlag("email_sequence", True, 100, [], "Post-purchase email sequence"),
            FeatureFlag("revenue_autopilot", True, 100, [], "Daily revenue automation"),
            FeatureFlag("prometheus_metrics", True, 100, [], "Prometheus metrics endpoint"),
            FeatureFlag("viral_mode", False, 0, [], "Emergency viral scaling mode"),
        ]

        for flag in defaults:
            self.flags[flag.name] = flag

    # Feature Flags
    def is_enabled(self, feature: str, tenant_id: str = "default") -> bool:
        """Check if feature is enabled for tenant."""
        flag = self.flags.get(feature)

        if not flag:
            return True  # Default to enabled if unknown

        if not flag.enabled:
            return False

        # Check tenant allowlist
        if flag.allowed_tenants and tenant_id not in flag.allowed_tenants:
            return False

        # Check rollout percentage
        if flag.rollout_percent < 100:
            # Simple hash-based rollout
            tenant_hash = hash(tenant_id) % 100
            return tenant_hash < flag.rollout_percent

        return True

    def set_flag(self, feature: str, enabled: bool, rollout: int = 100):
        """Update feature flag."""
        with self._lock:
            if feature in self.flags:
                self.flags[feature].enabled = enabled
                self.flags[feature].rollout_percent = rollout
                self.flags[feature].updated_at = datetime.now()
            else:
                self.flags[feature] = FeatureFlag(feature, enabled, rollout)

            logger.info(f"🎚️ Flag {feature} set to {enabled} ({rollout}%)")

    # Circuit Breakers
    def check_breaker(self, service: str) -> bool:
        """Check if service circuit allows requests."""
        if service not in self.breakers:
            self.breakers[service] = CircuitBreaker(service)

        return self.breakers[service].can_execute()

    def record_success(self, service: str):
        """Record successful service call."""
        if service in self.breakers:
            self.breakers[service].record_success()

    def record_failure(self, service: str):
        """Record failed service call."""
        if service not in self.breakers:
            self.breakers[service] = CircuitBreaker(service)

        self.breakers[service].record_failure()

    # Rate Governors
    def check_rate(self, resource: str) -> bool:
        """Check if request is within rate limit."""
        if resource not in self.governors:
            self.governors[resource] = RateGovernor(resource)

        return self.governors[resource].check_rate()

    def set_rate_limit(self, resource: str, max_requests: int, window_seconds: int = 60):
        """Configure rate limit for resource."""
        with self._lock:
            self.governors[resource] = RateGovernor(resource, max_requests, window_seconds)
            logger.info(f"📊 Rate limit set: {resource} = {max_requests}/{window_seconds}s")

    # Status
    def get_status(self) -> Dict[str, Any]:
        """Get control center status."""
        return {
            "flags": {
                name: {"enabled": f.enabled, "rollout": f.rollout_percent}
                for name, f in self.flags.items()
            },
            "breakers": {
                name: {"state": b.state.value, "failures": b.failure_count}
                for name, b in self.breakers.items()
            },
            "governors": {
                name: {"count": g.current_count, "limit": g.max_requests}
                for name, g in self.governors.items()
            },
        }


# Global singleton
_control = ControlCenter()


def get_control() -> ControlCenter:
    """Get the global control center instance."""
    return _control


# Convenience functions
def is_enabled(feature: str, tenant_id: str = "default") -> bool:
    """Check if feature is enabled."""
    return _control.is_enabled(feature, tenant_id)


def check_breaker(service: str) -> bool:
    """Check circuit breaker status."""
    return _control.check_breaker(service)


def check_rate(resource: str) -> bool:
    """Check rate limit."""
    return _control.check_rate(resource)


# Decorator for protected functions
def protected(service: str = None, feature: str = None, rate_resource: str = None):
    """Decorator to protect functions with control checks."""

    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Check feature flag
            if feature and not _control.is_enabled(feature):
                raise RuntimeError(f"Feature {feature} is disabled")

            # Check circuit breaker
            if service and not _control.check_breaker(service):
                raise RuntimeError(f"Service {service} circuit is open")

            # Check rate limit
            if rate_resource and not _control.check_rate(rate_resource):
                raise RuntimeError(f"Rate limit exceeded for {rate_resource}")

            try:
                result = func(*args, **kwargs)
                if service:
                    _control.record_success(service)
                return result
            except Exception:
                if service:
                    _control.record_failure(service)
                raise

        return wrapper

    return decorator
