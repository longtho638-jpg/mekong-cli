import hashlib
import hmac
import json
import time
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.webhook import WebhookDelivery, WebhookEndpoint
from app.crud import crud_webhook

logger = logging.getLogger(__name__)

class WebhookSender:
    @staticmethod
    def generate_signature(secret: str, payload: Dict[str, Any], timestamp: int) -> str:
        """
        Generate HMAC SHA256 signature for the payload
        Format: t={timestamp},v1={signature}
        """
        payload_string = f"{timestamp}.{json.dumps(payload)}"
        signature = hmac.new(
            key=secret.encode(),
            msg=payload_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        return f"t={timestamp},v1={signature}"

    @staticmethod
    async def send_webhook(
        db: Session,
        endpoint: WebhookEndpoint,
        event_data: Dict[str, Any],
        event_id: Optional[int] = None,
        delivery_id: Optional[int] = None
    ):
        """
        Send webhook to a specific endpoint with retry logic
        """
        timestamp = int(time.time())
        signature = WebhookSender.generate_signature(endpoint.secret, event_data, timestamp)

        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Timestamp": str(timestamp),
            "X-Webhook-Event": event_data.get("event_type", "unknown")
        }

        # Create delivery record if not retrying an existing one
        if not delivery_id:
            delivery = WebhookDelivery(
                endpoint_id=endpoint.id,
                event_id=event_id,
                url=endpoint.url,
                request_headers=headers,
                request_body=event_data,
                attempt=1
            )
            db.add(delivery)
            db.commit()
            db.refresh(delivery)
        else:
            delivery = db.query(WebhookDelivery).filter(WebhookDelivery.id == delivery_id).first()
            if not delivery:
                logger.error(f"Delivery {delivery_id} not found")
                return
            delivery.attempt += 1
            delivery.updated_at = datetime.utcnow() # Update timestamp

        start_time = time.time()
        success = False
        response_body = None
        status_code = None
        error_msg = None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    endpoint.url,
                    json=event_data,
                    headers=headers
                )
                status_code = response.status_code
                response_body = response.text

                if 200 <= status_code < 300:
                    success = True
                else:
                    error_msg = f"HTTP {status_code}"

        except httpx.RequestError as e:
            error_msg = str(e)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error sending webhook: {e}")

        duration = int((time.time() - start_time) * 1000)

        # Update delivery record
        delivery.response_status_code = status_code
        delivery.response_body = response_body
        delivery.response_headers = dict(response.headers) if 'response' in locals() else None
        delivery.duration_ms = duration
        delivery.success = success
        delivery.error_message = error_msg

        if not success:
            # Schedule retry
            if delivery.attempt < settings.MAX_RETRIES:
                # Exponential backoff: 1s, 2s, 4s...
                delay_seconds = 2 ** (delivery.attempt - 1)
                delivery.next_retry_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
            else:
                delivery.next_retry_at = None # No more retries
        else:
            delivery.next_retry_at = None

        db.commit()
        return success

    @staticmethod
    async def process_event(db: Session, event_type: str, payload: Dict[str, Any]):
        """
        Find matching endpoints and send webhooks
        """
        # 1. Log the event
        event = crud_webhook.webhook_event.create(
            db, obj_in={"event_type": event_type, "payload": payload}
        )

        # 2. Find matching endpoints
        endpoints = crud_webhook.webhook_endpoint.get_by_event_type(db, event_type)

        # 3. Send to each endpoint
        # In production, this should be offloaded to a background task (Celery/RQ)
        # For this kit, we use simple async loop or BackgroundTasks
        for endpoint in endpoints:
            await WebhookSender.send_webhook(db, endpoint, payload, event.id)

