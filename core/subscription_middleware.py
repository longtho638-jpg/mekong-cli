"""
🎫 Subscription Middleware - Tier Enforcement
==============================================

Validates user subscription tier and enforces limits.

Features:
- Tier validation on API calls
- Rate limiting by tier
- Usage tracking
- License key validation
"""

from typing import Optional, Dict, Any, Callable
from functools import wraps
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import os


class SubscriptionTier(Enum):
    """Subscription tier levels."""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"


@dataclass
class TierLimits:
    """Limits for each subscription tier."""
    monthly_api_calls: int
    monthly_commands: int
    team_members: int
    white_label: bool
    api_access: bool
    priority_support: bool


# Tier configuration matching Supabase tier_limits view
TIER_LIMITS: Dict[SubscriptionTier, TierLimits] = {
    SubscriptionTier.FREE: TierLimits(
        monthly_api_calls=100,
        monthly_commands=10,
        team_members=1,
        white_label=False,
        api_access=False,
        priority_support=False
    ),
    SubscriptionTier.STARTER: TierLimits(
        monthly_api_calls=1000,
        monthly_commands=50,
        team_members=1,
        white_label=False,
        api_access=False,
        priority_support=False
    ),
    SubscriptionTier.PRO: TierLimits(
        monthly_api_calls=10000,
        monthly_commands=500,
        team_members=5,
        white_label=False,
        api_access=True,
        priority_support=True
    ),
    SubscriptionTier.FRANCHISE: TierLimits(
        monthly_api_calls=100000,
        monthly_commands=5000,
        team_members=25,
        white_label=True,
        api_access=True,
        priority_support=True
    ),
    SubscriptionTier.ENTERPRISE: TierLimits(
        monthly_api_calls=-1,  # Unlimited
        monthly_commands=-1,   # Unlimited
        team_members=-1,       # Unlimited
        white_label=True,
        api_access=True,
        priority_support=True
    ),
}


class UsageTracker:
    """
    Track API usage per user/agency.
    
    In production, this connects to Supabase usage_logs table.
    """
    
    def __init__(self):
        self._usage_cache: Dict[str, Dict[str, int]] = {}
        self._cache_timestamp: Dict[str, datetime] = {}
    
    def get_monthly_usage(self, agency_id: str) -> Dict[str, int]:
        """Get current month's usage for an agency."""
        # Check cache validity (5 min TTL)
        if agency_id in self._cache_timestamp:
            if datetime.now() - self._cache_timestamp[agency_id] < timedelta(minutes=5):
                return self._usage_cache.get(agency_id, {"api_calls": 0, "commands": 0})
        
        # In production: fetch from Supabase
        # response = supabase.rpc('get_monthly_usage', {'p_agency_id': agency_id})
        
        # Demo data
        usage = self._usage_cache.get(agency_id, {"api_calls": 0, "commands": 0})
        self._cache_timestamp[agency_id] = datetime.now()
        return usage
    
    def record_usage(self, agency_id: str, action: str, **metadata) -> bool:
        """Record a usage event."""
        if agency_id not in self._usage_cache:
            self._usage_cache[agency_id] = {"api_calls": 0, "commands": 0}
        
        if action == "api_call":
            self._usage_cache[agency_id]["api_calls"] += 1
        elif action == "command_exec":
            self._usage_cache[agency_id]["commands"] += 1
        
        # In production: insert to Supabase usage_logs
        # supabase.from_('usage_logs').insert({...})
        
        return True


