from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel

from backend.services.ip_blocker import ip_blocker
from backend.services.rate_limiter_service import RateLimiterService

router = APIRouter(prefix="/admin/rate-limits", tags=["Admin - Rate Limits"])


# Mock admin dependency for now if not available
async def get_current_admin_user():
    return {"id": "admin", "role": "admin"}


class BlockIpRequest(BaseModel):
    ip_address: str
    reason: Optional[str] = None
    duration_seconds: int = 3600


class BlockedIpResponse(BaseModel):
    ip_address: str
    reason: Optional[str]
    blocked_at: str
    expires_at: Optional[str]


@router.get("/status/{key}")
async def get_rate_limit_status(
    key: str,
    admin=Depends(get_current_admin_user),
):
    """
    Get current rate limit status for a key.
    Key format: user:{user_id}:{endpoint} or ip:{ip}:{endpoint}
    """
    rate_limiter = RateLimiterService()
    status = await rate_limiter.get_status(key)
    return status


@router.delete("/reset/{key}")
async def reset_rate_limit(
    key: str,
    admin=Depends(get_current_admin_user),
):
    """
    Reset rate limit for a key (emergency use).
    """
    rate_limiter = RateLimiterService()
    await rate_limiter.reset(key)
    return {"success": True, "key": key}


@router.get("/top-users")
async def get_top_rate_limited_users(
    limit: int = 10,
    admin=Depends(get_current_admin_user),
):
    """
    Get users hitting rate limits most frequently.
    """
    rate_limiter = RateLimiterService()
    top_users = await rate_limiter.get_top_limited_users(limit)
    return {"top_users": top_users}


@router.get("/violations")
async def get_recent_violations(
    limit: int = 100,
    admin=Depends(get_current_admin_user),
):
    """
    Get recent rate limit violations.
    """
    from backend.services.rate_limit_monitor import rate_limit_monitor

    violations = await rate_limit_monitor.get_recent_violations(limit)
    return violations


# --- IP Blocklist Management ---


@router.post("/blocked-ips")
async def block_ip(
    request: BlockIpRequest,
    admin=Depends(get_current_admin_user),
):
    """
    Manually block an IP address.
    """
    await ip_blocker.block_ip(
        ip_address=request.ip_address,
        reason=request.reason,
        duration_seconds=request.duration_seconds,
        created_by=admin.get("id", "admin"),
    )
    return {"success": True, "message": f"IP {request.ip_address} blocked."}


@router.delete("/blocked-ips/{ip_address}")
async def unblock_ip(
    ip_address: str,
    admin=Depends(get_current_admin_user),
):
    """
    Unblock an IP address.
    """
    await ip_blocker.unblock_ip(ip_address)
    return {"success": True, "message": f"IP {ip_address} unblocked."}


@router.get("/blocked-ips")
async def get_blocked_ips(
    admin=Depends(get_current_admin_user),
):
    """
    Get all active blocked IPs.
    """
    ips = await ip_blocker.get_blocked_ips()
    # Format datetimes to string if needed, or rely on FastAPI json encoder
    return {"blocked_ips": ips}
