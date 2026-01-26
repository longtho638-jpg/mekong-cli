from typing import Any, Dict
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.webhook import WebhookEventCreate
from app.services.webhook_sender import WebhookSender

router = APIRouter()

@router.post("/trigger", status_code=202)
async def trigger_event(
    *,
    db: Session = Depends(deps.get_db),
    event_in: WebhookEventCreate,
    background_tasks: BackgroundTasks
):
    """
    Trigger a new event. This will asynchronously send webhooks to matching endpoints.
    """
    # For simplicity in this kit, we just await the process_event which does finding + sending
    # In a real app, you might want to put this entire logic in background task
    # But here we want to at least save the event in DB synchronously?
    # Let's make process_event handle everything.

    # We use BackgroundTasks to avoid blocking the response
    background_tasks.add_task(WebhookSender.process_event, db, event_in.event_type, event_in.payload)

    return {"message": "Event received and processing started"}

@router.post("/retry-failed", status_code=202)
async def retry_failed_deliveries(
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
):
    """
    Manually trigger retry for failed deliveries that are due
    """
    from app.crud import crud_webhook
    from app.services.webhook_sender import WebhookSender

    failed_deliveries = crud_webhook.webhook_delivery.get_failed_retriable(db)

    count = 0
    for delivery in failed_deliveries:
        # We need the endpoint secret and url
        endpoint = crud_webhook.webhook_endpoint.get(db, id=delivery.endpoint_id)
        if endpoint:
            # Payload comes from the event or the delivery request body
            payload = delivery.request_body
            background_tasks.add_task(
                WebhookSender.send_webhook,
                db,
                endpoint,
                payload,
                event_id=delivery.event_id,
                delivery_id=delivery.id
            )
            count += 1

    return {"message": f"Retrying {count} failed deliveries"}
