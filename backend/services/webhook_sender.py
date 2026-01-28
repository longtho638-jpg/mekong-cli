"""
Webhook Sender Service.
Handles reliable delivery of outgoing webhooks with retries and exponential backoff.
"""
import asyncio
import hashlib
import hmac
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from uuid import UUID

import aiohttp
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.api.routers.webhooks.models import DeliveryStatus
from backend.core.infrastructure.database import get_db
from backend.models.webhooks import WebhookConfig, WebhookDelivery, WebhookFailure

logger = logging.getLogger(__name__)

class WebhookSenderService:
    """
    Service for reliable outgoing webhook delivery.
    """

    def __init__(self):
        self.max_retries = 3
        # Exponential backoff: 1s, 2s, 4s
        self.backoff_base = 2

    def _get_db(self):
        """Helper to get a fresh DB session."""
        gen = get_db()
        return next(gen)

    def generate_signature(self, payload: str, secret: str, timestamp: int) -> str:
        """
        Generate HMAC SHA256 signature.
        Format: t=TIMESTAMP,v1=SIGNATURE
        """
        to_sign = f"{timestamp}.{payload}"
        signature = hmac.new(
            key=secret.encode('utf-8'),
            msg=to_sign.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        return f"t={timestamp},v1={signature}"

    async def trigger_webhooks(self, event_type: str, payload: Dict[str, Any], db: Session = None):
        """
        Trigger all active webhooks subscribed to this event type.
        """
        local_db = False
        if db is None:
            db = self._get_db()
            local_db = True

        try:
            # 1. Find matching endpoints
            # Fetch all active endpoints.
            # Ideally we'd filter by event_types in DB, but JSON containment queries vary by DB (SQLite vs PG).
            # Fetching active configs is usually safe unless there are thousands.
            endpoints = db.query(WebhookConfig).filter(WebhookConfig.is_active).all()

            for endpoint in endpoints:
                # Convert SQLAlchemy model to dict for internal use if needed, or use attributes directly
                # endpoint.event_types is a list from the model (JSONType)
                if self._is_subscribed(endpoint.event_types, event_type):
                    await self.schedule_delivery(endpoint, event_type, payload, db)

        except Exception as e:
            logger.error(f"Error triggering webhooks for {event_type}: {e}")
        finally:
            if local_db:
                db.close()

    def _is_subscribed(self, patterns: list, event_type: str) -> bool:
        """Check if endpoint is subscribed to event type."""
        if not patterns:
            return False

        if "*" in patterns:
            return True

        for pattern in patterns:
            if pattern == event_type:
                return True
            if pattern.endswith("*") and event_type.startswith(pattern[:-1]):
                return True
        return False

    async def schedule_delivery(self, endpoint: WebhookConfig, event_type: str, payload: Dict[str, Any], db: Session):
        """Create delivery record and attempt sending."""
        try:
            new_delivery = WebhookDelivery(
                webhook_config_id=endpoint.id,
                event_type=event_type,
                payload=payload,
                status=DeliveryStatus.PENDING.value,
                attempt_count=0,
                created_at=datetime.utcnow()
            )

            db.add(new_delivery)
            db.commit()
            db.refresh(new_delivery)

            # Attempt immediate delivery
            await self._execute_delivery(new_delivery, endpoint, db)

        except Exception as e:
            db.rollback()
            logger.error(f"Error scheduling webhook delivery: {e}")

    async def _execute_delivery(self, delivery: WebhookDelivery, endpoint: WebhookConfig, db: Session):
        """
        Execute the HTTP request.
        """
        url = endpoint.url
        secret = endpoint.secret
        payload = delivery.payload

        payload_json = json.dumps(payload)
        timestamp = int(time.time())
        signature = self.generate_signature(payload_json, secret, timestamp)

        headers = {
            "Content-Type": "application/json",
            "AgencyOS-Signature": signature,
            "AgencyOS-Event-Id": str(delivery.id),
            "User-Agent": "AgencyOS-Webhook/1.0",
            "X-AgencyOS-Event": delivery.event_type
        }

        success = False
        response_status = None
        response_body = None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=payload_json, headers=headers, timeout=10) as response:
                    response_status = response.status
                    response_body = await response.text()
                    success = 200 <= response_status < 300

        except Exception as e:
            logger.error(f"Webhook HTTP error to {url}: {e}")
            response_status = 0
            response_body = str(e)
            success = False

        # Update delivery status
        await self._update_delivery_status(delivery, success, response_status, response_body, db)

    async def _update_delivery_status(self, delivery: WebhookDelivery, success: bool, response_status: int, response_body: str, db: Session):
        """Update delivery record and schedule retry if needed."""
        try:
            delivery.attempt_count += 1
            delivery.response_status = response_status
            delivery.response_body = response_body[:2000] if response_body else None
            delivery.updated_at = datetime.utcnow()

            if success:
                delivery.status = DeliveryStatus.SUCCESS.value
            else:
                if delivery.attempt_count < self.max_retries:
                    # Schedule retry
                    delay = self.backoff_base ** delivery.attempt_count
                    next_retry = datetime.utcnow() + timedelta(seconds=delay)
                    delivery.status = DeliveryStatus.PENDING.value
                    delivery.next_retry_at = next_retry
                else:
                    # Failed permanently
                    delivery.status = DeliveryStatus.FAILED.value
                    # Add to DLQ
                    await self._send_to_dlq(delivery, response_body, db)

            db.commit()

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating delivery status: {e}")

    async def _send_to_dlq(self, delivery: WebhookDelivery, error: str, db: Session):
        """Record permanent failure."""
        try:
            failure = WebhookFailure(
                delivery_id=delivery.id,
                webhook_config_id=delivery.webhook_config_id,
                event_type=delivery.event_type,
                payload=delivery.payload,
                error_message=error,
                failed_at=datetime.utcnow()
            )
            db.add(failure)
            # Commit handled by caller (usually) but here we are in a chain.
            # Ideally the caller commits, but _update_delivery_status is the one managing the transaction scope for this logic unit.
            # We are inside _update_delivery_status's logic which calls commit at the end.
            # However, we need to add this to the session.
            # Since _update_delivery_status calls commit() at the end, adding it to session here is sufficient.

        except Exception as e:
            logger.error(f"Error preparing DLQ entry: {e}")

    async def process_retries(self, db: Session = None):
        """
        Background task to process pending retries.
        """
        local_db = False
        if db is None:
            db = self._get_db()
            local_db = True

        try:
            now = datetime.utcnow()
            # Fetch pending deliveries due for retry
            deliveries = db.query(WebhookDelivery).filter(
                WebhookDelivery.status == DeliveryStatus.PENDING.value,
                WebhookDelivery.next_retry_at <= now
            ).all()

            for delivery in deliveries:
                # Fetch endpoint details
                endpoint = db.query(WebhookConfig).filter(WebhookConfig.id == delivery.webhook_config_id).first()
                if not endpoint:
                    logger.warning(f"Endpoint not found for delivery {delivery.id}")
                    continue

                await self._execute_delivery(delivery, endpoint, db)

        except Exception as e:
            logger.error(f"Error processing retries: {e}")
        finally:
            if local_db:
                db.close()

webhook_sender = WebhookSenderService()
