"""
Control Center - Centralized Platform Governance.
Unifies feature flags, circuit breakers, and rate limiting into a single control plane.
"""

import logging
import threading
from typing import Any, Callable, Dict, Optional

from .circuit_breaker import CircuitBreaker, CircuitState
from .feature_flags import FeatureFlag, FeatureFlagManager
from .rate_governor import RateGovernor

logger = logging.getLogger(__name__)


class ControlCenter:
    """Centralized Control for Platform Operations - flags, breakers, and governors."""

    def __init__(self):
        # Components
        self.flag_manager = FeatureFlagManager()  # Redis connection can be injected here if needed
        self.breakers: Dict[str, CircuitBreaker] = {}
        self.governors: Dict[str, RateGovernor] = {}

        self._lock = threading.Lock()

        # Initialize default flags
        self._init_default_flags()

    def _init_default_flags(self):
        """Initialize default feature flags."""
        defaults = [
            ("gumroad_webhook", True, 100, "Gumroad purchase webhook"),
            ("email_sequence", True, 100, "Post-purchase email sequence"),
            ("revenue_autopilot", True, 100, "Daily revenue automation"),
            ("prometheus_metrics", True, 100, "Prometheus metrics endpoint"),
            ("viral_mode", False, 0, "Emergency viral scaling mode"),
        ]

        for name, enabled, rollout, desc in defaults:
            # Only set if not exists (preserves overrides)
            if not self.flag_manager.get_flag(name):
                self.flag_manager.set_flag(
                    name=name,
                    enabled=enabled,
                    rollout_percentage=rollout,
                    metadata={"description": desc}
                )

    # ==========================================
    # Feature Flags (Delegated to Manager)
    # ==========================================

    def is_enabled(self, feature: str, tenant_id: str = "default") -> bool:
        """Check if feature is enabled for tenant."""
        return self.flag_manager.is_enabled(feature, tenant_id)

    def set_flag(self, feature: str, enabled: bool, rollout: int = 100):
        """Update feature flag."""
        self.flag_manager.set_flag(feature, enabled, rollout_percentage=rollout)

    # ==========================================
    # Circuit Breakers
    # ==========================================

    def check_breaker(self, service: str) -> bool:
        """Check if service circuit allows requests."""
        if service not in self.breakers:
            with self._lock:
                if service not in self.breakers:
                    self.breakers[service] = CircuitBreaker()

        return self.breakers[service].can_execute()

    def record_success(self, service: str):
        """Record successful service call."""
        if service in self.breakers:
            self.breakers[service].record_success()

    def record_failure(self, service: str):
        """Record failed service call."""
        if service not in self.breakers:
            with self._lock:
                if service not in self.breakers:
                    self.breakers[service] = CircuitBreaker()

        self.breakers[service].record_failure()

    # ==========================================
    # Rate Governors
    # ==========================================

    def check_rate(self, resource: str) -> bool:
        """Check if request is within rate limit."""
        if resource not in self.governors:
            with self._lock:
                if resource not in self.governors:
                    self.governors[resource] = RateGovernor(resource)

        return self.governors[resource].check_rate()

    def set_rate_limit(self, resource: str, max_requests: int, window_seconds: int = 60):
        """Configure rate limit for resource."""
        with self._lock:
            # Re-create or update governor
            self.governors[resource] = RateGovernor(resource, max_requests, window_seconds)
            logger.info(f"Rate limit set: {resource} = {max_requests}/{window_seconds}s")

    # ==========================================
    # Status & Telemetry
    # ==========================================

    def get_status(self) -> Dict[str, Any]:
        """Get control center status."""
        flags_map = self.flag_manager.list_flags()

        return {
            "flags": {
                name: {"enabled": f.enabled, "rollout": f.rollout_percentage}
                for name, f in flags_map.items()
            },
            "breakers": {
                name: b.get_stats()
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
