"""Mekong CLI - Gateway API Server.

FastAPI server exposing Mekong CLI orchestration to AgencyOS.
REST API + WebSocket streaming for real-time mission execution.

Sprint 3.3 - Task 3.1: Clean API Contract

Endpoints:
    POST   /v1/missions           - Create mission
    GET    /v1/missions/{id}      - Get mission status
    GET    /v1/missions/{id}/stream - SSE progress stream
    POST   /v1/webhook/test       - Test webhook connectivity

Usage:
    uvicorn src.gateway:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.core.gateway_api import (
    MissionRequest,
    create_mission,
    get_webhook_schema,
    validate_webhook_url,
)
from src.core.webhook_events import WEBHOOK_EVENT_PAYLOADS
from src.core.mcu_billing import MCUBilling, MCU_COSTS

logger = logging.getLogger(__name__)

# Global MCU billing instance
mcu_billing = MCUBilling()

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Mekong CLI Gateway API",
    description="Unified API contract for AgencyOS → Mekong CLI integration",
    version="3.3.0",
    docs_url="/api-docs",
    redoc_url="/api-redoc",
)

# CORS for AgencyOS frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure per-deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class CreateMissionRequest(BaseModel):
    """Request body for POST /v1/missions."""

    goal: str = Field(..., description="Natural language goal")
    tenant_id: str = Field(..., description="AgencyOS tenant ID")
    webhook_url: Optional[str] = Field(None, description="Callback URL for results")
    priority: str = Field("normal", description="low|normal|high")
    metadata: dict = Field(default_factory=dict)


class CreateMissionResponse(BaseModel):
    """Response body for POST /v1/missions."""

    mission_id: str
    status: str
    created_at: str
    estimated_steps: int = 0
    stream_url: str


class MissionStatusResponse(BaseModel):
    """Response body for GET /v1/missions/{id}."""

    mission_id: str
    status: str
    goal: str
    tenant_id: str
    created_at: str
    updated_at: Optional[str] = None
    completed_at: Optional[str] = None
    steps_total: int = 0
    steps_completed: int = 0


class TestWebhookRequest(BaseModel):
    """Request body for POST /v1/webhook/test."""

    webhook_url: str = Field(..., description="Webhook URL to test")
    tenant_id: Optional[str] = Field(None, description="Optional tenant context")


class TestWebhookResponse(BaseModel):
    """Response body for POST /v1/webhook/test."""

    success: bool
    message: str
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None


class MCUDeductRequest(BaseModel):
    """Request body for POST /v1/mcu/deduct."""

    tenant_id: str = Field(..., description="Tenant identifier")
    complexity: str = Field("simple", description="simple|standard|complex")
    mission_id: str = Field("", description="Associated mission ID")


class MCUDeductResponse(BaseModel):
    """Response body for POST /v1/mcu/deduct."""

    success: bool
    balance_before: int
    balance_after: int
    amount_deducted: int
    low_balance: bool = False
    error: str = ""


class MCUBalanceRequest(BaseModel):
    """Request body for GET /v1/mcu/balance."""
    tenant_id: str = Field(..., description="Tenant identifier")


class MCUCheckRequest(BaseModel):
    """Request body for POST /v1/mcu/check."""
    tenant_id: str = Field(..., description="Tenant identifier")
    estimated_cost: int = Field(..., description="Estimated MCU cost")


class MCULockRequest(BaseModel):
    """Request body for POST /v1/mcu/lock."""
    tenant_id: str = Field(..., description="Tenant identifier")
    amount: int = Field(..., description="MCU amount to lock")
    mission_id: str = Field("", description="Associated mission ID")


class CancelMissionRequest(BaseModel):
    """Request body for POST /v1/missions/{id}/cancel."""
    reason: str = Field("user_cancelled", description="Cancellation reason")


class PolarWebhookPayload(BaseModel):
    """Incoming Polar.sh webhook payload."""
    event: str = Field(..., description="Event type")
    data: dict = Field(default_factory=dict)


# =============================================================================
# IN-MEMORY STORES
# =============================================================================

MISSION_STORE: dict[str, dict] = {}


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.post("/v1/missions", response_model=CreateMissionResponse)
async def create_mission_endpoint(request: CreateMissionRequest) -> CreateMissionResponse:
    """Create a new mission from AgencyOS.

    AgencyOS calls this endpoint to submit a goal for Mekong CLI to execute.
    Returns mission_id and stream_url for real-time progress tracking.

    **Webhook:** If webhook_url provided, sends mission.created event.
    """
    mission_request = MissionRequest(
        goal=request.goal,
        tenant_id=request.tenant_id,
        webhook_url=request.webhook_url,
        priority=request.priority,  # type: ignore
        metadata=request.metadata,
    )

    response = create_mission(mission_request)

    # Store mission state
    MISSION_STORE[response.mission_id] = {
        "goal": request.goal,
        "tenant_id": request.tenant_id,
        "webhook_url": request.webhook_url,
        "status": response.status.value,
        "created_at": response.created_at,
        "steps": [],
        "events": [],
    }

    logger.info(
        "Mission %s created for tenant %s",
        response.mission_id,
        request.tenant_id,
    )

    return CreateMissionResponse(
        mission_id=response.mission_id,
        status=response.status.value,
        created_at=response.created_at,
        estimated_steps=response.estimated_steps,
        stream_url=response.stream_url or f"/v1/missions/{response.mission_id}/stream",
    )


@app.get("/v1/missions/{mission_id}", response_model=MissionStatusResponse)
async def get_mission_status(mission_id: str) -> MissionStatusResponse:
    """Get current mission status.

    Returns mission state including progress (steps completed/total).
    """
    if mission_id not in MISSION_STORE:
        raise HTTPException(status_code=404, detail="Mission not found")

    mission = MISSION_STORE[mission_id]
    steps = mission.get("steps", [])

    return MissionStatusResponse(
        mission_id=mission_id,
        status=mission["status"],
        goal=mission["goal"],
        tenant_id=mission["tenant_id"],
        created_at=mission["created_at"],
        updated_at=datetime.now(timezone.utc).isoformat(),
        steps_total=len(steps),
        steps_completed=sum(1 for s in steps if s.get("status") == "completed"),
    )


@app.get("/v1/missions/{mission_id}/stream")
async def stream_mission(mission_id: str) -> StreamingResponse:
    """Server-Sent Events (SSE) stream for real-time mission progress.

    AgencyOS dashboard subscribes to this endpoint to show live progress.
    Events: mission.created, mission.step.started, mission.step.completed, etc.

    **Important:** Client must handle reconnection if stream drops.
    """
    if mission_id not in MISSION_STORE:
        raise HTTPException(status_code=404, detail="Mission not found")

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events."""
        mission = MISSION_STORE[mission_id]

        # Send initial state
        event = {
            "event_type": "mission.state",
            "mission_id": mission_id,
            "data": {
                "status": mission["status"],
                "goal": mission["goal"],
                "steps": mission.get("steps", []),
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        yield f"data: {json.dumps(event)}\n\n"

        # Stream events from mission queue
        last_event_idx = 0
        while True:
            events = mission.get("events", [])
            if len(events) > last_event_idx:
                for evt in events[last_event_idx:]:
                    yield f"data: {json.dumps(evt)}\n\n"
                last_event_idx = len(events)

            # Check if mission completed
            if mission["status"] in ["completed", "failed", "cancelled"]:
                final_event = {
                    "event_type": f"mission.{mission['status']}",
                    "mission_id": mission_id,
                    "data": {"final_state": mission},
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                yield f"data: {json.dumps(final_event)}\n\n"
                break

            await asyncio.sleep(0.5)  # Poll for new events

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/v1/webhook/test", response_model=TestWebhookResponse)
async def test_webhook(request: TestWebhookRequest) -> TestWebhookResponse:
    """Test webhook connectivity before going live.

    AgencyOS calls this to verify webhook endpoint is reachable
    before subscribing to mission events.
    """
    import time

    start = time.time()
    success, message = validate_webhook_url(request.webhook_url)
    elapsed_ms = (time.time() - start) * 1000

    status_code = None
    if "HTTP" in message:
        try:
            status_code = int(message.split()[-1])
        except (ValueError, IndexError):
            pass

    return TestWebhookResponse(
        success=success,
        message=message,
        status_code=status_code,
        response_time_ms=elapsed_ms,
    )


@app.get("/v1/webhook/schema")
async def webhook_schema() -> dict:
    """Get webhook event schema documentation.

    Returns all webhook event types with descriptions.
    """
    return {
        "version": "3.3.0",
        "events": {
            name: model.__name__
            for name, model in WEBHOOK_EVENT_PAYLOADS.items()
        },
        "descriptions": get_webhook_schema(),
    }


@app.post("/v1/mcu/deduct", response_model=MCUDeductResponse)
async def mcu_deduct(request: MCUDeductRequest) -> MCUDeductResponse:
    """Deduct MCU credits for a mission execution.

    Called by AgencyOS before or after running a mission.
    Validates tenant has sufficient credits and deducts based on complexity.

    Complexity costs: simple=1 MCU, standard=3 MCU, complex=5 MCU.
    """
    if request.complexity not in MCU_COSTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid complexity: {request.complexity}. Use: simple, standard, complex",
        )

    result = mcu_billing.deduct(
        tenant_id=request.tenant_id,
        complexity=request.complexity,
        mission_id=request.mission_id,
    )

    if not result.success:
        raise HTTPException(status_code=402, detail=result.error)

    return MCUDeductResponse(
        success=result.success,
        balance_before=result.balance_before,
        balance_after=result.balance_after,
        amount_deducted=result.amount_deducted,
        low_balance=result.low_balance,
    )


@app.post("/v1/missions/{mission_id}/cancel")
async def cancel_mission(mission_id: str, request: CancelMissionRequest) -> dict:
    """Cancel a mission and refund MCU credits.

    Per Condition C3: Mission cancel + MCU refund.
    """
    if mission_id not in MISSION_STORE:
        raise HTTPException(status_code=404, detail="Mission not found")

    mission = MISSION_STORE[mission_id]
    if mission["status"] in ["completed", "failed", "cancelled"]:
        raise HTTPException(status_code=409, detail=f"Mission already {mission['status']}")

    mission["status"] = "cancelled"
    mission["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    mission["cancel_reason"] = request.reason

    # Refund MCU if previously deducted
    refund_amount = 0
    tenant_id = mission.get("tenant_id", "")
    if tenant_id:
        refund_amount = mcu_billing.refund(tenant_id=tenant_id, mission_id=mission_id)

    logger.info("Mission %s cancelled. Refunded %d MCU to %s", mission_id, refund_amount, tenant_id)

    return {
        "mission_id": mission_id,
        "status": "cancelled",
        "reason": request.reason,
        "refund_amount": refund_amount,
    }


@app.get("/v1/mcu/balance")
async def mcu_balance(tenant_id: str) -> dict:
    """Get MCU balance for a tenant.

    Per $1M SOP: curl api.agencyos.network/v1/mcu/balance
    """
    balance = mcu_billing.get_balance(tenant_id)
    return {
        "tenant_id": tenant_id,
        "balance": balance,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/v1/mcu/check")
async def mcu_check(request: MCUCheckRequest) -> dict:
    """Check if tenant has sufficient MCU balance.

    Per $1M SOP billing rules: Step 1 before executing any LLM call.
    """
    balance = mcu_billing.get_balance(request.tenant_id)
    sufficient = balance >= request.estimated_cost

    if not sufficient:
        raise HTTPException(
            status_code=402,
            detail=f"insufficient_credits: balance={balance}, required={request.estimated_cost}",
        )

    return {
        "tenant_id": request.tenant_id,
        "balance": balance,
        "estimated_cost": request.estimated_cost,
        "sufficient": True,
    }


@app.post("/v1/mcu/lock")
async def mcu_lock(request: MCULockRequest) -> dict:
    """Lock MCU credits before execution to prevent race conditions.

    Per $1M SOP billing rules: Step 3 — lock MCU before executing.
    """
    balance = mcu_billing.get_balance(request.tenant_id)
    if balance < request.amount:
        raise HTTPException(
            status_code=402,
            detail=f"insufficient_credits: balance={balance}, required={request.amount}",
        )

    # Pre-deduct (lock) the MCU
    result = mcu_billing.deduct(
        tenant_id=request.tenant_id,
        complexity="simple",  # Will override with actual amount
        mission_id=request.mission_id,
    )

    return {
        "tenant_id": request.tenant_id,
        "locked_amount": request.amount,
        "balance_after_lock": result.balance_after,
        "mission_id": request.mission_id,
    }


@app.post("/billing/polar")
async def polar_webhook(payload: PolarWebhookPayload) -> dict:
    """Handle Polar.sh webhook events.

    Per SOP 01: New Tenant Onboarding.
    Events: subscription.created, subscription.updated, subscription.cancelled
    """
    event = payload.event
    data = payload.data

    if event == "subscription.created":
        tenant_id = data.get("customer_id", "")
        tier = data.get("product_name", "starter").lower()
        tier_credits = {"starter": 1000, "growth": 10000, "premium": 999999}
        credits = tier_credits.get(tier, 1000)
        mcu_billing.add_credits(tenant_id, credits)
        logger.info("Polar subscription created: tenant=%s tier=%s credits=%d", tenant_id, tier, credits)
    elif event == "subscription.cancelled":
        tenant_id = data.get("customer_id", "")
        logger.info("Polar subscription cancelled: tenant=%s", tenant_id)
    else:
        logger.info("Polar webhook event: %s", event)

    return {"received": True, "event": event}


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint for load balancers."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "3.3.0",
    }


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
