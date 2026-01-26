from typing import Any, Dict, List
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.webhook import WebhookEventCreate, WebhookEvent
from app.services.webhook_sender import WebhookSender
from app.crud import crud_webhook

router = APIRouter()

@router.get("/", response_model=List[WebhookEvent])
def read_events(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve webhook events.
    """
    events = crud_webhook.webhook_event.get_multi(db, skip=skip, limit=limit)
    return events

@router.get("/{event_id}", response_model=WebhookEvent)
def read_event(
    *,
    db: Session = Depends(deps.get_db),
    event_id: int,
):
    """
    Get webhook event by ID.
    """
    event = crud_webhook.webhook_event.get(db, id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.post("/trigger", status_code=202)
async def trigger_event(
    *,
    db: Session = Depends(deps.get_db),
    event_in: WebhookEventCreate,
):
    """
    Trigger a new event. This will asynchronously enqueue jobs to send webhooks.
    """
    await WebhookSender.process_event(db, event_in.event_type, event_in.payload)
    return {"message": "Event received and processing started"}

@router.post("/retry-failed", status_code=202)
async def retry_failed_deliveries(
    db: Session = Depends(deps.get_db),
):
    """
    Manually trigger retry for failed deliveries that are due
    """
    from app.crud import crud_webhook
    from app.core.queue import queue_manager

    failed_deliveries = crud_webhook.webhook_delivery.get_failed_retriable(db)
    redis = await queue_manager.get_redis()

    count = 0
    for delivery in failed_deliveries:
        # Enqueue job directly
        await redis.enqueue_job(
            "send_webhook_job",
            endpoint_id=delivery.endpoint_id,
            event_data=delivery.request_body,
            event_id=delivery.event_id,
            delivery_id=delivery.id
        )
        count += 1

    return {"message": f"Retrying {count} failed deliveries"}
