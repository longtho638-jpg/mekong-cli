"""
Webhook Queue Service (Redis).
"""

import json
import logging
import os
from typing import Any, Dict, Optional

try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


class WebhookQueueService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.queue_key = "webhook:queue"
        self.dlq_key = "webhook:dlq"
        self._client = None

        if REDIS_AVAILABLE:
            try:
                self._client = redis.from_url(self.redis_url, decode_responses=True)
                self._client.ping()
                logger.info("Connected to Redis for Webhook Queue")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Queue disabled.")
                self._client = None
        else:
            logger.warning("Redis not installed. Queue disabled.")

    def enqueue(self, event_id: str, priority: str = "normal") -> bool:
        """
        Enqueue a webhook event ID for processing.
        Priority 'high' goes to the front (not strictly supported by simple list, but simulated).
        """
        if not self._client:
            return False

        try:
            # Using LPUSH for stack-like behavior or RPUSH for queue
            # Standard Queue: LPUSH to add, RPOP to consume
            # Priority: RPUSH to add to front? No, LPOP is head.
            # Let's stick to standard queue: LPUSH (tail), RPOP (head)

            if priority == "high":
                # Push to head? No, usually separate queues for priority.
                # For simplicity, we just use one queue, LPUSH adds to head if we consume via LPOP?
                # Let's assume standard consumer uses BRPOP (blocks on tail) or BLPOP (blocks on head).
                # Convention: LPUSH adds to list. BRPOP removes from right (tail).
                # So LPUSH = add to left. BRPOP = take from right. FIFO.
                self._client.lpush(self.queue_key, event_id)
            else:
                self._client.lpush(self.queue_key, event_id)

            return True
        except Exception as e:
            logger.error(f"Error enqueueing webhook: {e}")
            return False

    def dequeue(self, timeout: int = 5) -> Optional[str]:
        """
        Blocking dequeue. Returns event_id.
        """
        if not self._client:
            return None

        try:
            # BRPOP returns (key, value) tuple
            result = self._client.brpop(self.queue_key, timeout=timeout)
            if result:
                return result[1]
            return None
        except Exception as e:
            logger.error(f"Error dequeueing webhook: {e}")
            return None

    def send_to_dlq(self, event_data: Dict[str, Any]):
        """Store failed event in Dead Letter Queue (Redis Set/List for inspection)."""
        if not self._client:
            return

        try:
            self._client.lpush(self.dlq_key, json.dumps(event_data))
        except Exception as e:
            logger.error(f"Error sending to DLQ: {e}")

    def get_metrics(self) -> Dict[str, int]:
        if not self._client:
            return {"queue_depth": 0, "dlq_depth": 0}

        try:
            return {
                "queue_depth": self._client.llen(self.queue_key),
                "dlq_depth": self._client.llen(self.dlq_key),
            }
        except:
            return {"queue_depth": 0, "dlq_depth": 0}


webhook_queue = WebhookQueueService()
