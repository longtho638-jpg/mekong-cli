"""
☁️ Tier Service - Subscription Tier Management
==============================================

Service for managing subscription tiers and limits.
Business logic for tier configuration and validation.
"""

from typing import Dict

from ..models.subscription import SubscriptionTier, TierLimits


class TierService:
    """Service for managing subscription tiers and their limits."""

    # Tier configuration matching public.tier_limits view
    TIER_LIMITS: Dict[SubscriptionTier, TierLimits] = {
        SubscriptionTier.FREE: TierLimits(
            monthly_api_calls=100,
            monthly_commands=10,
            team_members=1,
            white_label=False,
            api_access=False,
            priority_support=False,
            max_daily_video=0,
        ),
        SubscriptionTier.STARTER: TierLimits(
            monthly_api_calls=1000,
            monthly_commands=50,
            team_members=1,
            white_label=False,
            api_access=False,
            priority_support=False,
            max_daily_video=1,
        ),
        SubscriptionTier.PRO: TierLimits(
            monthly_api_calls=10000,
            monthly_commands=500,
            team_members=5,
            white_label=False,
            api_access=True,
            priority_support=True,
            max_daily_video=10,
        ),
        SubscriptionTier.FRANCHISE: TierLimits(
            monthly_api_calls=100000,
            monthly_commands=5000,
            team_members=25,
            white_label=True,
            api_access=True,
            priority_support=True,
            max_daily_video=50,
        ),
        SubscriptionTier.ENTERPRISE: TierLimits(
            monthly_api_calls=-1,  # Unlimited
            monthly_commands=-1,  # Unlimited
            team_members=-1,  # Unlimited
            white_label=True,
            api_access=True,
            priority_support=True,
            max_daily_video=-1,  # Unlimited
        ),
    }

    def get_limits(self, tier: SubscriptionTier) -> TierLimits:
        """Get limits for a specific tier."""
        return self.TIER_LIMITS.get(tier, self.TIER_LIMITS[SubscriptionTier.FREE])

    def check_limit(self, tier: SubscriptionTier, action: str, current_usage: int) -> Dict:
        """Check if action is within tier limits."""
        limits = self.get_limits(tier)
        
        limit_map = {
            "api_call": limits.monthly_api_calls,
            "command_exec": limits.monthly_commands,
            "video_gen": limits.max_daily_video,
        }
        
        limit = limit_map.get(action, -1)
        
        if limit == -1:  # Unlimited
            return {"allowed": True, "remaining": -1, "limit": -1, "current": current_usage}
        
        if current_usage >= limit:
            return {
                "allowed": False,
                "reason": f"Monthly limit ({limit}) for {action} reached. Upgrade to increase limit.",
                "remaining": 0,
                "limit": limit,
                "current": current_usage,
            }
        
        return {
            "allowed": True,
            "remaining": limit - current_usage,
            "limit": limit,
            "current": current_usage,
        }

    def check_feature_access(self, tier: SubscriptionTier, feature: str) -> Dict:
        """Check if tier has access to a feature."""
        limits = self.get_limits(tier)
        
        feature_map = {
            "api_access": (limits.api_access, "API access", "pro"),
            "white_label": (limits.white_label, "White-label", "franchise"),
            "priority_support": (limits.priority_support, "Priority support", "pro"),
        }
        
        if feature in feature_map:
            has_access, name, req_tier = feature_map[feature]
            if not has_access:
                return {
                    "allowed": False,
                    "reason": f"{name} requires {req_tier.capitalize()} tier or higher.",
                    "required_tier": req_tier,
                }
            return {"allowed": True}
        
        # Default: allow if unknown feature
        return {"allowed": True}

    def upgrade_tier(self, current_tier: SubscriptionTier, target_tier: SubscriptionTier) -> bool:
        """Check if tier upgrade is valid."""
        tier_hierarchy = [
            SubscriptionTier.FREE,
            SubscriptionTier.STARTER,
            SubscriptionTier.PRO,
            SubscriptionTier.FRANCHISE,
            SubscriptionTier.ENTERPRISE,
        ]
        
        current_index = tier_hierarchy.index(current_tier)
        target_index = tier_hierarchy.index(target_tier)
        
        return target_index > current_index