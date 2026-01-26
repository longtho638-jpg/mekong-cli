import logging
from typing import Dict, Any, Optional
from arq import create_pool
from arq.connections import RedisSettings
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.webhook_sender import WebhookSender
from app.crud import crud_webhook
from app.models.webhook import WebhookDelivery
from sqlalchemy.orm import Session
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def startup(ctx):
    logger.info("Worker starting up...")
    # Initialize DB session factory or similar if needed globally,
    # but we usually create session per job.
    pass

async def shutdown(ctx):
    logger.info("Worker shutting down...")

async def send_webhook_job(ctx, endpoint_id: int, event_data: Dict[str, Any], event_id: Optional[int] = None, delivery_id: Optional[int] = None):
    """
    Job to send a webhook to a specific endpoint.
    This replaces the direct call in WebhookSender.process_event loop.
    """
    logger.info(f"Processing send_webhook_job for endpoint {endpoint_id}, delivery {delivery_id}")

    db: Session = SessionLocal()
    try:
        endpoint = crud_webhook.webhook_endpoint.get(db, id=endpoint_id)
        if not endpoint:
            logger.error(f"Endpoint {endpoint_id} not found")
            return

        success, delivery_id, next_retry_at = await WebhookSender.send_webhook(
            db=db,
            endpoint=endpoint,
            event_data=event_data,
            event_id=event_id,
            delivery_id=delivery_id
        )

        if not success and next_retry_at:
            # Schedule retry
            delay_seconds = (next_retry_at - datetime.utcnow()).total_seconds()
            # Ensure at least 1 second delay
            delay_seconds = max(1, delay_seconds)

            # Enqueue the same job again with the created delivery_id
            await ctx['redis'].enqueue_job(
                "send_webhook_job",
                endpoint_id=endpoint_id,
                event_data=event_data,
                event_id=event_id,
                delivery_id=delivery_id,
                _defer_by=int(delay_seconds * 1000)
            )
            logger.info(f"Scheduled retry for delivery {delivery_id} in {delay_seconds}s")

    except Exception as e:
        logger.error(f"Error in send_webhook_job: {e}")
    finally:
        db.close()

async def schedule_retry_job(ctx, delivery_id: int, delay_ms: int):
    """
    Job to re-enqueue a delivery attempt
    """
    # This might be just a delayed enqueue of the same job function?
    # Yes, arq supports _defer_by or _defer_until
    pass

class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    functions = [send_webhook_job]
    on_startup = startup
    on_shutdown = shutdown
