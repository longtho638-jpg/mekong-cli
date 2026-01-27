"""
Webhook Retry Worker.
Background process to poll for pending retries and execute them.
"""
import asyncio
import logging
import signal
import sys
from datetime import datetime

from backend.services.webhooks.advanced_service import AdvancedWebhookService
from core.infrastructure.database import get_db
from core.infrastructure.redis import get_redis_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("webhook-worker")

class WebhookWorker:
    def __init__(self):
        self.running = True
        self.db = get_db()
        self.redis = get_redis_client()
        self.service = AdvancedWebhookService(self.redis)
        self.poll_interval = 5 # seconds

    async def start(self):
        logger.info("Starting Webhook Retry Worker...")

        # Register signal handlers
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self.stop)

        while self.running:
            try:
                await self.process_pending_retries()
                # Also process stale batches
                await self.service.flush_stale_batches(max_wait_seconds=60)
            except Exception as e:
                logger.error(f"Error in worker loop: {e}")

            await asyncio.sleep(self.poll_interval)

    def stop(self):
        logger.info("Stopping worker...")
        self.running = False

    async def process_pending_retries(self):
        """Fetch and process retries."""
        now = datetime.utcnow().isoformat()

        # 1. Fetch pending deliveries
        # status='pending' AND next_retry_at <= now
        res = self.db.table("webhook_deliveries")\
            .select("*")\
            .eq("status", "pending")\
            .lte("next_retry_at", now)\
            .limit(50)\
            .execute()

        deliveries = res.data
        if not deliveries:
            return

        logger.info(f"Processing {len(deliveries)} pending retries")

        tasks = []
        for delivery in deliveries:
            # Get config
            config = self.service._get_config(delivery["webhook_config_id"])
            if not config:
                logger.warning(f"Config not found for delivery {delivery['id']}")
                continue

            tasks.append(
                self.service.execute_delivery_attempt(
                    delivery["id"],
                    config,
                    delivery["payload"]
                )
            )

        # Run concurrently
        if tasks:
            await asyncio.gather(*tasks)

if __name__ == "__main__":
    worker = WebhookWorker()
    asyncio.run(worker.start())
