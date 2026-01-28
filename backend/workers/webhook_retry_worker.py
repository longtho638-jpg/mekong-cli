"""
Webhook Retry Worker.
Background worker that polls for pending retries and executes them using the Fire Engine.
"""
import asyncio
import logging
import time
from datetime import datetime
from typing import Any, Dict

from backend.services.webhook_fire_engine import WebhookFireEngine
from backend.workers.worker_base import BaseWorker
from core.infrastructure.database import get_db
from core.infrastructure.redis import get_redis_client

logger = logging.getLogger(__name__)

class WebhookRetryWorker:
    def __init__(self):
        self.db = get_db()
        self.redis = get_redis_client()
        self.fire_engine = WebhookFireEngine(self.redis)
        self.running = False
        self.poll_interval = 5 # seconds

    async def start(self):
        self.running = True
        logger.info("Starting Webhook Retry Worker...")
        while self.running:
            try:
                await self.process_pending_retries()
            except Exception as e:
                logger.error(f"Error in retry loop: {e}")

            await asyncio.sleep(self.poll_interval)

    async def process_pending_retries(self):
        """
        Find deliveries with status='pending' and next_retry_at <= now.
        """
        now = datetime.utcnow().isoformat()

        # Fetch due retries
        # Limit to 50 at a time to prevent backlog explosion
        res = self.db.table("webhook_deliveries")\
            .select("*")\
            .eq("status", "pending")\
            .lte("next_retry_at", now)\
            .limit(50)\
            .execute()

        deliveries = res.data or []

        if not deliveries:
            return

        logger.info(f"Found {len(deliveries)} pending retries")

        tasks = []
        for delivery in deliveries:
            tasks.append(self.execute_retry(delivery))

        await asyncio.gather(*tasks)

    async def execute_retry(self, delivery: Dict[str, Any]):
        """
        Execute a single retry.
        We need config to pass to execute_attempt.
        """
        config_id = delivery["webhook_config_id"]

        # We need to fetch config again to get URL/Secret
        # In optimized version, we might join or cache configs
        config_res = self.db.table("webhook_configs").select("*").eq("id", config_id).execute()
        if not config_res.data:
            logger.error(f"Config {config_id} not found for delivery {delivery['id']}")
            return

        config = config_res.data[0]
        payload = delivery["payload"] # delivery has the payload

        # Use Fire Engine to execute the attempt
        # Logic for creating new attempt record and scheduling next retry is handled inside execute_attempt
        await self.fire_engine.execute_attempt(delivery["id"], config, payload)

if __name__ == "__main__":
    # Entry point for standalone worker
    logging.basicConfig(level=logging.INFO)
    worker = WebhookRetryWorker()
    asyncio.run(worker.start())
