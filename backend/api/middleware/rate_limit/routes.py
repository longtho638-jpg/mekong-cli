"""
Rate limit monitoring routes.
"""
from fastapi import FastAPI, Request

from backend.api.middleware.multitenant import get_current_tenant
from .core import DEFAULT_LIMITS, get_plan_limits, get_tenant_limit
from .middleware import rate_limit


def setup_rate_limit_routes(app: FastAPI):
    """Setup rate limit monitoring routes."""

    @app.get("/api/rate-limits/status")
    @rate_limit("30/minute")
    async def get_rate_limit_status(request: Request):
        """Get current rate limit status."""
        try:
            tenant = get_current_tenant(request)
            plan = tenant.plan
            plan_limits = get_plan_limits()

            return {
                "tenant_id": tenant.tenant_id,
                "plan": plan,
                "limits": plan_limits.get(plan, plan_limits["free"]),
                "current_endpoint": request.url.path,
                "current_limit": get_tenant_limit(request),
            }
        except Exception as e:
            return {
                "error": "Unable to get rate limit status",
                "detail": str(e),
                "fallback_limits": DEFAULT_LIMITS,
            }

    @app.get("/api/rate-limits/plans")
    async def get_all_plan_limits():
        """Get rate limits for all plans."""
        return {
            "plans": get_plan_limits(),
            "default_limits": DEFAULT_LIMITS,
            "description": "Rate limits per request category and tenant plan",
        }
