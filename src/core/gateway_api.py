"""Mekong CLI v3.1 - Public Gateway API for AgencyOS.

Clean API contract for AgencyOS to consume Mekong CLI engine.
Endpoints: missions CRUD, SSE streaming, webhook testing, API key auth.

Usage:
    from src.core.gateway_api import create_app
    app = create_app()
    # uvicorn src.core.gateway_api:app
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal, Optional

logger = __import__("logging").getLogger(__name__)


def validate_api_key_for_mission(api_key: str, tenant_id: str) -> tuple[bool, Optional[str]]:
    """Validate API key for mission creation (Condition C3).

    Args:
        api_key: API key from request header (mk_xxx)
        tenant_id: Tenant ID from request body

    Returns:
        (valid, error_message) tuple
    """
    if not api_key:
        return False, "Missing API key (X-API-Key header required)"

    try:
        from src.core.api_key_manager import validate_api_key as validate_key
        result = validate_key(api_key)

        if not result.valid:
            return False, f"Invalid API key: {result.error}"

        # Check tenant ID matches
        if result.tenant_id != tenant_id:
            return False, f"API key tenant mismatch (expected {tenant_id})"

        return True, None

    except ImportError:
        logger.warning("API key manager not available, skipping validation")
        return True, None  # Fallback: allow if module not found
    except Exception as e:
        logger.error("API key validation error: %s", e)
        return False, f"API key validation failed: {e}"


class MissionStatus(str, Enum):
    """Mission lifecycle states."""

    PENDING = "pending"
    PLANNING = "planning"
    EXECUTING = "executing"
    VERIFYING = "verifying"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class MissionRequest:
    """Inbound mission request from AgencyOS."""

    goal: str
    tenant_id: str
    webhook_url: Optional[str] = None
    priority: Literal["low", "normal", "high"] = "normal"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class MissionResponse:
    """Response after mission creation."""

    mission_id: str
    status: MissionStatus
    created_at: str
    estimated_steps: int = 0
    stream_url: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "mission_id": self.mission_id,
            "status": self.status.value,
            "created_at": self.created_at,
            "estimated_steps": self.estimated_steps,
            "stream_url": self.stream_url,
        }


@dataclass
class MissionEvent:
    """SSE event payload for mission streaming."""

    event_type: str
    mission_id: str
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_sse(self) -> str:
        """Format as Server-Sent Event string."""
        import json

        payload = {
            "event_type": self.event_type,
            "mission_id": self.mission_id,
            "data": self.data,
            "timestamp": self.timestamp,
        }
        return f"event: {self.event_type}\ndata: {json.dumps(payload)}\n\n"


# Webhook event schema — all events AgencyOS receives from Mekong
WEBHOOK_EVENTS = {
    "mission.created": "Mission created and queued",
    "mission.planning": "Plan steps generated",
    "mission.step.started": "Step execution started",
    "mission.step.completed": "Step completed successfully",
    "mission.step.failed": "Step failed (includes retry info)",
    "mission.completed": "Mission done (includes files, metrics)",
    "mission.failed": "Mission failed after retries exhausted",
}


def create_mission(request: MissionRequest, api_key: Optional[str] = None) -> MissionResponse:
    """Create a new mission from AgencyOS request.

    Args:
        request: Mission request with goal and tenant info
        api_key: Optional API key for authentication (Condition C3)

    Returns:
        MissionResponse with mission_id and stream URL

    Raises:
        ValueError: If API key validation fails
    """
    # Validate API key if provided (Condition C3: API Bridge)
    if api_key:
        valid, error = validate_api_key_for_mission(api_key, request.tenant_id)
        if not valid:
            raise ValueError(error)

    mission_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    logger.info(
        "Mission created: %s for tenant %s — goal: %s",
        mission_id,
        request.tenant_id,
        request.goal[:80],
    )

    return MissionResponse(
        mission_id=mission_id,
        status=MissionStatus.PENDING,
        created_at=now,
        stream_url=f"/v1/missions/{mission_id}/stream",
    )


def get_webhook_schema() -> dict[str, str]:
    """Return webhook event schema for documentation."""
    return dict(WEBHOOK_EVENTS)


def validate_webhook_url(url: str) -> tuple[bool, str]:
    """Validate webhook URL is reachable.

    Args:
        url: Webhook URL to test

    Returns:
        (success, message) tuple
    """
    if not url.startswith(("http://", "https://")):
        return False, "URL must start with http:// or https://"

    try:
        import requests

        response = requests.post(
            url,
            json={"event": "webhook.test", "timestamp": datetime.now(timezone.utc).isoformat()},
            timeout=10,
        )
        if response.status_code < 400:
            return True, f"Webhook reachable — HTTP {response.status_code}"
        return False, f"Webhook returned HTTP {response.status_code}"
    except Exception as e:
        return False, f"Webhook unreachable: {e}"


__all__ = [
    "MissionEvent",
    "MissionRequest",
    "MissionResponse",
    "MissionStatus",
    "WEBHOOK_EVENTS",
    "create_mission",
    "get_webhook_schema",
    "validate_webhook_url",
    "validate_api_key_for_mission",
]
