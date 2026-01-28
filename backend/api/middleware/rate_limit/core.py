"""
Core rate limiting logic and limiter initialization.
"""
import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.api.config.settings import settings
from backend.api.middleware.multitenant import get_current_tenant
from backend.api.utils.endpoint_categorization import (
    categorize_endpoint,
    get_rate_limit_key,
    should_skip_rate_limit,
)

logger = logging.getLogger(__name__)

# Initialize rate limiter with Redis backend if in production, else memory
storage_uri = settings.redis_url if settings.is_production else "memory://"
limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)

def get_plan_limits():
    """Get rate limits from config."""
    return settings.rate_limits_by_plan

DEFAULT_LIMITS = {
    "default": "60/minute",
    "health": "100/minute",
    "docs": "30/minute",
    "webhooks": "20/minute",
}

def get_tenant_limit(request) -> str:
    """Get rate limit based on tenant plan."""
    try:
        tenant = get_current_tenant(request)
        plan = tenant.plan

        category = categorize_endpoint(request.url.path, request.method)

        if should_skip_rate_limit(category):
            return "1000/minute"

        rate_key = get_rate_limit_key(category)
        limits = get_plan_limits().get(plan, get_plan_limits()["free"])
        limit = limits.get(rate_key, limits["default"])

        logger.debug(f"Rate limit for tenant {tenant.tenant_id} ({plan}): {limit}")
        return limit

    except Exception as e:
        logger.debug(f"Unable to get tenant limit, using default: {e}")
        category = categorize_endpoint(request.url.path, request.method)

        if should_skip_rate_limit(category):
            return "1000/minute"

        rate_key = get_rate_limit_key(category)
        return DEFAULT_LIMITS.get(rate_key, DEFAULT_LIMITS["default"])
