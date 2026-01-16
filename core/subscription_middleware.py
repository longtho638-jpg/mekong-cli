"""
☁️ Subscription Middleware - Legacy Compatibility
=================================================

DEPRECATED: This module is kept for backward compatibility.
Use core.subscription module instead.

The original 580-line middleware has been refactored into:
- core.subscription/ (modular architecture)
- Single responsibility per file
- Clean separation of concerns
- Better error handling

Migration:
- Replace: from core.subscription_middleware import SubscriptionMiddleware
- With: from core.subscription import SubscriptionManager
"""

import warnings

# Import the new modular implementation
from .subscription import (
    SubscriptionManager,
    check_limit,
    enforce,
    get_subscription,
    manager,
    validate_license,
)

# Import tier-related items for backward compatibility
from .subscription.models.subscription import SubscriptionTier


# Legacy compatibility wrapper
class SubscriptionMiddleware:
    """Legacy compatibility wrapper for the old SubscriptionMiddleware."""

    def __init__(self, local_app_dir: str = ".mekong"):
        warnings.warn(
            "SubscriptionMiddleware is deprecated. Use SubscriptionManager from core.subscription instead.",
            DeprecationWarning,
            stacklevel=2,
        )
        self._manager = SubscriptionManager(local_app_dir)

        # Legacy attributes for compatibility
        self.usage_tracker = self._manager.usage_tracker
        self.db = getattr(self._manager.remote_validator, "db", None)
        self._subscription_cache = {}
        self.local_license_path = self._manager.local_validator.local_license_path

    def get_subscription(self, user_id: str):
        """Legacy compatibility method."""
        sub = self._manager.get_subscription(user_id)
        return {
            "user_id": sub.user_id,
            "tier": sub.tier,
            "status": sub.status,
            "agency_id": sub.agency_id,
            "source": sub.source,
        }

    def check_limit(self, user_id: str, action: str):
        """Legacy compatibility method."""
        return self._manager.check_limit(user_id, action)

    def validate_license(self, license_key: str, email=None):
        """Legacy compatibility method."""
        return self._manager.validate_license(license_key, email)

    def enforce(self, action: str = "api_call"):
        """Legacy compatibility method."""
        return self._manager.enforce(action)

    def check_and_warn_quota(self, user_id: str):
        """Legacy compatibility method."""
        return self._manager.check_quota_warnings(user_id)

    def format_usage_dashboard(self, user_id: str):
        """Legacy compatibility method."""
        return self._manager.get_usage_dashboard(user_id)

    def _check_rate_limit(self, user_id: str, action: str) -> bool:
        """Legacy compatibility method."""
        return self._manager.rate_limiter.check_rate_limit(user_id, action)

    def _progress_bar(self, percentage: float, width: int = 30) -> str:
        """Legacy compatibility method."""
        return self._manager._progress_bar(percentage, width)

    def record_usage(self, user_id: str, action: str, agency_id=None, **metadata):
        """Legacy compatibility method."""
        from datetime import datetime

        from .subscription.models.usage import UsageEvent

        event = UsageEvent(
            user_id=user_id,
            action=action,
            timestamp=datetime.now(),
            agency_id=agency_id,
            command=metadata.get("command"),
            metadata=metadata,
        )
        return self.usage_tracker.record_usage(event)


# Lazy-load global instance for backward compatibility
_middleware_instance = None


def get_middleware():
    """Get the legacy middleware instance (lazy-loaded)."""
    global _middleware_instance
    if _middleware_instance is None:
        _middleware_instance = SubscriptionMiddleware()
    return _middleware_instance


# Backward compatibility alias (defer creation until access)
class _LazyMiddleware:
    """Lazy wrapper to avoid deprecation warning during import."""

    def __getattr__(self, name):
        return getattr(get_middleware(), name)


middleware = _LazyMiddleware()

# Export all legacy symbols for compatibility
__all__ = [
    "SubscriptionMiddleware",
    "SubscriptionTier",
    "middleware",
    "SubscriptionManager",
    "manager",
    "get_subscription",
    "check_limit",
    "validate_license",
    "enforce",
]
