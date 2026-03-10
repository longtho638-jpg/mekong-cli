"""Quota status API endpoints for dashboard integration.

Provides real-time quota consumption, overage status, and tier info.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from src.api.raas_auth_middleware import require_tenant
from src.api.raas_billing_service import get_billing_service
from src.raas.auth import TenantContext
from src.raas.credit_rate_limiter import (
    TIER_LIMITS,
    get_overage_config,
)

quota_router = APIRouter(prefix="/v1/quota", tags=["quota"])


@quota_router.get("/status")
def get_quota_status(
    tenant: TenantContext = Depends(require_tenant),
) -> dict:
    """Get real-time quota status for authenticated tenant.

    Returns usage, limits, overage info, and warning flags.
    """
    service = get_billing_service()
    balance = service.get_balance(tenant.tenant_id)
    tier = balance.get("plan", "free")
    overage_cfg = get_overage_config(tier)

    # Calculate warning status
    limit = balance["mcu_limit"]
    used = balance["mcu_used"]
    usage_pct = (used / limit * 100) if limit > 0 else 0

    return {
        "tenant_id": tenant.tenant_id,
        "tier": tier,
        "usage": {
            "mcu_used": used,
            "mcu_limit": limit,
            "mcu_remaining": balance["mcu_remaining"],
            "usage_percentage": round(usage_pct, 1),
        },
        "overage": {
            "allow_overage": overage_cfg.allow_overage,
            "overage_rate": overage_cfg.overage_rate_per_credit,
            "overage_credits": balance.get("overage_credits", 0),
            "overage_charges_usd": balance.get("overage_charges_usd", 0.0),
            "max_overage_credits": overage_cfg.max_overage_credits,
        },
        "warnings": {
            "approaching_limit": usage_pct >= overage_cfg.warning_threshold_pct,
            "quota_exceeded": used >= limit,
            "overage_cap_reached": (
                overage_cfg.max_overage_credits > 0
                and balance.get("overage_credits", 0)
                >= overage_cfg.max_overage_credits
            ),
        },
    }


@quota_router.get("/tiers")
def list_tier_limits() -> dict:
    """List all tier limits and overage pricing (public endpoint)."""
    tiers = {}
    for tier_name, limits in TIER_LIMITS.items():
        overage_cfg = get_overage_config(tier_name)
        tiers[tier_name] = {
            "daily_limit": limits["daily"],
            "monthly_limit": limits["monthly"],
            "allow_overage": overage_cfg.allow_overage,
            "overage_rate_per_credit": overage_cfg.overage_rate_per_credit,
            "max_overage_credits": overage_cfg.max_overage_credits,
            "warning_threshold_pct": overage_cfg.warning_threshold_pct,
        }
    return {"tiers": tiers}


@quota_router.get("/history")
def get_usage_history(
    tenant: TenantContext = Depends(require_tenant),
    limit: int = 50,
) -> dict:
    """Get recent usage history for authenticated tenant."""
    service = get_billing_service()
    history = service.get_history(tenant.tenant_id, limit=limit)
    balance = service.get_balance(tenant.tenant_id)
    return {
        "tenant_id": tenant.tenant_id,
        "tier": balance.get("plan", "free"),
        "entries": history,
        "total_entries": len(history),
    }
