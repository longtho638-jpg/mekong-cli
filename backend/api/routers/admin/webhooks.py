from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from backend.api.security.rbac import require_admin, require_developer
from backend.api.services.admin_service import AdminService
from backend.models.webhooks import WebhookConfig, WebhookDelivery, WebhookEvent

# We need Pydantic models for response/requests.
# Assuming they might exist or we define them here/in schemas.
# For now, using dicts or generic responses to move fast as per VIBE.

router = APIRouter(prefix="/webhooks", tags=["admin-webhooks"])

def get_admin_service() -> AdminService:
    return AdminService()

# --- Webhook Configs (Outgoing Webhooks) ---

@router.get("/configs", dependencies=[Depends(require_developer)])
async def list_webhook_configs(
    service: AdminService = Depends(get_admin_service)
) -> List[Dict[str, Any]]:
    """List all webhook configurations."""
    # In a real impl, service would fetch from DB
    # Mocking for now as AdminService expansion might be large
    # Or assuming service has a generic list_models or similar
    # returning mock data for UI dev
    return [
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "url": "https://api.example.com/webhooks",
            "description": "Main production webhook",
            "event_types": ["user.created", "payment.succeeded"],
            "is_active": True,
            "created_at": "2024-01-01T12:00:00Z"
        },
         {
            "id": "123e4567-e89b-12d3-a456-426614174001",
            "url": "https://staging.example.com/webhooks",
            "description": "Staging webhook",
            "event_types": ["*"],
            "is_active": False,
            "created_at": "2024-01-02T12:00:00Z"
        }
    ]

@router.post("/configs", dependencies=[Depends(require_admin)])
async def create_webhook_config(
    config: Dict[str, Any],
    service: AdminService = Depends(get_admin_service)
):
    """Create a new webhook configuration."""
    return {"status": "success", "id": "new-uuid", "message": "Webhook created"}

@router.get("/configs/{config_id}", dependencies=[Depends(require_developer)])
async def get_webhook_config(
    config_id: str = Path(...),
    service: AdminService = Depends(get_admin_service)
):
    """Get webhook config details."""
    return {
        "id": config_id,
        "url": "https://api.example.com/webhooks",
        "description": "Main production webhook",
        "secret": "whsec_...",
        "event_types": ["user.created", "payment.succeeded"],
        "is_active": True,
        "created_at": "2024-01-01T12:00:00Z"
    }

# --- Webhook Events (Incoming/History) ---

@router.get("/events", dependencies=[Depends(require_developer)])
async def list_webhook_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service: AdminService = Depends(get_admin_service)
):
    """List recent webhook events."""
    return {
        "items": [
             {
                "id": "evt_1",
                "event_type": "payment.succeeded",
                "status": "success",
                "created_at": "2024-01-27T10:00:00Z"
            },
             {
                "id": "evt_2",
                "event_type": "user.created",
                "status": "failed",
                "created_at": "2024-01-27T10:05:00Z"
            }
        ],
        "total": 100,
        "page": page,
        "per_page": per_page
    }

@router.get("/deliveries", dependencies=[Depends(require_developer)])
async def list_webhook_deliveries(
     page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service: AdminService = Depends(get_admin_service)
):
    """List webhook delivery attempts."""
    return {
        "items": [],
        "total": 0
    }
