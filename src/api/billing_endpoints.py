"""
Mekong CLI - Billing API Endpoints

FastAPI endpoints for billing queries, batch submission, and usage analytics.
"""

from __future__ import annotations

import hmac
import logging
import time
from datetime import date, datetime, timedelta
from hashlib import sha256
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from src.db.repository import get_repository, LicenseRepository
from src.billing.engine import (
    BillingEngine,
    get_engine,
    get_rate_resolver,
)
from src.billing.idempotency import (
    IdempotencyManager,
    get_idempotency_manager,
)
from src.billing.reconciliation import (
    ReconciliationService,
    get_reconciliation_service,
)
from src.billing.event_emitter import get_emitter

logger = logging.getLogger(__name__)

billing_router = APIRouter(prefix="/billing", tags=["billing"])


def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
) -> bool:
    """
    Verify webhook signature using HMAC-SHA256.

    Args:
        payload: Raw request body
        signature: X-Webhook-Signature header value
        secret: Webhook secret from environment

    Returns:
        True if signature matches, False otherwise
    """
    if not secret:
        logger.warning("WEBHOOK_SECRET not configured - skipping verification")
        return True  # Allow unsigned events if secret not set

    if not signature:
        return False

    expected_signature = f"sha256={hmac.new(secret.encode(), payload, sha256).hexdigest()}"
    return hmac.compare_digest(expected_signature, signature)


# ============================================================================
# Request/Response Models
# ============================================================================


class UsageEventInput(BaseModel):
    """Usage event input for batch billing."""

    event_type: str = Field(..., description="Event type (api_call, token_input, etc.)")
    metric: str = Field(..., description="Metric name")
    value: float = Field(..., description="Usage value")
    model: Optional[str] = Field(None, description="Model name if applicable")
    timestamp: Optional[datetime] = Field(None, description="Event timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BatchBillingRequest(BaseModel):
    """Batch billing request."""

    license_key: str = Field(..., description="License key")
    events: List[UsageEventInput] = Field(..., description="Usage events to bill")
    batch_id: Optional[str] = Field(None, description="Optional batch ID for idempotency")
    period_start: Optional[date] = Field(None, description="Billing period start")
    period_end: Optional[date] = Field(None, description="Billing period end")


class BatchBillingResponse(BaseModel):
    """Batch billing response."""

    batch_id: str
    license_key: str
    status: str
    billing_record_id: Optional[str]
    total_charge: str
    line_items_count: int
    is_duplicate: bool
    error_message: Optional[str]
    created_at: Optional[str]


class BillingPeriodResponse(BaseModel):
    """Billing period details."""

    period_id: str
    license_key: str
    start_date: str
    end_date: str
    status: str
    total_amount: str
    base_fee: str
    overage_fee: str
    currency: str


class UsageSummaryResponse(BaseModel):
    """Usage summary for a license."""

    license_key: str
    key_id: str
    tier: str
    period_start: str
    period_end: str
    total_usage: Dict[str, float]
    included_quantity: Dict[str, float]
    overage_quantity: Dict[str, float]
    estimated_charge: str
    currency: str


class RateCardResponse(BaseModel):
    """Rate card details."""

    plan_tier: str
    event_type: str
    model_name: Optional[str]
    unit: str
    unit_price: str
    included_quantity: str
    overage_rate: Optional[str]
    valid_from: str
    valid_to: Optional[str]


class ReconciliationStatusResponse(BaseModel):
    """Reconciliation status for a license."""

    audit_id: str
    license_key: str
    audit_date: str
    expected_amount: str
    actual_amount: str
    variance: str
    variance_percent: float
    status: str
    discrepancies: List[Dict[str, Any]]


# ============================================================================
# Helper Functions
# ============================================================================


async def get_license_key_or_404(
    license_key: str,
    repository: LicenseRepository = Depends(lambda: get_repository()),
) -> Dict:
    """Validate license key exists."""
    license_info = await repository.get_license_by_key(license_key)
    if not license_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"License not found: {license_key}",
        )
    return license_info


# ============================================================================
# Billing Endpoints
# ============================================================================


