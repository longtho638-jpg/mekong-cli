"""
☁️ Usage Tracker - Usage Tracking Service
=========================================

Service for tracking API usage and analytics.
Caching layer for performance and offline support.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

try:
    from core.infrastructure.database import get_db
except ImportError:
    try:
        from core.config import get_settings
        from core.infrastructure.database import get_db
    except ImportError:

        def get_db():
            return None

        def get_settings():
            return None


from ..models.subscription import SubscriptionTier, TierLimits
from ..models.usage import MonthlyUsage, UsageEvent, UsageWarning

logger = logging.getLogger(__name__)


class UsageTracker:
    """Service for tracking and analyzing usage data."""

    def __init__(self):
        self._usage_cache: Dict[str, Dict[str, int]] = {}
        self._cache_timestamp: Dict[str, datetime] = {}
        self.db = get_db()

    def get_monthly_usage(self, agency_id: str) -> MonthlyUsage:
        """Get current month's usage for an agency."""
        # Check cache validity (5 min TTL)
        if agency_id in self._cache_timestamp:
            if datetime.now() - self._cache_timestamp[agency_id] < timedelta(minutes=5):
                cached = self._usage_cache.get(agency_id, {})
                return MonthlyUsage(
                    api_calls=cached.get("api_calls", 0),
                    commands=cached.get("commands", 0),
                    tokens_used=cached.get("tokens_used", 0),
                    cost_cents=cached.get("cost_cents", 0),
                )

        usage = MonthlyUsage()

        if self.db:
            try:
                # Use the RPC function defined in migration
                response = self.db.rpc("get_monthly_usage", {"p_agency_id": agency_id}).execute()

                if response.data and len(response.data) > 0:
                    data = response.data[0]
                    usage = MonthlyUsage(
                        api_calls=data.get("api_calls", 0),
                        commands=data.get("commands", 0),
                        tokens_used=data.get("tokens_used", 0),
                        cost_cents=data.get("cost_cents", 0),
                    )
            except Exception as e:
                logger.error(f"Failed to fetch usage from DB for {agency_id}: {e}")

        # Update cache
        self._usage_cache[agency_id] = {
            "api_calls": usage.api_calls,
            "commands": usage.commands,
            "tokens_used": usage.tokens_used,
            "cost_cents": usage.cost_cents,
        }
        self._cache_timestamp[agency_id] = datetime.now()

        return usage

    def record_usage(self, event: UsageEvent) -> bool:
        """Record a usage event to DB and update cache."""
        # Update local cache for immediate feedback
        target_id = event.agency_id or event.user_id
        if target_id not in self._usage_cache:
            self._usage_cache[target_id] = {
                "api_calls": 0,
                "commands": 0,
                "tokens_used": 0,
                "cost_cents": 0,
            }

        if event.action == "api_call":
            self._usage_cache[target_id]["api_calls"] += 1
        elif event.action == "command_exec":
            self._usage_cache[target_id]["commands"] += 1

        self._usage_cache[target_id]["tokens_used"] += event.tokens_used
        self._usage_cache[target_id]["cost_cents"] += event.cost_cents

        # Persist to database
        if self.db:
            try:
                payload = {
                    "user_id": event.user_id,
                    "agency_id": event.agency_id,
                    "action": event.action,
                    "metadata": event.metadata,
                    "tokens_used": event.tokens_used,
                    "cost_cents": event.cost_cents,
                    "command": event.command,
                }
                # Remove None values
                payload = {k: v for k, v in payload.items() if v is not None}

                self.db.from_("usage_logs").insert(payload).execute()
                return True
            except Exception as e:
                logger.error(f"Failed to record usage in DB: {e}")

        return False

    def get_usage_warnings(
        self, user_id: str, tier: SubscriptionTier, limits: TierLimits
    ) -> UsageWarning:
        """Check quota and return warning if approaching limit (>80%)."""
        agency_id = user_id  # This should come from subscription
        usage = self.get_monthly_usage(agency_id)

        warnings = []
        is_critical = False

        # Check API Calls
        if limits.monthly_api_calls != -1:
            used = usage.api_calls
            limit = limits.monthly_api_calls
            if used >= limit:
                warnings.append(f"⛔️ API Quota Exceeded ({used}/{limit})")
                is_critical = True
            elif used >= limit * 0.8:
                warnings.append(f"⚠️ API Quota Low ({used}/{limit})")

        # Check Commands
        if limits.monthly_commands != -1:
            used = usage.commands
            limit = limits.monthly_commands
            if used >= limit:
                warnings.append(f"⛔️ Command Quota Exceeded ({used}/{limit})")
                is_critical = True
            elif used >= limit * 0.8:
                warnings.append(f"⚠️ Command Quota Low ({used}/{limit})")

        return UsageWarning(
            tier=tier.value,
            warnings=warnings,
            is_critical=is_critical,
            has_warning=len(warnings) > 0,
        )

    def clear_cache(self, agency_id: Optional[str] = None) -> None:
        """Clear usage cache for specific agency or all."""
        if agency_id:
            self._usage_cache.pop(agency_id, None)
            self._cache_timestamp.pop(agency_id, None)
        else:
            self._usage_cache.clear()
            self._cache_timestamp.clear()

    def get_usage_stats(self, agency_id: str, days: int = 30) -> Dict:
        """Get usage statistics for the last N days."""
        # This would require more complex DB queries
        # For now, return current month's usage
        usage = self.get_monthly_usage(agency_id)
        return {
            "api_calls": usage.api_calls,
            "commands": usage.commands,
            "tokens_used": usage.tokens_used,
            "cost_cents": usage.cost_cents,
            "period_days": days,
        }
