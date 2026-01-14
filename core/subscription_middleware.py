"""
☁️ Subscription Middleware - Tier Enforcement
==============================================

Validates user subscription tier and enforces limits.
Synchronized with Supabase public.subscriptions and public.usage_logs.
Supports local license validation for CLI offline usage.

Features:
- Tier validation on API calls
- Rate limiting by tier
- Usage tracking (Local + Cloud)
- License key validation (AgencyOS + mk_live)
"""

import logging
import json
from typing import Optional, Dict, Any, Callable, Union, List
from functools import wraps
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
import os

try:
    from .db import get_db
    from .config import get_settings
except ImportError:
    from db import get_db
    from config import get_settings

# Configure logging
logger = logging.getLogger(__name__)

class SubscriptionTier(Enum):
    """Subscription tier levels matching Supabase schema and LicenseTier."""
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


# Tier configuration matching public.tier_limits view + LicenseValidator limits
TIER_LIMITS: Dict[SubscriptionTier, TierLimits] = {
    SubscriptionTier.FREE: TierLimits(
        monthly_api_calls=100,
        monthly_commands=10,
        team_members=1,
        white_label=False,
        api_access=False,
        priority_support=False,
        max_daily_video=0
    ),
    SubscriptionTier.STARTER: TierLimits(
        monthly_api_calls=1000,
        monthly_commands=50,
        team_members=1,
        white_label=False,
        api_access=False,
        priority_support=False,
        max_daily_video=1
    ),
    SubscriptionTier.PRO: TierLimits(
        monthly_api_calls=10000,
        monthly_commands=500,
        team_members=5,
        white_label=False,
        api_access=True,
        priority_support=True,
        max_daily_video=10
    ),
    SubscriptionTier.FRANCHISE: TierLimits(
        monthly_api_calls=100000,
        monthly_commands=5000,
        team_members=25,
        white_label=True,
        api_access=True,
        priority_support=True,
        max_daily_video=50
    ),
    SubscriptionTier.ENTERPRISE: TierLimits(
        monthly_api_calls=-1,  # Unlimited
        monthly_commands=-1,   # Unlimited
        team_members=-1,       # Unlimited
        white_label=True,
        api_access=True,
        priority_support=True,
        max_daily_video=-1     # Unlimited
    ),
}


class UsageTracker:
    """
    Track API usage per user/agency.
    Connects to Supabase usage_logs table and get_monthly_usage function.
    """
    
    def __init__(self):
        self._usage_cache: Dict[str, Dict[str, int]] = {}
        self._cache_timestamp: Dict[str, datetime] = {}
        self.db = get_db()
    
    def get_monthly_usage(self, agency_id: str) -> Dict[str, int]:
        """Get current month's usage for an agency."""
        # Check cache validity (5 min TTL)
        if agency_id in self._cache_timestamp:
            if datetime.now() - self._cache_timestamp[agency_id] < timedelta(minutes=5):
                return self._usage_cache.get(agency_id, {"api_calls": 0, "commands": 0})
        
        usage = {"api_calls": 0, "commands": 0, "tokens_used": 0, "cost_cents": 0}
        
        if self.db:
            try:
                # Use the RPC function defined in migration
                response = self.db.rpc('get_monthly_usage', {'p_agency_id': agency_id}).execute()
                if response.data and len(response.data) > 0:
                    data = response.data[0]
                    usage = {
                        "api_calls": data.get("api_calls", 0),
                        "commands": data.get("commands", 0),
                        "tokens_used": data.get("tokens_used", 0),
                        "cost_cents": data.get("cost_cents", 0)
                    }
            except Exception as e:
                logger.error(f"Failed to fetch usage from DB for {agency_id}: {e}")
        
        # Fallback/Update cache
        self._usage_cache[agency_id] = usage
        self._cache_timestamp[agency_id] = datetime.now()
        return usage
    
    def record_usage(self, user_id: str, action: str, agency_id: Optional[str] = None, **metadata) -> bool:
        """Record a usage event to DB."""
        # Local cache update for immediate feedback
        target_id = agency_id or user_id
        if target_id not in self._usage_cache:
            self._usage_cache[target_id] = {"api_calls": 0, "commands": 0}
        
        if action == "api_call":
            self._usage_cache[target_id]["api_calls"] += 1
        elif action == "command_exec":
            self._usage_cache[target_id]["commands"] += 1
        
        # Persistence to Supabase
        if self.db:
            try:
                payload = {
                    "user_id": user_id,
                    "agency_id": agency_id,
                    "action": action,
                    "metadata": metadata,
                    "tokens_used": metadata.get("tokens_used", 0),
                    "cost_cents": metadata.get("cost_cents", 0),
                    "command": metadata.get("command")
                }
                # Remove None values
                payload = {k: v for k, v in payload.items() if v is not None}
                
                self.db.from_('usage_logs').insert(payload).execute()
                return True
            except Exception as e:
                logger.error(f"Failed to record usage in DB: {e}")
        
        return False


