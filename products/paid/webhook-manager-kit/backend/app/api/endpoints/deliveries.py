from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_webhook
from app.core.queue import queue_manager
from app.schemas.webhook import WebhookDelivery

router = APIRouter()

@router.post("/{delivery_id}/retry", response_model=WebhookDelivery)
async def retry_delivery(
    *,
    db: Session = Depends(deps.get_db),
    delivery_id: int,
):
    """
    Retry a specific webhook delivery.
    """
    delivery = crud_webhook.webhook_delivery.get(db, id=delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    redis = await queue_manager.get_redis()

    # Enqueue job
    await redis.enqueue_job(
        "send_webhook_job",
        endpoint_id=delivery.endpoint_id,
        event_data=delivery.request_body,
        event_id=delivery.event_id,
        delivery_id=delivery.id
    )

    return delivery