@billing_router.post("/batch-bill", response_model=BatchBillingResponse)
async def submit_batch_billing(
    request: BatchBillingRequest,
    engine: BillingEngine = Depends(lambda: get_engine()),
    idempotency_manager: IdempotencyManager = Depends(lambda: get_idempotency_manager()),
    emitter=Depends(lambda: get_emitter()),
    repository: LicenseRepository = Depends(lambda: get_repository()),
) -> BatchBillingResponse:
    """
    Submit a batch of usage events for billing.

    - **Idempotent**: Same batch_id will not be processed twice
    - **Atomic**: All events in batch are billed together
    - **Tracked**: Emits billing events for analytics sync
    """
    start_time = time.time()

    # Validate license
    license_info = await get_license_key_or_404(request.license_key)
    key_id = license_info.get("key_id", "")

    # Convert events to dict format
    events_dict = [
        {
            "event_type": e.event_type,
            "metric": e.metric,
            "value": e.value,
            "model": e.model,
            "timestamp": e.timestamp or datetime.now(),
            "metadata": e.metadata,
        }
        for e in request.events
    ]

    # Generate batch ID if not provided
    if not request.batch_id:
        batch_id = idempotency_manager.generate_batch_id(
            license_key=request.license_key,
            events=events_dict,
        )
    else:
        batch_id = request.batch_id

    # Define processing function
    async def process_batch(events: List[Dict]) -> str:
        """Process batch and return billing record ID."""
        # Calculate charges
        from src.core.usage_metering import UsageEvent

        usage_events = [
            UsageEvent(
                event_type=e["event_type"],
                category="usage",
                metric=e["metric"],
                value=e["value"],
                timestamp=e["timestamp"].timestamp() if isinstance(e["timestamp"], datetime) else e["timestamp"],
                metadata=e.get("metadata", {}),
            )
            for e in events
        ]

        # Calculate billing
        period_start = datetime.combine(request.period_start or date.today(), datetime.min.time())
        period_end = datetime.combine(
            request.period_end or (date.today() + timedelta(days=1)),
            datetime.min.time(),
        )

        billing_result = await engine.calculate_charges(
            license_key=request.license_key,
            usage_events=usage_events,
            period_start=period_start,
            period_end=period_end,
        )

        # Create billing record in database
        # (This would use repository.create_billing_record - simplified for now)
        billing_record_id = f"br_{batch_id}_{int(time.time())}"

        # Emit event
        emitter.emit_billing_recorded(billing_result, billing_record_id)

        return billing_record_id

    # Process with idempotency
    batch_result = await idempotency_manager.process_batch(
        batch_id=batch_id,
        license_key=request.license_key,
        key_id=key_id,
        events=events_dict,
        process_fn=process_batch,
    )

    # Calculate processing duration
    duration_ms = int((time.time() - start_time) * 1000)

    # Emit batch processed event
    emitter.emit_billing_batch_processed(
        batch_result=batch_result,
        events_count=len(request.events),
        processing_duration_ms=duration_ms,
    )

    # Handle idempotency conflict
    if batch_result.is_duplicate and batch_result.status == "completed":
        emitter.emit_billing_idempotency_conflict(
            batch_id=batch_id,
            license_key=request.license_key,
            original_billing_record_id=batch_result.billing_record_id,
            conflict_timestamp=datetime.now(),
        )

    return BatchBillingResponse(
        batch_id=batch_result.batch_id,
        license_key=batch_result.license_key,
        status=batch_result.status.value,
        billing_record_id=batch_result.billing_record_id,
        total_charge=str(batch_result.total_charge),
        line_items_count=0,  # Would get from billing_result
        is_duplicate=batch_result.is_duplicate,
        error_message=batch_result.error_message,
        created_at=batch_result.created_at.isoformat() if batch_result.created_at else None,
    )


@billing_router.get("/period/{license_key}", response_model=BillingPeriodResponse)
async def get_billing_period(
    license_key: str,
    start_date: date = Query(..., description="Period start date"),
    end_date: date = Query(..., description="Period end date"),
    repository: LicenseRepository = Depends(lambda: get_repository()),
) -> BillingPeriodResponse:
    """Get billing period details for a license."""
    # Validate license
    await get_license_key_or_404(license_key)

    # Get billing period
    period = await repository.get_billing_period(license_key, start_date, end_date)

    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Billing period not found: {start_date} to {end_date}",
        )

    return BillingPeriodResponse(
        period_id=period["id"],
        license_key=period["license_key"],
        start_date=period["start_date"].isoformat() if isinstance(period["start_date"], date) else str(period["start_date"]),
        end_date=period["end_date"].isoformat() if isinstance(period["end_date"], date) else str(period["end_date"]),
        status=period["status"],
        total_amount=str(period["total_amount"]),
        base_fee=str(period["base_fee"]),
        overage_fee=str(period.get("overage_fee", 0)),
        currency=period.get("currency", "USD"),
    )


