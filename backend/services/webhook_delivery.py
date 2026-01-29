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

from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)


class WebhookDeliveryService:
    """
    Service for reliable webhook delivery.
    Handles signing, sending, and retrying of webhooks.
    """

    def __init__(self):
        self.db = get_db()
        self.max_retries = 5
        self.backoff_factor = 2  # Exponential backoff base

    def generate_signature(self, payload: str, secret: str, timestamp: int) -> str:
        """
        Generate HMAC SHA256 signature.
        Format: t=TIMESTAMP,v1=SIGNATURE
        """
        to_sign = f"{timestamp}.{payload}"
        signature = hmac.new(
            key=secret.encode("utf-8"), msg=to_sign.encode("utf-8"), digestmod=hashlib.sha256
        ).hexdigest()
        return f"t={timestamp},v1={signature}"

    async def send_webhook(self, config_id: str, event_type: str, payload: Dict[str, Any]):
        """
        Prepare and send a webhook event.
        """
        try:
            # 1. Get Webhook Config
            result = (
                self.db.table("webhook_configs").select("*").eq("id", config_id).single().execute()
            )
            config = result.data

            if not config or config["status"] != "active":
                return

            # Check if event type is subscribed
            # Handle wildcard subscription "event.*" or "*"
            subscribed = False
            for event_pattern in config["events"]:
                if event_pattern == "*" or event_pattern == event_type:
                    subscribed = True
                    break
                if event_pattern.endswith("*") and event_type.startswith(event_pattern[:-1]):
                    subscribed = True
                    break

            if not subscribed:
                return

            # 2. Record Initial Delivery Attempt (Pending)
            delivery_data = {
                "webhook_config_id": config_id,
                "event_type": event_type,
                "payload": payload,
                "status": "pending",
                "attempts": 0,
            }
            res = self.db.table("webhook_deliveries").insert(delivery_data).execute()
            if not res.data:
                logger.error("Failed to insert webhook delivery record")
                return
            delivery_record = res.data[0]
            delivery_id = delivery_record["id"]

            # 3. Execute Delivery
            await self._execute_delivery(
                delivery_id=delivery_id, url=config["url"], secret=config["secret"], payload=payload
            )

        except Exception as e:
            logger.error(f"Error preparing webhook delivery: {e}")

    async def _execute_delivery(
        self, delivery_id: str, url: str, secret: str, payload: Dict[str, Any]
    ):
        """
        Execute the HTTP request with retries.
        """
        # Get current state
        try:
            res = (
                self.db.table("webhook_deliveries")
                .select("*")
                .eq("id", delivery_id)
                .single()
                .execute()
            )
            record = res.data
        except Exception as e:
            logger.error(f"Error fetching delivery record {delivery_id}: {e}")
            return

        payload_json = json.dumps(payload)
        timestamp = int(time.time())
        signature = self.generate_signature(payload_json, secret, timestamp)

        headers = {
            "Content-Type": "application/json",
            "AgencyOS-Signature": signature,
            "AgencyOS-Event-Id": str(delivery_id),
            "User-Agent": "AgencyOS-Webhook/1.0",
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, data=payload_json, headers=headers, timeout=10
                ) as response:
                    status_code = response.status
                    response_text = await response.text()

                    success = 200 <= status_code < 300

                    # Update status
                    update_data = {
                        "status": "success" if success else "failed",
                        "response_status": status_code,
                        "response_body": response_text[:1000],  # Truncate log
                        "attempts": record["attempts"] + 1,
                        "updated_at": datetime.utcnow().isoformat(),
                    }

                    if not success:
                        # Schedule retry
                        if record["attempts"] + 1 < self.max_retries:
                            retry_delay = self.backoff_factor ** (record["attempts"] + 1)
                            update_data["next_retry_at"] = (
                                datetime.utcnow() + timedelta(seconds=retry_delay)
                            ).isoformat()
                            update_data["status"] = "pending"  # Keep pending if retrying
                        else:
                            update_data["status"] = "failed"  # Final failure

                    self.db.table("webhook_deliveries").update(update_data).eq(
                        "id", delivery_id
                    ).execute()

        except Exception as e:
            logger.error(f"Webhook HTTP error: {e}")
            # Handle connection errors (treat as failure -> retry)
            update_data = {
                "status": "pending",
                "response_body": str(e)[:1000],
                "attempts": record["attempts"] + 1,
                "updated_at": datetime.utcnow().isoformat(),
            }

            if record["attempts"] + 1 < self.max_retries:
                retry_delay = self.backoff_factor ** (record["attempts"] + 1)
                update_data["next_retry_at"] = (
                    datetime.utcnow() + timedelta(seconds=retry_delay)
                ).isoformat()
            else:
                update_data["status"] = "failed"

            self.db.table("webhook_deliveries").update(update_data).eq("id", delivery_id).execute()

    async def process_retries(self):
        """
        Background task to process pending retries.
        """
        try:
            now = datetime.utcnow().isoformat()
            # Find deliveries due for retry
            res = (
                self.db.table("webhook_deliveries")
                .select("*, webhook_configs(url, secret)")
                .eq("status", "pending")
                .lte("next_retry_at", now)
                .execute()
            )

            deliveries = res.data

            for delivery in deliveries:
                # Assuming join worked, otherwise need to fetch config
                config = delivery.get("webhook_configs")
                if not config:
                    # Fetch manually if join syntax varies
                    config_res = (
                        self.db.table("webhook_configs")
                        .select("*")
                        .eq("id", delivery["webhook_config_id"])
                        .single()
                        .execute()
                    )
                    config = config_res.data

                if config:
                    await self._execute_delivery(
                        delivery_id=delivery["id"],
                        url=config["url"],
                        secret=config["secret"],
                        payload=delivery["payload"],
                    )

        except Exception as e:
            logger.error(f"Error processing webhook retries: {e}")


# Global instance
webhook_service = WebhookDeliveryService()
