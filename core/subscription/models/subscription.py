"""
☁️ Subscription Models - Data Definitions
========================================

Data models for subscription tiers and usage tracking.
Clean separation of data structures with proper validation.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class SubscriptionTier(Enum):
    """Subscription tier levels matching Supabase schema."""

    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"

    @classmethod
    def from_str(cls, tier_str: str) -> "SubscriptionTier":
        """Convert string to SubscriptionTier with fallback."""
        try:
            return cls(tier_str.lower())
        except (ValueError, AttributeError):
            return cls.STARTER


@dataclass
class TierLimits:
    """Limits for each subscription tier."""

    monthly_api_calls: int
    monthly_commands: int
    team_members: int
    white_label: bool
    api_access: bool
    priority_support: bool
    max_daily_video: int


@dataclass
class Subscription:
    """User subscription details."""

    user_id: str
    tier: SubscriptionTier
    status: str = "active"
    agency_id: Optional[str] = None
    license_key: Optional[str] = None
    source: str = "default"
