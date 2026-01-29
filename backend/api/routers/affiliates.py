"""
Affiliate API Router - Management and Tracking endpoints.
"""

from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse

from backend.api.auth.dependencies import get_current_user
from backend.api.auth.utils import TokenData
from backend.api.config import settings
from backend.api.schemas.affiliate import (
    AffiliateCreate,
    AffiliateResponse,
    AffiliateStats,
    AffiliateUpdate,
    LinkCreate,
    LinkResponse,
    PayoutResponse,
)
from backend.api.security.rbac import require_admin
from backend.api.services.affiliate_service import AffiliateService

router = APIRouter(prefix="/affiliates", tags=["affiliates"])


def get_affiliate_service() -> AffiliateService:
    return AffiliateService()


# --- Public Tracking ---


@router.get("/track/{code}")
async def track_click(
    code: str,
    response: Response,
    next_url: Optional[str] = None,
    service: AffiliateService = Depends(get_affiliate_service),
):
    """
    Track an affiliate click and redirect to destination.
    Sets a cookie with the affiliate code for attribution.
    """
    affiliate = service.get_affiliate_by_code(code)
    if not affiliate:
        # If code invalid, just redirect without tracking (or 404?)
        # Better to just redirect to home to not lose traffic
        target = next_url or settings.frontend_url
        return RedirectResponse(url=target)

    # Record click (Optionally track this in DB if needed for "Clicks" metric)
    # The current service doesn't have a generic "track_click" for raw codes,
    # only for specific links if we implemented that logic.
    # For MVP, we'll just set the cookie.

    # If we want to count clicks on the main profile code, we might need a
    # 'default' link or a counter on Affiliate model.
    # For now, let's assume we rely on specific links for detailed click tracking,
    # or we can add a lightweight click counter later.

    target = next_url or settings.frontend_url

    # Append ref param for external tracking (Gumroad/Stripe)
    separator = "&" if "?" in target else "?"
    target = f"{target}{separator}ref={code}"

    # Create redirect response
    redirect = RedirectResponse(url=target)

    # Set cookie (30 days)
    expiration = datetime.utcnow() + timedelta(days=30)
    redirect.set_cookie(
        key="affiliate_code",
        value=code,
        expires=expiration.strftime("%a, %d %b %Y %H:%M:%S GMT"),
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )

    return redirect


# --- Affiliate Endpoints ---


@router.post("/register", response_model=AffiliateResponse)
async def register_affiliate(
    data: AffiliateCreate,
    user: TokenData = Depends(get_current_user),
    service: AffiliateService = Depends(get_affiliate_service),
):
    """Register as an affiliate."""
    # Check if already registered
    existing = service.get_affiliate_by_user(str(user.id))
    if existing:
        raise HTTPException(status_code=400, detail="User is already an affiliate")

    # Use default tenant/agency ID or from user context if multitenant
    # For now assuming user belongs to the main agency context or passed via header?
    # Ideally we get agency_id from user's context.
    # Let's assume user.tenant_id exists or we fallback to settings.default_tenant

    agency_id = getattr(user, "tenant_id", settings.default_tenant)

    try:
        affiliate = service.create_affiliate(
            user_id=str(user.id),
            agency_id=agency_id,
            payment_email=data.payment_email,
            tax_id=data.tax_id,
        )
        return affiliate
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=AffiliateResponse)
async def get_my_profile(
    user: TokenData = Depends(get_current_user),
    service: AffiliateService = Depends(get_affiliate_service),
):
    """Get current user's affiliate profile."""
    affiliate = service.get_affiliate_by_user(str(user.id))
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate profile not found")
    return affiliate


@router.get("/me/stats", response_model=AffiliateStats)
async def get_my_stats(
    user: TokenData = Depends(get_current_user),
    service: AffiliateService = Depends(get_affiliate_service),
):
    """Get performance stats for dashboard."""
    affiliate = service.get_affiliate_by_user(str(user.id))
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate profile not found")

    return service.get_dashboard_stats(affiliate.id)


@router.get("/me/payouts", response_model=List[PayoutResponse])
async def get_my_payouts(
    user: TokenData = Depends(get_current_user),
    service: AffiliateService = Depends(get_affiliate_service),
):
    """Get payout history."""
    affiliate = service.get_affiliate_by_user(str(user.id))
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate profile not found")

    result = (
        service.client.table("payouts")
        .select("*")
        .eq("affiliate_id", affiliate.id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


# --- Admin Endpoints ---


@router.post("/{affiliate_id}/payout", dependencies=[Depends(require_admin)])
async def generate_payout(
    affiliate_id: str,
    period_end: date = Query(default_factory=date.today),
    min_threshold: float = 50.0,
    service: AffiliateService = Depends(get_affiliate_service),
):
    """
    Generate a payout for a specific affiliate.
    """
    period_start = period_end - timedelta(days=30)  # Rough default

    try:
        payout = service.generate_payout(
            affiliate_id=affiliate_id,
            period_start=period_start,
            period_end=period_end,
            min_threshold=min_threshold,
        )
        if not payout:
            return Response(status_code=204)  # No content / No payout generated
        return payout
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
