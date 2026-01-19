"""
API Schemas - SINGLE SOURCE OF TRUTH
=====================================

All Pydantic models for the API layer.
No duplication - import from here only.

Binh Pháp: "Nhất Dụng" - One Source, One Truth
"""

from .commands import AgentTask, CommandRequest
from .common import ErrorResponse, HealthResponse, SuccessResponse
from .vibe import VibeRequest, VibeResponse
from .webhooks import GumroadPurchase, PolarWebhookPayload

__all__ = [
    # Commands & Agents
    "CommandRequest",
    "AgentTask",
    # Vibe
    "VibeRequest",
    "VibeResponse",
    # Webhooks
    "GumroadPurchase",
    "PolarWebhookPayload",
    # Common
    "ErrorResponse",
    "SuccessResponse",
    "HealthResponse",
]
