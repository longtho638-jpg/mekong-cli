from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.api.dependencies.database import get_db
from backend.api.routers.webhooks.models import WebhookDelivery as WebhookDeliverySchema

# Pydantic Schemas
from backend.api.routers.webhooks.models import WebhookEndpoint as WebhookEndpointSchema
from backend.api.routers.webhooks.models import WebhookEndpointCreate, WebhookStatus
from backend.api.routers.webhooks.models import WebhookEvent as WebhookEventSchema
from backend.api.security.rbac import require_admin

# SQLAlchemy Models
from backend.models.webhooks import WebhookConfig, WebhookDelivery, WebhookEvent

router = APIRouter()

# -----------------------------------------------------------------------------
# Webhook Configs (Outgoing Webhooks)
# -----------------------------------------------------------------------------


@router.get(
    "/configs", response_model=List[WebhookEndpointSchema], dependencies=[Depends(require_admin)]
)
async def list_webhook_configs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all outgoing webhook configurations."""
    configs = db.query(WebhookConfig).offset(skip).limit(limit).all()
    return configs


@router.post(
    "/configs", response_model=WebhookEndpointSchema, dependencies=[Depends(require_admin)]
)
async def create_webhook_config(config: WebhookEndpointCreate, db: Session = Depends(get_db)):
    """Create a new outgoing webhook configuration."""
    data = config.model_dump()
    # Pydantic model dump might not exactly match SQLAlchemy model if fields differ, but usually fine.
    # WebhookConfig has: url, description, secret, event_types, is_active, api_key_id
    # WebhookEndpointCreate has: url, description, secret, event_types
    # is_active defaults to True in DB model

    new_config = WebhookConfig(**data)
    new_config.created_at = datetime.utcnow()
    new_config.updated_at = datetime.utcnow()
    new_config.is_active = True

    try:
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create webhook config: {str(e)}")


@router.put(
    "/configs/{config_id}",
    response_model=WebhookEndpointSchema,
    dependencies=[Depends(require_admin)],
)
async def update_webhook_config(
    config_id: str, config_update: Dict[str, Any], db: Session = Depends(get_db)
):
    """Update a webhook configuration."""
    config = db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    allowed_fields = {"url", "description", "secret", "event_types", "is_active"}

    for key, value in config_update.items():
        if key in allowed_fields:
            setattr(config, key, value)

    config.updated_at = datetime.utcnow()

    try:
        db.commit()
        db.refresh(config)
        return config
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update webhook config: {str(e)}")


@router.delete(
    "/configs/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_webhook_config(config_id: str, db: Session = Depends(get_db)):
    """Delete a webhook configuration."""
    config = db.query(WebhookConfig).filter(WebhookConfig.id == config_id).first()
    if config:
        db.delete(config)
        db.commit()
    return None


# -----------------------------------------------------------------------------
# Incoming Events
# -----------------------------------------------------------------------------


@router.get(
    "/events", response_model=List[WebhookEventSchema], dependencies=[Depends(require_admin)]
)
async def list_webhook_events(
    provider: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List incoming webhook events."""
    query = db.query(WebhookEvent)

    if provider:
        query = query.filter(WebhookEvent.provider == provider)
    if status:
        query = query.filter(WebhookEvent.status == status)

    events = query.order_by(desc(WebhookEvent.created_at)).offset(skip).limit(limit).all()
    return events


@router.get(
    "/events/{event_id}", response_model=WebhookEventSchema, dependencies=[Depends(require_admin)]
)
async def get_webhook_event(event_id: str, db: Session = Depends(get_db)):
    """Get details of a specific webhook event."""
    event = db.query(WebhookEvent).filter(WebhookEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/events/{event_id}/replay", dependencies=[Depends(require_admin)])
async def replay_webhook_event(event_id: str, db: Session = Depends(get_db)):
    """
    Replay an incoming webhook event.
    This effectively resets its status to 'pending' so the worker picks it up again.
    """
    event = db.query(WebhookEvent).filter(WebhookEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.status = WebhookStatus.PENDING.value
    event.error_message = None
    event.processed_at = None

    db.commit()

    # Enqueue
    # Note: Using str(event.id) because event.id might be a UUID object
    from backend.services.webhook_queue import webhook_queue

    webhook_queue.enqueue(str(event.id))

    return {"status": "requeued"}


# -----------------------------------------------------------------------------
# Outgoing Deliveries
# -----------------------------------------------------------------------------


@router.get(
    "/deliveries", response_model=List[WebhookDeliverySchema], dependencies=[Depends(require_admin)]
)
async def list_webhook_deliveries(
    config_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List outgoing webhook deliveries."""
    query = db.query(WebhookDelivery)

    if config_id:
        query = query.filter(WebhookDelivery.webhook_config_id == config_id)
    if status:
        query = query.filter(WebhookDelivery.status == status)

    deliveries = query.order_by(desc(WebhookDelivery.created_at)).offset(skip).limit(limit).all()
    return deliveries