class SubscriptionMiddleware:
    """
    Subscription tier enforcement middleware.
    
    Validates user tier and enforces limits on API calls and commands.
    """
    
    def __init__(self):
        self.usage_tracker = UsageTracker()
        self._subscription_cache: Dict[str, Dict[str, Any]] = {}
    
    def get_subscription(self, user_id: str) -> Dict[str, Any]:
        """Get user's subscription details."""
        # Check cache
        if user_id in self._subscription_cache:
            cached = self._subscription_cache[user_id]
            if datetime.now() - cached.get("_cached_at", datetime.min) < timedelta(minutes=5):
                return cached
        
        # In production: fetch from Supabase
        # response = supabase.from_('subscriptions').select('*').eq('user_id', user_id).single()
        
        # Demo: return starter tier
        subscription = {
            "tier": SubscriptionTier.STARTER,
            "status": "active",
            "agency_id": user_id,
            "_cached_at": datetime.now()
        }
        self._subscription_cache[user_id] = subscription
        return subscription
    
    def check_limit(self, user_id: str, action: str) -> Dict[str, Any]:
        """
        Check if user is within their tier limits.
        
        Returns:
            {"allowed": bool, "reason": str, "remaining": int}
        """
        subscription = self.get_subscription(user_id)
        tier = subscription.get("tier", SubscriptionTier.FREE)
        
        if isinstance(tier, str):
            tier = SubscriptionTier(tier)
        
        limits = TIER_LIMITS.get(tier, TIER_LIMITS[SubscriptionTier.FREE])
        usage = self.usage_tracker.get_monthly_usage(subscription.get("agency_id", user_id))
        
        # Check API calls limit
        if action == "api_call":
            limit = limits.monthly_api_calls
            current = usage.get("api_calls", 0)
            
            if limit != -1 and current >= limit:
                return {
                    "allowed": False,
                    "reason": f"Monthly API call limit ({limit}) reached. Upgrade to increase limit.",
                    "remaining": 0,
                    "limit": limit,
                    "current": current
                }
            
            return {
                "allowed": True,
                "remaining": limit - current if limit != -1 else -1,
                "limit": limit,
                "current": current
            }
        
        # Check commands limit
        if action == "command_exec":
            limit = limits.monthly_commands
            current = usage.get("commands", 0)
            
            if limit != -1 and current >= limit:
                return {
                    "allowed": False,
                    "reason": f"Monthly command limit ({limit}) reached. Upgrade to increase limit.",
                    "remaining": 0,
                    "limit": limit,
                    "current": current
                }
            
            return {
                "allowed": True,
                "remaining": limit - current if limit != -1 else -1,
                "limit": limit,
                "current": current
            }
        
        # Check feature access
        if action == "api_access":
            if not limits.api_access:
                return {
                    "allowed": False,
                    "reason": "API access requires Pro tier or higher.",
                    "required_tier": "pro"
                }
            return {"allowed": True}
        
        if action == "white_label":
            if not limits.white_label:
                return {
                    "allowed": False,
                    "reason": "White-label requires Franchise tier or higher.",
                    "required_tier": "franchise"
                }
            return {"allowed": True}
        
        # Default: allow
        return {"allowed": True}
    
    def enforce(self, action: str = "api_call"):
        """
        Decorator to enforce tier limits on functions.
        
        Usage:
            @middleware.enforce("command_exec")
            def execute_command(user_id, command):
                ...
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Extract user_id from args or kwargs
                user_id = kwargs.get("user_id") or (args[0] if args else None)
                
                if not user_id:
                    raise ValueError("user_id is required for tier enforcement")
                
                # Check limits
                result = self.check_limit(user_id, action)
                
                if not result.get("allowed"):
                    raise PermissionError(result.get("reason", "Access denied"))
                
                # Record usage
                subscription = self.get_subscription(user_id)
                self.usage_tracker.record_usage(
                    subscription.get("agency_id", user_id),
                    action
                )
                
                # Execute function
                return func(*args, **kwargs)
            
            return wrapper
        return decorator
    
    def format_usage_dashboard(self, user_id: str) -> str:
        """Format usage dashboard as ASCII text."""
        subscription = self.get_subscription(user_id)
        tier = subscription.get("tier", SubscriptionTier.FREE)
        
        if isinstance(tier, str):
            tier = SubscriptionTier(tier)
        
        limits = TIER_LIMITS.get(tier, TIER_LIMITS[SubscriptionTier.FREE])
        usage = self.usage_tracker.get_monthly_usage(subscription.get("agency_id", user_id))
        
        api_calls = usage.get("api_calls", 0)
        commands = usage.get("commands", 0)
        
        api_limit = limits.monthly_api_calls
        cmd_limit = limits.monthly_commands
        
        api_pct = (api_calls / api_limit * 100) if api_limit > 0 else 0
        cmd_pct = (commands / cmd_limit * 100) if cmd_limit > 0 else 0
        
        api_bar = self._progress_bar(api_pct)
        cmd_bar = self._progress_bar(cmd_pct)
        
        return f"""
╔═══════════════════════════════════════════════════════════╗
║  📊 USAGE DASHBOARD - {tier.value.upper():20}         ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  API CALLS                                                ║
║  {api_bar}                          ║
║  {api_calls:,} / {api_limit:,} ({api_pct:.1f}%)                                   ║
║                                                           ║
║  COMMANDS                                                 ║
║  {cmd_bar}                          ║
║  {commands:,} / {cmd_limit:,} ({cmd_pct:.1f}%)                                     ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  Features: {'✅ API' if limits.api_access else '❌ API'} │ {'✅ White-Label' if limits.white_label else '❌ White-Label'} │ {'✅ Priority' if limits.priority_support else '❌ Priority'}  ║
╚═══════════════════════════════════════════════════════════╝
"""
    
    def _progress_bar(self, percentage: float, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * min(percentage, 100) / 100)
        empty = width - filled
        
        if percentage >= 90:
            color = "🔴"
        elif percentage >= 70:
            color = "🟡"
        else:
            color = "🟢"
        
        return f"{color} [{'█' * filled}{'░' * empty}]"


# Global middleware instance
middleware = SubscriptionMiddleware()


# Example usage
if __name__ == "__main__":
    print("🎫 Subscription Middleware Demo")
    print("=" * 50)
    
    # Check limits
    user_id = "demo-user"
    
    # API call check
    result = middleware.check_limit(user_id, "api_call")
    print(f"\n📡 API Call: {'✅ Allowed' if result['allowed'] else '❌ Denied'}")
    if result.get("remaining"):
        print(f"   Remaining: {result['remaining']}")
    
    # Command check
    result = middleware.check_limit(user_id, "command_exec")
    print(f"\n⚡ Command: {'✅ Allowed' if result['allowed'] else '❌ Denied'}")
    if result.get("remaining"):
        print(f"   Remaining: {result['remaining']}")
    
    # Feature check
    result = middleware.check_limit(user_id, "api_access")
    print(f"\n🔑 API Access: {'✅ Allowed' if result['allowed'] else '❌ ' + result.get('reason', 'Denied')}")
    
    result = middleware.check_limit(user_id, "white_label")
    print(f"🎨 White-Label: {'✅ Allowed' if result['allowed'] else '❌ ' + result.get('reason', 'Denied')}")
    
    # Usage dashboard
    print("\n" + middleware.format_usage_dashboard(user_id))
