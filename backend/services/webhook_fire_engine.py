"""
Webhook Fire Engine.
The Core Delivery Engine implementing Fire Attack principles (Ch.12).
Handles orchestration of retries, circuit breaking, signatures, and DLQ.
"""
import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import aiohttp

from backend.services.retry_strategy import RetryStrategy
from backend.services.webhook_circuit_breaker import CircuitState, WebhookCircuitBreaker
from backend.services.webhooks.signature_service import SignatureService
from backend.services.webhooks.transformer_service import WebhookTransformer
from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)

class WebhookFireEngine:
    def __init__(self, redis_client):
        self.db = get_db()
        self.redis = redis_client

        # Services
        self.retry_strategy = RetryStrategy()
        self.circuit_breaker = WebhookCircuitBreaker(redis_client)
        self.signature_service = SignatureService()
        self.transformer = WebhookTransformer()

        # Configuration
        self.timeout_tiers = [5, 10, 20] # Escalating timeout strategy

    async def trigger(self, webhook_config_id: str, event_type: str, payload: Dict[str, Any], idempotency_key: Optional[str] = None):
        """
        Main entry point to fire a webhook.
        """
        # 1. Idempotency Check
        if idempotency_key:
            if self._is_duplicate(webhook_config_id, idempotency_key):
                logger.info(f"Duplicate webhook event ignored. Key: {idempotency_key}")
                return
            self._mark_idempotency_key(webhook_config_id, idempotency_key)
        else:
            idempotency_key = str(uuid.uuid4())

        # 2. Load Config
        config = self._get_config(webhook_config_id)
        if not config or not config.get("is_active", True):
            return

        # 3. Circuit Breaker Check
        if self.circuit_breaker.get_status(webhook_config_id) == CircuitState.OPEN:
            logger.warning(f"Circuit OPEN for {webhook_config_id}. Fast failing.")
            # Optionally queue to DLQ immediately or schedule for later
            return

        # 4. Transform Payload
        try:
            template = config.get("transformation_template")
            excluded_fields = config.get("excluded_fields", [])

            final_payload = self.transformer.filter_fields(payload, excluded_fields)
            final_payload = self.transformer.transform_payload(final_payload, template)
        except ValueError as e:
            logger.error(f"Transformation failed: {e}")
            return

        # 5. Create Delivery Record
        delivery_id = self._create_delivery_record(
            webhook_config_id, event_type, final_payload, idempotency_key
        )

        # 6. Execute (Fire)
        # In production, this might offload to a queue.
        # For now we spawn a task to execute immediately.
        asyncio.create_task(self.execute_attempt(delivery_id, config, final_payload))

    async def execute_attempt(self, delivery_id: str, config: Dict[str, Any], payload: Dict[str, Any]):
        """
        Execute a single delivery attempt with timeout escalation and error handling.
        """
        delivery = self._get_delivery(delivery_id)
        if not delivery:
            return

        attempt_number = delivery.get("attempt_count", 0) + 1

        # Determine Timeout based on attempt (Timeout Escalation)
        timeout_idx = min(attempt_number - 1, len(self.timeout_tiers) - 1)
        timeout = self.timeout_tiers[timeout_idx]

        # Prepare Request
        url = config["url"]
        secret = config["secret"]
        payload_json = json.dumps(payload)
        timestamp = int(time.time())

        # Generate Signature
        signature = self.signature_service.generate_hmac_signature(payload_json, secret)
        sig_header = self.signature_service.construct_header_value(timestamp, signature)

        headers = {
            "Content-Type": "application/json",
            "AgencyOS-Signature": sig_header,
            "AgencyOS-Event-Id": str(delivery_id),
            "User-Agent": "AgencyOS-FireEngine/1.0",
            "X-AgencyOS-Event": delivery["event_type"],
            "X-Attempt-Number": str(attempt_number)
        }

        if delivery.get("idempotency_key"):
            headers["Idempotency-Key"] = delivery["idempotency_key"]

        # Fire!
        start_time = time.time()
        success = False
        response_status = 0
        response_body = ""
        error_msg = None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=payload_json, headers=headers, timeout=timeout) as response:
                    response_status = response.status
                    response_body = await response.text()

                    if 200 <= response_status < 300:
                        success = True
                    else:
                        success = False
                        error_msg = f"HTTP {response_status}"

        except asyncio.TimeoutError:
            success = False
            error_msg = f"Timeout after {timeout}s"
        except Exception as e:
            success = False
            error_msg = str(e)

        duration_ms = int((time.time() - start_time) * 1000)

        # Handle Result
        await self._process_result(
            delivery, config, attempt_number, success, response_status, response_body, error_msg, duration_ms
        )

    async def _process_result(self, delivery: Dict[str, Any], config: Dict[str, Any],
                              attempt_number: int, success: bool, response_status: int,
                              response_body: str, error_msg: str, duration_ms: int):

        webhook_id = config["id"]

        # 1. Record Attempt
        attempt_data = {
            "delivery_id": delivery["id"],
            "webhook_config_id": webhook_id,
            "attempt_number": attempt_number,
            "status": "success" if success else "failed",
            "response_status": response_status,
            "response_body": response_body[:5000] if response_body else None,
            "error_message": error_msg,
            "duration_ms": duration_ms
        }
        self.db.table("webhook_delivery_attempts").insert(attempt_data).execute()

        # 2. Update Circuit Breaker
        if success:
            self.circuit_breaker.record_success(webhook_id)
        else:
            self.circuit_breaker.record_failure(webhook_id)

        # 3. Decide Next Step (Retry or Fail)
        update_data = {
            "attempt_count": attempt_number,
            "updated_at": datetime.utcnow().isoformat(),
            "response_status": response_status,
            "response_body": response_body[:2000] if response_body else None
        }

        if success:
            update_data["status"] = "success"
            update_data["next_retry_at"] = None
        else:
            max_retries = config.get("max_retries", 7)

            if attempt_number < max_retries:
                # Calculate Backoff
                backoff = self.retry_strategy.calculate_backoff(attempt_number)
                next_retry = datetime.utcnow() + timedelta(seconds=backoff)

                update_data["status"] = "pending"
                update_data["next_retry_at"] = next_retry.isoformat()

                logger.info(f"Scheduled retry #{attempt_number + 1} for {delivery['id']} in {backoff:.2f}s")
            else:
                # Exhausted -> DLQ
                update_data["status"] = "failed"
                update_data["next_retry_at"] = None

                await self._send_to_dlq(delivery, error_msg or "Max retries exceeded")
                logger.error(f"Delivery {delivery['id']} failed permanently. Moved to DLQ.")

        self.db.table("webhook_deliveries").update(update_data).eq("id", delivery["id"]).execute()

    async def _send_to_dlq(self, delivery: Dict[str, Any], error: str):
        dlq_data = {
            "webhook_config_id": delivery["webhook_config_id"],
            "event_type": delivery["event_type"],
            "event_payload": delivery["payload"],
            "error_message": error,
            "retry_count": delivery["attempt_count"]
        }
        try:
            self.db.table("dlq_entries").insert(dlq_data).execute()
        except Exception as e:
            logger.error(f"Failed to write to DLQ: {e}")

    # --- Helpers ---
    def _get_config(self, config_id: str):
        res = self.db.table("webhook_configs").select("*").eq("id", config_id).execute()
        return res.data[0] if res.data else None

    def _get_delivery(self, delivery_id: str):
        res = self.db.table("webhook_deliveries").select("*").eq("id", delivery_id).execute()
        return res.data[0] if res.data else None

    def _create_delivery_record(self, config_id: str, event_type: str, payload: Dict[str, Any], idempotency_key: str):
        data = {
            "webhook_config_id": config_id,
            "event_type": event_type,
            "payload": payload,
            "status": "pending",
            "idempotency_key": idempotency_key,
            "created_at": datetime.utcnow().isoformat()
        }
        res = self.db.table("webhook_deliveries").insert(data).execute()
        return res.data[0]["id"]

    def _is_duplicate(self, config_id: str, key: str) -> bool:
        redis_key = f"idempotency:{config_id}:{key}"
        return bool(self.redis.exists(redis_key))

    def _mark_idempotency_key(self, config_id: str, key: str):
        redis_key = f"idempotency:{config_id}:{key}"
        self.redis.setex(redis_key, 86400, str(int(time.time())))