class SubscriptionMiddleware:
    """
    Subscription tier enforcement middleware.
    Validates user tier and enforces limits on API calls and commands.
    Supports local license files for CLI use cases.
    """
    
    def __init__(self, local_app_dir: str = ".mekong"):
        self.usage_tracker = UsageTracker()
        self.db = get_db()
        self._subscription_cache: Dict[str, Dict[str, Any]] = {}
        self.local_license_path = Path.home() / local_app_dir / "license.json"
    
    def get_subscription(self, user_id: str) -> Dict[str, Any]:
        """Get user's subscription details from DB, Local File, or Default Cache."""
        # 1. Check runtime cache (5 min TTL)
        if user_id in self._subscription_cache:
            cached = self._subscription_cache[user_id]
            if datetime.now() - cached.get("_cached_at", datetime.min) < timedelta(minutes=5):
                return cached
        
        # Default starter subscription
        subscription = {
            "tier": SubscriptionTier.STARTER,
            "status": "active",
            "agency_id": user_id,
            "user_id": user_id,
            "source": "default",
            "_cached_at": datetime.now()
        }
        
        # 2. Check local license file (Primary for CLI)
        if self.local_license_path.exists():
            try:
                with open(self.local_license_path, "r", encoding="utf-8") as f:
                    local_data = json.load(f)
                    subscription.update({
                        "tier": SubscriptionTier.from_str(local_data.get("tier", "starter")),
                        "status": local_data.get("status", "active"),
                        "license_key": local_data.get("key"),
                        "source": "local_file"
                    })
            except Exception as e:
                logger.warning(f"Could not read local license: {e}")

        # 3. Check Supabase (Primary for Cloud/Web)
        if self.db:
            try:
                # Use a small timeout or error handling to avoid blocking if DB is slow/down
                response = self.db.from_('subscriptions').select('*').eq('user_id', user_id).single().execute()
                if response.data:
                    data = response.data
                    subscription.update({
                        "id": data.get("id"),
                        "tier": SubscriptionTier.from_str(data.get("tier", "starter")),
                        "status": data.get("status", "active"),
                        "agency_id": data.get("agency_id", user_id),
                        "source": "supabase"
                    })
            except Exception as e:
                logger.debug(f"Could not fetch subscription from Supabase for {user_id}: {e}")
        
        self._subscription_cache[user_id] = subscription
        return subscription
    
    def check_limit(self, user_id: str, action: str) -> Dict[str, Any]:
        """
        Check if user is within their tier limits.
        
        Returns:
            {"allowed": bool, "reason": str, "remaining": int, "limit": int, "current": int}
        """
        subscription = self.get_subscription(user_id)
        tier = subscription.get("tier", SubscriptionTier.FREE)
        
        if isinstance(tier, str):
            tier = SubscriptionTier.from_str(tier)
        
        limits = TIER_LIMITS.get(tier, TIER_LIMITS[SubscriptionTier.FREE])
        usage = self.usage_tracker.get_monthly_usage(subscription.get("agency_id", user_id))
        
        # Mapping action to limit field
        limit_map = {
            "api_call": ("monthly_api_calls", "api_calls"),
            "command_exec": ("monthly_commands", "commands"),
            "video_gen": ("max_daily_video", "daily_videos")  # Note: usage field might need different tracking
        }
        
        if action in limit_map:
            limit_field, usage_field = limit_map[action]
            limit = getattr(limits, limit_field)
            current = usage.get(usage_field, 0)
            
            if limit != -1 and current >= limit:
                return {
                    "allowed": False,
                    "reason": f"Monthly limit ({limit}) for {action} reached. Upgrade to increase limit.",
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
        
        # Boolean feature checks
        feature_map = {
            "api_access": ("api_access", "API access", "pro"),
            "white_label": ("white_label", "White-label", "franchise"),
            "priority_support": ("priority_support", "Priority support", "pro")
        }
        
        if action in feature_map:
            field, name, req_tier = feature_map[action]
            if not getattr(limits, field):
                return {
                    "allowed": False,
                    "reason": f"{name} requires {req_tier.capitalize()} tier or higher.",
                    "required_tier": req_tier
                }
            return {"allowed": True}
        
        # Default: allow if unknown action
        return {"allowed": True}
    
    def validate_license(self, license_key: str, email: Optional[str] = None) -> Dict[str, Any]:
        """Validate a license key (Local logic + Supabase logic)."""
        license_key = license_key.strip()
        
        # 1. Quick Local Pattern Match
        tier = SubscriptionTier.STARTER
        if license_key.startswith("AGENCYOS-"):
            tier = SubscriptionTier.PRO
        elif license_key.startswith("mk_live_"):
            parts = license_key.split("_")
            if len(parts) >= 3:
                tier = SubscriptionTier.from_str(parts[2])

        # 2. Remote Validation if DB is connected
        if self.db:
            try:
                query = self.db.from_('licenses').select('*').eq('license_key', license_key)
                if email:
                    query = query.eq('email', email)
                
                response = query.execute()
                if response.data:
                    data = response.data[0]
                    if data.get("status") == "active":
                        return {
                            "valid": True, 
                            "tier": SubscriptionTier.from_str(data.get("plan", tier.value)),
                            "data": data,
                            "source": "remote"
                        }
                    else:
                        return {"valid": False, "reason": f"License status: {data.get('status')}"}
            except Exception as e:
                logger.error(f"Remote license validation failed: {e}")

        # 3. Fallback to Local Pattern (Offline activation)
        if license_key.startswith("AGENCYOS-") or license_key.startswith("mk_live_"):
            return {
                "valid": True,
                "tier": tier,
                "source": "local_pattern"
            }
            
        return {"valid": False, "reason": "Invalid license key format."}
    
    def enforce(self, action: str = "api_call"):
        """
        Decorator to enforce tier limits on functions.
        """
        def decorator(func: Callable):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Extract user_id
                user_id = kwargs.get("user_id") or "default_user"
                
                # Check limits
                result = self.check_limit(user_id, action)
                
                if not result.get("allowed"):
                    raise PermissionError(result.get("reason", "Access denied."))
                
                # Execute function
                res = func(*args, **kwargs)
                
                # Record usage
                subscription = self.get_subscription(user_id)
                self.usage_tracker.record_usage(
                    user_id=user_id,
                    action=action,
                    agency_id=subscription.get("agency_id"),
                    command=kwargs.get("command") or func.__name__
                )
                
                return res
            
            return wrapper
        return decorator
    
    def format_usage_dashboard(self, user_id: str) -> str:
        """Format usage dashboard as ASCII text."""
        subscription = self.get_subscription(user_id)
        tier = subscription.get("tier", SubscriptionTier.FREE)
        source = subscription.get("source", "unknown")
        
        if isinstance(tier, str):
            tier = SubscriptionTier.from_str(tier)
        
        limits = TIER_LIMITS.get(tier, TIER_LIMITS[SubscriptionTier.FREE])
        usage = self.usage_tracker.get_monthly_usage(subscription.get("agency_id", user_id))
        
        def get_stat_line(label: str, current: int, limit: int) -> str:
            if limit == -1:
                return f"  {label:15} {current:,} / Unlimited (∞)"
            pct = (current / limit * 100) if limit > 0 else 0
            bar = self._progress_bar(pct)
            return f"  {label:15}\n  {bar} {current:,} / {limit:,} ({pct:.1f}%)"

        api_line = get_stat_line("API CALLS", usage.get("api_calls", 0), limits.monthly_api_calls)
        cmd_line = get_stat_line("COMMANDS", usage.get("commands", 0), limits.monthly_commands)
        
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
║  Features: {'✅ API' if limits.api_access else '❌ API'} │ {'✅ White-Label' if limits.white_label else '❌ White-Label'} │ {'✅ Priority' if limits.priority_support else '❌ Priority'}  ║
╚═══════════════════════════════════════════════════════════╝
"""
    
    def _progress_bar(self, percentage: float, width: int = 30) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * min(percentage, 100) / 100)
        empty = width - filled
        color = "🔴" if percentage >= 90 else "🟡" if percentage >= 70 else "🟢"
        return f"{color} [{'█' * filled}{'░' * empty}]"


# Global middleware instance
middleware = SubscriptionMiddleware()