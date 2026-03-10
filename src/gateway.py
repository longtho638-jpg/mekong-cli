"""Mekong CLI - Gateway API Server.

FastAPI server exposing Mekong CLI orchestration to AgencyOS.
REST API + SSE streaming for real-time mission execution.

Sprint 3.3 - Task 3.1: Clean API Contract

Endpoints:
    POST   /v1/missions                 - Create mission
    GET    /v1/missions/{id}            - Get mission status
    GET    /v1/missions/{id}/stream     - SSE progress stream
    POST   /v1/webhook/test             - Test webhook connectivity
    GET    /v1/webhook/schema           - Webhook event schema
    GET    /health                      - Health check

Usage:
    uvicorn src.gateway:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.core.gateway_api import (
    MissionRequest,
    create_mission,
    get_webhook_schema,
    validate_webhook_url,
)
from src.core.mcu_billing import MCUBilling, MCU_COSTS
from src.core.webhook_events import WEBHOOK_EVENT_PAYLOADS
from src.core.api_key_manager import validate_api_key

logger = logging.getLogger(__name__)

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
    allow_origins=["*"],
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


# =============================================================================
# IN-MEMORY STORES
# =============================================================================

MISSION_STORE: dict[str, dict] = {}
mcu_billing = MCUBilling()


# =============================================================================
# ENDPOINTS
# =============================================================================

def _validate_api_key(x_api_key: str = Header(None, alias="X-API-Key")) -> str:
    """Validate X-API-Key header."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    result = validate_api_key(x_api_key)
    if not result.valid:
        raise HTTPException(status_code=401, detail=result.error or "Invalid API key")
    return result.tenant_id or ""


@app.post("/v1/missions", response_model=CreateMissionResponse)
async def create_mission_endpoint(
    request: CreateMissionRequest,
    background_tasks: BackgroundTasks,
) -> CreateMissionResponse:
    """Create a new mission from AgencyOS.

    AgencyOS calls this endpoint to submit a goal for Mekong CLI to execute.
    Returns mission_id and stream_url for real-time progress tracking.
    Uses hybrid router for background execution.

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
    mission_id = response.mission_id

    # Store mission state
    MISSION_STORE[mission_id] = {
        "goal": request.goal,
        "tenant_id": request.tenant_id,
        "webhook_url": request.webhook_url,
        "status": response.status.value,
        "created_at": response.created_at,
        "steps": [],
        "events": [],
    }

    # Launch hybrid router as background task
    background_tasks.add_task(
        _run_hybrid_router,
        mission_id=mission_id,
        goal=request.goal,
        tenant_id=request.tenant_id,
    )

    logger.info(
        "Mission %s created for tenant %s (hybrid router queued)",
        mission_id,
        request.tenant_id,
    )

    return CreateMissionResponse(
        mission_id=mission_id,
        status=response.status.value,
        created_at=response.created_at,
        estimated_steps=response.estimated_steps,
        stream_url=response.stream_url or f"/v1/missions/{mission_id}/stream",
    )


async def _run_hybrid_router(mission_id: str, goal: str, tenant_id: str) -> None:
    """Background task: run hybrid LLM router for a mission."""
    try:
        from src.core.hybrid_router import route_and_execute

        result = await route_and_execute(
            goal=goal,
            tenant_id=tenant_id,
            mission_id=mission_id,
        )

        if mission_id in MISSION_STORE:
            MISSION_STORE[mission_id]["status"] = "completed" if result.success else "failed"
            MISSION_STORE[mission_id]["events"].append({
                "event_type": "mission.completed" if result.success else "mission.failed",
                "mission_id": mission_id,
                "data": {
                    "model_used": result.model_used,
                    "mcu_charged": result.mcu_charged,
                    "output_preview": result.output[:200] if result.output else "",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    except Exception as e:
        logger.error("Hybrid router failed for mission %s: %s", mission_id, e)
        if mission_id in MISSION_STORE:
            MISSION_STORE[mission_id]["status"] = "failed"


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
