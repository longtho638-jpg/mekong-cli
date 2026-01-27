"""
Incoming Webhook Receiver Service.
Handles reception, deduplication, and storage of webhook events.
"""
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from backend.api.routers.webhooks.models import WebhookProvider, WebhookStatus
from backend.core.infrastructure.database import get_db
from backend.models.webhooks import WebhookEvent

logger = logging.getLogger(__name__)

class WebhookReceiverService:
    def __init__(self):
        # We don't hold the session here in __init__ typically for dependency injection,
        # but the original code did self.db = get_db().
        # get_db is a generator, so we should probably use a context manager or get a fresh session per method
        # if this service is a singleton.
        # However, looking at the previous code: self.db = get_db().
        # get_db() defined in backend/api/dependencies/database.py is a generator.
        # Assigning a generator to self.db won't work like a client.
        # We need to manage the session lifecycle.
        pass

    async def receive_event(
        self,
        provider: WebhookProvider,
        event_id: str,
        event_type: str,
        payload: Dict[str, Any],
        headers: Optional[Dict[str, Any]] = None,
        db: Session = None
    ) -> Optional[Dict[str, Any]]:
        """
        Receive and store a webhook event.
        Returns the event dict if successful, or None/raises on error.
        Implements idempotency check using provider + event_id.
        """
        # Handle DB session
        local_db = False
        if db is None:
            # Create a new session if one isn't provided
            # We need to handle the generator
            gen = get_db()
            db = next(gen)
            local_db = True

        try:
            # 1. Check for duplicates (Idempotency)
            existing = db.query(WebhookEvent).filter(
                WebhookEvent.provider == provider.value,
                WebhookEvent.event_id == event_id
            ).first()

            if existing:
                logger.info(f"Duplicate webhook event: {provider}:{event_id}")
                return {
                    "id": str(existing.id),
                    "status": existing.status,
                    "provider": existing.provider,
                    "event_id": existing.event_id,
                    "event_type": existing.event_type,
                    "payload": existing.payload,
                    "created_at": existing.created_at.isoformat() if existing.created_at else None
                }

            # 2. Store event
            new_event = WebhookEvent(
                provider=provider.value,
                event_id=event_id,
                event_type=event_type,
                payload=payload,
                headers=headers,
                status=WebhookStatus.PENDING.value,
                created_at=datetime.utcnow()
            )

            db.add(new_event)
            db.commit()
            db.refresh(new_event)

            logger.info(f"Webhook received and stored: {provider}:{event_id} ({new_event.id})")

            # Return dict representation
            return {
                "id": str(new_event.id),
                "status": new_event.status,
                "provider": new_event.provider,
                "event_id": new_event.event_id,
                "event_type": new_event.event_type,
                "payload": new_event.payload,
                "created_at": new_event.created_at.isoformat() if new_event.created_at else None
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error receiving webhook event: {e}", exc_info=True)
            raise
        finally:
            if local_db:
                db.close()

    async def update_status(self, event_id: str, status: WebhookStatus, error: Optional[str] = None, db: Session = None):
        """Update event status."""
        local_db = False
        if db is None:
            gen = get_db()
            db = next(gen)
            local_db = True

        try:
            event = db.query(WebhookEvent).filter(WebhookEvent.id == event_id).first()
            if event:
                event.status = status.value
                if status in [WebhookStatus.PROCESSED, WebhookStatus.FAILED]:
                    event.processed_at = datetime.utcnow()

                if error:
                    event.error_message = error

                db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating webhook status: {e}")
        finally:
            if local_db:
                db.close()

webhook_receiver = WebhookReceiverService()