@billing_router.get("/usage/{license_key}/summary", response_model=UsageSummaryResponse)
async def get_usage_summary(
    license_key: str,
    period_start: Optional[date] = Query(None, description="Period start"),
    period_end: Optional[date] = Query(None, description="Period end"),
    engine: BillingEngine = Depends(lambda: get_engine()),
    repository: LicenseRepository = Depends(lambda: get_repository()),
) -> UsageSummaryResponse:
    """Get usage summary for a license."""
    # Validate license
    license_info = await get_license_key_or_404(license_key)
    key_id = license_info.get("key_id", "")
    tier = license_info.get("tier", "free")

    # Default to current billing period (month)
    today = date.today()
    if not period_start:
        period_start = today.replace(day=1)
    if not period_end:
        # End of month
        if today.month == 12:
            period_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            period_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

    # Calculate charges
    billing_result = await engine.calculate_period_charges(
        license_key=license_key,
        period_start=datetime.combine(period_start, datetime.min.time()),
        period_end=datetime.combine(period_end, datetime.min.time()),
    )

    # Get rate cards for included quantities
    rate_resolver = get_rate_resolver()
    included = {}
    for event_type in ["api_call", "token_input", "token_output", "agent_spawn"]:
        rate_card = await rate_resolver.resolve(license_key, event_type)
        if rate_card:
            included[event_type] = float(rate_card.included_quantity)

    # Format usage from line items
    total_usage = {}
    for item in billing_result.line_items:
        total_usage[item.event_type] = float(item.quantity)

    # Calculate overage
    overage = {}
    for event_type, usage in total_usage.items():
        incl = included.get(event_type, 0)
        if usage > incl:
            overage[event_type] = usage - incl

    return UsageSummaryResponse(
        license_key=license_key,
        key_id=key_id,
        tier=tier,
        period_start=period_start.isoformat(),
        period_end=period_end.isoformat(),
        total_usage=total_usage,
        included_quantity=included,
        overage_quantity=overage,
        estimated_charge=str(billing_result.total),
        currency=billing_result.currency,
    )


@billing_router.get("/rate-cards/{plan_tier}", response_model=List[RateCardResponse])
async def get_rate_cards(
    plan_tier: str,
    repository: LicenseRepository = Depends(lambda: get_repository()),
) -> List[RateCardResponse]:
    """Get rate cards for a plan tier."""
    # This would require a new repository method: get_rate_cards_by_tier
    # For now, return empty list - implementation needs DB query
    return []


@billing_router.post("/reconcile/{license_key}")
async def trigger_reconciliation(
    license_key: str,
    audit_date: Optional[date] = Query(None, description="Date to reconcile"),
    service: ReconciliationService = Depends(lambda: get_reconciliation_service()),
) -> Dict[str, Any]:
    """
    Trigger reconciliation for a license.

    Runs the reconciliation audit for the specified date.
    """
    # Validate license
    await get_license_key_or_404(license_key)

    # Run reconciliation
    results = await service.run_daily_reconciliation(audit_date=audit_date or date.today())

    # Find result for this license
    license_result = next((r for r in results if r.license_key == license_key), None)

    if not license_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reconciliation failed",
        )

    return license_result.to_dict()


@billing_router.get("/reconciliation/{license_key}/status")
async def get_reconciliation_status(
    license_key: str,
    audit_date: date = Query(..., description="Audit date"),
    repository: LicenseRepository = Depends(lambda: get_repository()),
) -> ReconciliationStatusResponse:
    """Get reconciliation status for a license on a specific date."""
    # Validate license
    await get_license_key_or_404(license_key)

    # This would require a repository method to fetch audit by license + date
    # Placeholder implementation
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Audit not found for {license_key} on {audit_date}",
    )


@billing_router.get("/health")
async def billing_health_check() -> Dict[str, str]:
    """Health check for billing service."""
    return {
        "status": "healthy",
        "service": "mekong-billing",
        "version": "1.0.0",
    }


# ============================================================================
# Webhook Endpoints
# ============================================================================


@billing_router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
) -> Dict[str, str]:
    """
    Stripe webhook endpoint for billing events.

    Expected event types:
    - invoice.payment_succeeded
    - invoice.payment_failed
    - customer.subscription.updated
    - customer.subscription.deleted
    """
    import os

    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    signature = request.headers.get("Stripe-Signature", "")

    if not webhook_secret:
        logger.warning("STRIPE_WEBHOOK_SECRET not configured")

    try:
        payload = await request.body()
        event = await request.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {exc}",
        ) from exc

    # Verify signature if secret configured
    if webhook_secret and signature:
        expected_sig = (
            f"sha256={hmac.new(webhook_secret.encode(), payload, sha256).hexdigest()}"
        )
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )

    # Process event
    event_type = event.get("type", "unknown")
    logger.info(f"Received Stripe webhook: {event_type}")

    return {"status": "received", "event_type": event_type}


@billing_router.post("/webhook/polar")
async def polar_webhook(
    request: Request,
) -> Dict[str, str]:
    """
    Polar webhook endpoint for subscription billing events.

    Expected event types:
    - order.created
    - order.paid
    - order.refunded
    - subscription.renewed
    """
    import os

    webhook_secret = os.getenv("POLAR_WEBHOOK_SECRET", "")
    signature = request.headers.get("webhook-signature", "")

    if not webhook_secret:
        logger.warning("POLAR_WEBHOOK_SECRET not configured")

    try:
        payload = await request.body()
        event = await request.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {exc}",
        ) from exc

    # Verify signature if secret configured
    if webhook_secret and signature:
        expected_sig = (
            f"sha256={hmac.new(webhook_secret.encode(), payload, sha256).hexdigest()}"
        )
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )

    # Process event
    event_type = event.get("type", "unknown")
    logger.info(f"Received Polar webhook: {event_type}")

    return {"status": "received", "event_type": event_type}
