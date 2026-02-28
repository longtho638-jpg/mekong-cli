"""Dashboard router for RaaS — SSE stream, summary, and cost breakdown endpoints."""
from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from src.core.event_bus import get_event_bus
from src.raas.credits import CreditStore
from src.raas.mission_models import MissionStatus
from src.raas.mission_store import MissionStore
from src.raas.sse import EventBusAdapter, SSEManager, get_sse_manager
from src.raas.tenant import TenantStore

raas_dashboard_router = APIRouter(tags=["dashboard"])

# Module-level singletons
_tenant_store = TenantStore()
_mission_store = MissionStore()
_credit_store = CreditStore()

# Wire EventBusAdapter once at module import time
_sse_manager: SSEManager = get_sse_manager()
_adapter = EventBusAdapter(_sse_manager, get_event_bus())

_KEEPALIVE_INTERVAL = 15  # seconds


def _validate_token(token: str) -> str:
    """Validate a query-param API token and return the tenant_id.

    EventSource clients cannot set headers, so auth uses query param.

    Args:
        token: Plaintext ``mk_``-prefixed API key from query string.

    Returns:
        Resolved tenant_id string.

    Raises:
        HTTPException 401: Token missing, malformed, or unknown.
        HTTPException 403: Tenant is deactivated.
    """
    if not token or not token.startswith("mk_"):
        raise HTTPException(status_code=401, detail="Invalid token format. Expected mk_<key>.")
    tenant = _tenant_store.get_by_api_key(token)
    if tenant is None:
        raise HTTPException(status_code=401, detail="Unknown API token.")
    if not tenant.is_active:
        raise HTTPException(status_code=403, detail="Tenant account is deactivated.")
    return tenant.id


async def _event_generator(tenant_id: str) -> AsyncGenerator[str, None]:
    """Async generator that yields SSE-formatted strings for a tenant.

    Sends keepalive pings every KEEPALIVE_INTERVAL seconds when no
    events are queued.  Exits when the client disconnects (GeneratorExit).

    Args:
        tenant_id: The tenant whose event queue to drain.

    Yields:
        SSE-formatted strings like ``data: {...}\\n\\n`` or ``: ping\\n\\n``.
    """
    queue = _sse_manager.register(tenant_id)
    try:
        while True:
            try:
                event_data: dict[str, Any] = await asyncio.wait_for(
                    queue.get(), timeout=_KEEPALIVE_INTERVAL
                )
                yield f"data: {json.dumps(event_data)}\n\n"
            except asyncio.TimeoutError:
                yield ": ping\n\n"
    except (GeneratorExit, asyncio.CancelledError):
        pass
    finally:
        _sse_manager.unregister(tenant_id, queue)


@raas_dashboard_router.get("/dashboard/stream")
async def dashboard_stream(
    token: str = Query(..., description="API key (mk_xxx) — EventSource cannot set headers"),
) -> StreamingResponse:
    """SSE endpoint for real-time dashboard events.

    Clients connect via EventSource with ``?token=mk_xxx``.
    The connection stays open and receives JSON event payloads.

    Args:
        token: Plaintext API key from query string.

    Returns:
        StreamingResponse with ``text/event-stream`` content type.
    """
    tenant_id = _validate_token(token)
    return StreamingResponse(
        _event_generator(tenant_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@raas_dashboard_router.get("/dashboard/summary")
async def dashboard_summary(
    token: str = Query(..., description="API key (mk_xxx)"),
) -> dict[str, Any]:
    """JSON snapshot of mission counts and credit balance for the tenant.

    Args:
        token: Plaintext API key from query string.

    Returns:
        Dict with missions (by status), credits, and health indicator.
    """
    tenant_id = _validate_token(token)

    missions = _mission_store.list_for_tenant(tenant_id, limit=1000)
    counts: dict[str, int] = defaultdict(int)
    for m in missions:
        counts[m.status.value] += 1

    balance = _credit_store.get_balance(tenant_id)

    # total_spent from credit_accounts if available; fallback to sum of debits
    history = _credit_store.get_history(tenant_id, limit=10000)
    total_spent = sum(-t.amount for t in history if t.amount < 0)

    return {
        "missions": {
            MissionStatus.queued.value: counts.get(MissionStatus.queued.value, 0),
            MissionStatus.running.value: counts.get(MissionStatus.running.value, 0),
            MissionStatus.completed.value: counts.get(MissionStatus.completed.value, 0),
            MissionStatus.failed.value: counts.get(MissionStatus.failed.value, 0),
        },
        "credits": {
            "balance": balance,
            "total_spent": total_spent,
        },
        "health": "ok",
    }


@raas_dashboard_router.get("/dashboard/costs")
async def dashboard_costs(
    token: str = Query(..., description="API key (mk_xxx)"),
) -> dict[str, Any]:
    """Credit usage breakdown grouped by calendar day.

    Args:
        token: Plaintext API key from query string.

    Returns:
        Dict with daily breakdown list, total_spent, and current balance.
    """
    tenant_id = _validate_token(token)

    history = _credit_store.get_history(tenant_id, limit=10000)
    debits = [t for t in history if t.amount < 0]

    # Group by date (YYYY-MM-DD extracted from ISO timestamp)
    daily: dict[str, dict[str, int]] = defaultdict(lambda: {"spent": 0, "missions_count": 0})
    for txn in debits:
        try:
            date_key = txn.timestamp[:10]  # "YYYY-MM-DD"
        except (AttributeError, IndexError):
            date_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        daily[date_key]["spent"] += -txn.amount
        daily[date_key]["missions_count"] += 1

    daily_list = [
        {"date": date, "spent": vals["spent"], "missions_count": vals["missions_count"]}
        for date, vals in sorted(daily.items(), reverse=True)
    ]

    total_spent = sum(entry["spent"] for entry in daily_list)
    balance = _credit_store.get_balance(tenant_id)

    return {
        "daily": daily_list,
        "total_spent": total_spent,
        "balance": balance,
    }


__all__ = ["raas_dashboard_router"]
