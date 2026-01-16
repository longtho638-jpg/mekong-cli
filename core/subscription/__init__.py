"""
☁️ Subscription Module - Main Interface
======================================

Main entry point for subscription functionality.
Orchestrates validation, rate limiting, and usage tracking.
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, Optional

from functools import wraps

from .models.subscription import Subscription, SubscriptionTier
from .models.usage import UsageEvent
from .validators.local_validator import LocalValidator
from .validators.remote_validator import RemoteValidator
from .services.tier_service import TierService
from .services.rate_limiter import RateLimiter
from .services.usage_tracker import UsageTracker

logger = logging.getLogger(__name__)


class SubscriptionManager:
    """Main subscription management interface."""

    def __init__(self, local_app_dir: str = ".mekong"):
        self.local_validator = LocalValidator(local_app_dir)
        self.remote_validator = RemoteValidator()
        self.tier_service = TierService()
        self.rate_limiter = RateLimiter()
        self.usage_tracker = UsageTracker()
        
        self._subscription_cache: Dict[str, Dict[str, Any]] = {}

    def get_subscription(self, user_id: str) -> Subscription:
        """Get user's subscription details with fallback strategy."""
        # Check cache (5 min TTL)
        if user_id in self._subscription_cache:
            cached = self._subscription_cache[user_id]
            if datetime.now() - cached.get("_cached_at", datetime.min) < timedelta(minutes=5):
                return cached["subscription"]

        # Try local first, then remote
        subscription = self.local_validator.get_subscription(user_id)
        if not subscription:
            subscription = self.remote_validator.get_subscription(user_id)

        # Default subscription if none found
        if not subscription:
            subscription = Subscription(
                user_id=user_id,
                tier=SubscriptionTier.STARTER,
                source="default"
            )

        # Update cache
        self._subscription_cache[user_id] = {
            "subscription": subscription,
            "_cached_at": datetime.now()
        }

        return subscription

    def check_limit(self, user_id: str, action: str) -> Dict[str, Any]:
        """Check if user is within their tier limits."""
        subscription = self.get_subscription(user_id)
        tier = subscription.tier
        
        # Get current usage
        usage = self.usage_tracker.get_monthly_usage(subscription.agency_id or user_id)
        
        if action in ["api_call", "command_exec"]:
            current = usage.api_calls if action == "api_call" else usage.commands
            return self.tier_service.check_limit(tier, action, current)
        elif action in ["api_access", "white_label", "priority_support"]:
            return self.tier_service.check_feature_access(tier, action)
        
        return {"allowed": True}

    def validate_license(self, license_key: str, email: Optional[str] = None) -> Dict:
        """Validate license key using both local and remote methods."""
        # Try local validation first
        local_result = self.local_validator.validate_license(license_key, email)
        if local_result["valid"]:
            return local_result
        
        # Try remote validation
        remote_result = self.remote_validator.validate_license(license_key, email)
        if remote_result["valid"]:
            return remote_result
        
        # Return local result if both fail (better error message)
        return local_result

    def enforce(self, action: str = "api_call"):
        """Decorator to enforce tier limits on functions."""
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Extract user_id
                user_id = kwargs.get("user_id") or "default_user"
                
                # Security: Validate user_id format
                if not isinstance(user_id, str) or len(user_id) > 100:
                    raise PermissionError("Invalid user identifier.")

                # Check limits
                result = self.check_limit(user_id, action)
                if not result.get("allowed"):
                    logger.warning(f"Access denied for user {user_id}: {result.get('reason')}")
                    raise PermissionError(result.get("reason", "Access denied."))

                # Rate limiting check
                if not self.rate_limiter.check_rate_limit(user_id, action):
                    logger.warning(f"Rate limit exceeded for user {user_id}, action {action}")
                    raise PermissionError("Rate limit exceeded. Please try again later.")

                # Execute function
                result = func(*args, **kwargs)

                # Record usage
                subscription = self.get_subscription(user_id)
                event = UsageEvent(
                    user_id=user_id,
                    action=action,
                    timestamp=datetime.now(),
                    agency_id=subscription.agency_id,
                    command=kwargs.get("command") or func.__name__
                )
                self.usage_tracker.record_usage(event)

                return result

            return wrapper
        return decorator

    def get_usage_dashboard(self, user_id: str) -> str:
        """Format usage dashboard as ASCII text."""
        subscription = self.get_subscription(user_id)
        tier = subscription.tier
        source = subscription.source

        limits = self.tier_service.get_limits(tier)
        usage = self.usage_tracker.get_monthly_usage(subscription.agency_id or user_id)

        def get_stat_line(label: str, current: int, limit: int) -> str:
            if limit == -1:
                return f"  {label:15} {current:,} / Unlimited (∞)"
            pct = (current / limit * 100) if limit > 0 else 0
            bar = self._progress_bar(pct)
            return f"  {label:15}\n  {bar} {current:,} / {limit:,} ({pct:.1f}%)"

        api_line = get_stat_line("API CALLS", usage.api_calls, limits.monthly_api_calls)
        cmd_line = get_stat_line("COMMANDS", usage.commands, limits.monthly_commands)

        return f"""
 ╔═══════════════════════════════════════════════════════════╗
 ║  📊 USAGE DASHBOARD - {tier.value.upper():20}         ║
 ╠═══════════════════════════════════════════════════════════╣
 ║  Source: {source:48} ║
 ╠═══════════════════════════════════════════════════════════╣
 ║                                                           ║
{api_line}
 ║                                                           ║
{cmd_line}
 ║                                                           ║
 ╠═══════════════════════════════════════════════════════════╣
 ║  Features: {"✅ API" if limits.api_access else "❌ API"} │ {"✅ White-Label" if limits.white_label else "❌ White-Label"} │ {"✅ Priority" if limits.priority_support else "❌ Priority"}  ║
 ╚═══════════════════════════════════════════════════════════╝
"""

    def _progress_bar(self, percentage: float, width: int = 30) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * min(percentage, 100) / 100)
        empty = width - filled
        color = "🔴" if percentage >= 90 else "🟡" if percentage >= 70 else "🟢"
        return f"{color} [{'█' * filled}{'░' * empty}]"

    def check_quota_warnings(self, user_id: str) -> Dict[str, Any]:
        """Check quota and return warnings if approaching limits."""
        subscription = self.get_subscription(user_id)
        limits = self.tier_service.get_limits(subscription.tier)
        
        warnings = self.usage_tracker.get_usage_warnings(
            user_id, subscription.tier, limits
        )
        
        return {
            "has_warning": warnings.has_warning,
            "is_critical": warnings.is_critical,
            "warnings": warnings.warnings,
            "tier": warnings.tier,
        }


# Global manager instance for backward compatibility
manager = SubscriptionManager()

# Legacy compatibility functions
def get_subscription(user_id: str) -> Dict[str, Any]:
    """Legacy compatibility wrapper."""
    sub = manager.get_subscription(user_id)
    return {
        "user_id": sub.user_id,
        "tier": sub.tier,
        "status": sub.status,
        "agency_id": sub.agency_id,
        "source": sub.source,
    }


def check_limit(user_id: str, action: str) -> Dict[str, Any]:
    """Legacy compatibility wrapper."""
    return manager.check_limit(user_id, action)


def validate_license(license_key: str, email: Optional[str] = None) -> Dict:
    """Legacy compatibility wrapper."""
    return manager.validate_license(license_key, email)


def enforce(action: str = "api_call"):
    """Legacy compatibility wrapper."""
    return manager.enforce(action)