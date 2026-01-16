"""
☁️ Subscription Module - Main Interface
======================================

Main entry point for subscription functionality.
Orchestrates validation, rate limiting, and usage tracking.
"""

import logging
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from .manager import SubscriptionManager
from .models.subscription import Subscription, SubscriptionTier
from .models.usage import UsageEvent

logger = logging.getLogger(__name__)

# Global manager instance
manager = SubscriptionManager()

# Legacy compatibility functions
def get_subscription(user_id: str) -> Dict[str, Any]:
    """Get subscription details in legacy format."""
    sub = manager.get_subscription(user_id)
    return {
        "user_id": sub.user_id,
        "tier": sub.tier,
        "status": sub.status,
        "agency_id": sub.agency_id,
        "source": sub.source,
    }

def check_limit(user_id: str, action: str) -> Dict[str, Any]:
    """Check subscription limits."""
    return manager.check_limit(user_id, action)

def validate_license(license_key: str, email: Optional[str] = None) -> Dict:
    """Validate license key."""
    return manager.validate_license(license_key, email)

def enforce(action: str = "api_call"):
    """Enforce subscription limits as decorator."""
    return manager.enforce(action)