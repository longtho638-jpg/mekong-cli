"""
Advanced Webhook Service.
Orchestrates reliable webhook delivery with retries, DLQ, and rate limiting.
"""
import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

from backend.services.webhooks.matcher import SubscriptionMatcher
from backend.services.webhooks.rate_limiter import RateLimiter
from backend.services.webhooks.retry_engine import CircuitState, RetryPolicyEngine
from backend.services.webhooks.signature_service import SignatureService
from backend.services.webhooks.transformer_service import WebhookTransformer
from core.infrastructure.database import get_db

logger = logging.getLogger(__name__)

class AdvancedWebhookService:
    def __init__(self, redis_client):
        self.db = get_db()
        self.redis = redis_client
        self.signature_service = SignatureService()
        self.transformer = WebhookTransformer()
        self.rate_limiter = RateLimiter(redis_client)
        self.retry_engine = RetryPolicyEngine(redis_client)
        self.matcher = SubscriptionMatcher()

        # Configuration
        self.default_timeout = 10 # seconds

    async def broadcast_event(self, event_type: str, payload: Dict[str, Any]):
        """
        Fan-out: Find all subscribers for this event and trigger webhooks.
        """
        # 1. Fetch all active configs
        # In production, query filtering should be done in DB level for event_types overlap
        # For now, fetch active and filter in memory using Matcher
        try:
            res = self.db.table("webhook_configs").select("*").eq("is_active", True).execute()
            configs = res.data or []

            tasks = []
            for config in configs:
                # 2. Match
                if self.matcher.is_match(config, event_type, payload):
                    # 3. Trigger (Async)
                    tasks.append(
                        self.trigger_webhook(config["id"], event_type, payload)
                    )

            if tasks:
                await asyncio.gather(*tasks)
                logger.info(f"Broadcasted event {event_type} to {len(tasks)} endpoints")

        except Exception as e:
            logger.error(f"Error broadcasting event {event_type}: {e}")

    async def trigger_webhook(self, webhook_config_id: str, event_type: str, payload: Dict[str, Any], idempotency_key: Optional[str] = None):
        """
        Main entry point to trigger a webhook.
        Handles idempotency, transformation, rate limiting, and initial delivery.
        """
        # 1. Idempotency Check
        if idempotency_key:
            if self._is_duplicate(webhook_config_id, idempotency_key):
                logger.info(f"Duplicate webhook event ignored. Key: {idempotency_key}")
                return
            self._mark_idempotency_key(webhook_config_id, idempotency_key)
        else:
            idempotency_key = str(uuid.uuid4())

        # 2. Fetch Config
        config = self._get_config(webhook_config_id)
        if not config:
            logger.error(f"Webhook config not found: {webhook_config_id}")
            return

        if not config.get("is_active", True):
            return

        # 3. Rate Limiting
        # Default: 10 req/s, burst 50
        rate = config.get("rate_limit", 10.0)
        burst = config.get("burst_limit", 50)

        if not self.rate_limiter.is_allowed(webhook_config_id, rate, burst):
            logger.warning(f"Rate limit exceeded for webhook {webhook_config_id}")
            # Optionally queue for later or drop. For now, we drop or could throw error.
            # Ideally, push to a separate "throttled" queue.
            # For this implementation, we'll return false/drop to signal backpressure.
            return

        # 4. Circuit Breaker Check
        circuit_status = self.retry_engine.get_circuit_status(webhook_config_id)
        if circuit_status == CircuitState.OPEN:
            logger.warning(f"Circuit OPEN for webhook {webhook_config_id}. Skipping delivery.")
            return

        # 5. Transformation & Filtering
        try:
            # Assume config has 'template' and 'excluded_fields'
            template = config.get("transformation_template")
            excluded_fields = config.get("excluded_fields", [])

            final_payload = self.transformer.filter_fields(payload, excluded_fields)
            final_payload = self.transformer.transform_payload(final_payload, template)

        except ValueError as e:
            logger.error(f"Transformation error: {e}")
            # This is a permanent error, maybe send to DLQ directly?
            # Or just log.
            return

        # 6. Create Delivery Record
        delivery_id = self._create_delivery_record(
            webhook_config_id, event_type, final_payload, idempotency_key
        )

        # 7. Execute Delivery (Async)
        # In a real queue system, this would push to queue.
        # Here we'll call execute directly for simplicity of the "service" layer,
        # but typically this service method might be called FROM a worker.
        # If called from API, we should probably spawn a background task.
        asyncio.create_task(self.execute_delivery_attempt(delivery_id, config, final_payload))

    async def execute_delivery_attempt(self, delivery_id: str, config: Dict[str, Any], payload: Dict[str, Any]):
        """
        Execute a single delivery attempt.
        """
        # Fetch current delivery status/attempt count
        delivery = self._get_delivery(delivery_id)
        if not delivery:
            return

        attempt_number = delivery.get("attempt_count", 0) + 1

        # Prepare Request
        url = config["url"]
        secret = config["secret"]
        payload_json = json.dumps(payload)
        timestamp = int(time.time())

        # Signatures
        # Support multiple algorithms based on config? Defaulting to HMAC-SHA256 for now.
        signature = self.signature_service.generate_hmac_signature(payload_json, secret)
        sig_header = self.signature_service.construct_header_value(timestamp, signature)

        headers = {
            "Content-Type": "application/json",
            "AgencyOS-Signature": sig_header,
            "AgencyOS-Event-Id": str(delivery_id),
            "User-Agent": "AgencyOS-Webhook/2.0",
            "X-AgencyOS-Event": delivery["event_type"]
        }

        # Add idempotency header if applicable
        if delivery.get("idempotency_key"):
            headers["Idempotency-Key"] = delivery["idempotency_key"]

        start_time = time.time()
        success = False
        response_status = 0
        response_body = ""
        error_msg = None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=payload_json, headers=headers, timeout=self.default_timeout) as response:
                    response_status = response.status
                    response_body = await response.text()
                    if 200 <= response_status < 300:
                        success = True
                    else:
                        success = False
                        error_msg = f"HTTP {response_status}"

        except Exception as e:
            success = False
            error_msg = str(e)
            response_status = 0

        duration_ms = int((time.time() - start_time) * 1000)

        # Update State
        await self._handle_attempt_result(
            delivery, config, attempt_number, success, response_status, response_body, error_msg, duration_ms
        )

    async def _handle_attempt_result(self, delivery: Dict[str, Any], config: Dict[str, Any],
                                     attempt_number: int, success: bool, response_status: int,
                                     response_body: str, error_msg: str, duration_ms: int):

        webhook_id = config["id"]

        # 1. Record Attempt in `webhook_delivery_attempts`
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
            self.retry_engine.record_success(webhook_id)
        else:
            self.retry_engine.record_failure(webhook_id)

        # 3. Update Delivery Record & Schedule Retry
        update_data = {
            "attempt_count": attempt_number,
            "updated_at": datetime.utcnow().isoformat(),
            "response_status": response_status,
            "response_body": response_body[:2000] if response_body else None
        }

        if success:
            update_data["status"] = "success"
            # Clear next retry
            update_data["next_retry_at"] = None
        else:
            # Check Max Retries
            max_retries = config.get("max_retries", 5)

            if attempt_number < max_retries:
                # Schedule Retry
                backoff = self.retry_engine.calculate_backoff(attempt_number)
                next_retry = datetime.utcnow() + timedelta(seconds=backoff)

                update_data["status"] = "pending"
                update_data["next_retry_at"] = next_retry.isoformat()
            else:
                # Permanent Failure -> DLQ
                update_data["status"] = "failed"
                update_data["next_retry_at"] = None

                await self._send_to_dlq(delivery, error_msg or "Max retries exceeded")

        self.db.table("webhook_deliveries").update(update_data).eq("id", delivery["id"]).execute()

    async def _send_to_dlq(self, delivery: Dict[str, Any], error: str):
        """Move to Dead Letter Queue."""
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

    def _get_config(self, config_id: str) -> Optional[Dict[str, Any]]:
        res = self.db.table("webhook_configs").select("*").eq("id", config_id).execute()
        return res.data[0] if res.data else None

    def _get_delivery(self, delivery_id: str) -> Optional[Dict[str, Any]]:
        res = self.db.table("webhook_deliveries").select("*").eq("id", delivery_id).execute()
        return res.data[0] if res.data else None

    def _create_delivery_record(self, config_id: str, event_type: str, payload: Dict[str, Any], idempotency_key: str) -> str:
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
        self.redis.setex(redis_key, 86400, str(int(time.time()))) # 24h TTL

    # --- Batch Operations ---
    async def queue_event_for_batch(self, webhook_config_id: str, event_type: str, payload: Dict[str, Any]):
        """
        Add an event to the batch buffer for a specific endpoint.
        """
        key = f"batch:{webhook_config_id}"
        event = {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Add to Redis List
        self.redis.rpush(key, json.dumps(event))

        # Check size trigger
        # We also need a time-based trigger, usually handled by a worker
        config = self._get_config(webhook_config_id)
        max_size = config.get("batch_size", 10)

        current_size = self.redis.llen(key)
        if current_size >= max_size:
            await self.flush_batch(webhook_config_id)

    async def flush_batch(self, webhook_config_id: str):
        """
        Send all queued events in a single batch request.
        """
        key = f"batch:{webhook_config_id}"

        # Pop all items
        pipeline = self.redis.pipeline()
        pipeline.lrange(key, 0, -1)
        pipeline.delete(key)
        results = pipeline.execute()

        raw_events = results[0]
        if not raw_events:
            return

        events = [json.loads(e) for e in raw_events]

        # Create a "Batch Delivery" record
        # We treat the batch as a single delivery payload
        batch_payload = {
            "batch_id": str(uuid.uuid4()),
            "count": len(events),
            "events": events
        }

        # Trigger as a normal webhook but with "batch" event type?
        # Or just use the standard trigger mechanism
        await self.trigger_webhook(
            webhook_config_id,
            "batch.events",
            batch_payload,
            idempotency_key=str(uuid.uuid4())
        )

    async def flush_stale_batches(self, max_wait_seconds: int = 60):
        """
        Check for batches that have waiting events but haven't been flushed recently.
        This relies on checking the timestamp of the first event in the batch.
        """
        # Scan for all batch keys
        # In production with many keys, use SCAN iter.
        # Pattern: batch:*
        cursor = '0'
        while cursor != 0:
            cursor, keys = self.redis.scan(cursor=cursor, match="batch:*", count=100)
            for key in keys:
                # Key is bytes in some redis clients, handle carefully
                if isinstance(key, bytes):
                    key = key.decode('utf-8')

                # key format: batch:{config_id}
                config_id = key.split(":", 1)[1]

                # Check first item to see age
                # We peek at the first item (index 0)
                first_item_raw = self.redis.lindex(key, 0)
                if not first_item_raw:
                    continue

                first_item = json.loads(first_item_raw)
                timestamp_str = first_item.get("timestamp")
                if not timestamp_str:
                    continue

                created_at = datetime.fromisoformat(timestamp_str)
                age = (datetime.utcnow() - created_at).total_seconds()

                if age >= max_wait_seconds:
                    logger.info(f"Flushing stale batch for {config_id} (age: {age}s)")
                    await self.flush_batch(config_id)

    # --- Health Stats ---
    def get_health_stats(self, webhook_config_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculate health statistics (Success Rate, Latency).
        """
        # This would ideally use a time-series DB or pre-aggregated metrics.
        # For now, we query the `webhook_delivery_attempts` table.

        # Filter for last 24h
        since = (datetime.utcnow() - timedelta(hours=24)).isoformat()

        query = self.db.table("webhook_delivery_attempts")\
            .select("status, duration_ms")\
            .gte("created_at", since)

        if webhook_config_id:
            query = query.eq("webhook_config_id", webhook_config_id)

        res = query.execute()
        attempts = res.data

        if not attempts:
            return {
                "success_rate": 0,
                "avg_latency": 0,
                "total": 0
            }

        total = len(attempts)
        success_count = sum(1 for a in attempts if a["status"] == "success")
        latencies = [a["duration_ms"] for a in attempts if a["duration_ms"] is not None]

        success_rate = (success_count / total) * 100 if total > 0 else 0
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        return {
            "success_rate": round(success_rate, 2),
            "avg_latency": int(avg_latency),
            "total_events": total
        }

    # --- DLQ Operations ---
    def get_dlq_entries(self, config_id: Optional[str] = None, limit: int = 50, offset: int = 0):
        query = self.db.table("dlq_entries").select("*").order("stored_at", desc=True).range(offset, offset + limit - 1)
        if config_id:
            query = query.eq("webhook_config_id", config_id)
        return query.execute().data

    async def replay_dlq_entry(self, entry_id: str):
        """Replay a single DLQ entry."""
        # Fetch entry
        res = self.db.table("dlq_entries").select("*").eq("id", entry_id).execute()
        if not res.data:
            return False

        entry = res.data[0]
        config_id = entry["webhook_config_id"]

        # Trigger new delivery
        await self.trigger_webhook(
            config_id,
            entry["event_type"],
            entry["event_payload"],
            idempotency_key=f"replay-{entry_id}" # New idempotency key for replay
        )

        # Mark as replayed
        self.db.table("dlq_entries").update({
            "replayed_at": datetime.utcnow().isoformat()
        }).eq("id", entry_id).execute()

        return True

    def discard_dlq_entry(self, entry_id: str):
        """Archive/Delete DLQ entry."""
        self.db.table("dlq_entries").update({
            "is_archived": True
        }).eq("id", entry_id).execute()
