"""
Webhook Background Worker.
Processes webhook events from the Redis queue.
"""
import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime

# Ensure backend path is in sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.api.routers.webhooks.models import WebhookStatus
from backend.services.webhook_queue import webhook_queue
from backend.services.webhook_receiver import webhook_receiver
from backend.services.webhook_sender import webhook_sender

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("webhook-worker")

class WebhookWorker:
    def __init__(self):
        self.running = True
        self.poll_interval = 1.0 # seconds

    async def start(self):
        logger.info("🚀 Webhook Worker started")

        # Setup graceful shutdown
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, self.stop)

        while self.running:
            try:
                # 1. Dequeue event (blocking with timeout)
                # Since our dequeue is blocking on redis, we can run it in executor or
                # if we have async redis, await it. The current service uses sync redis.
                # Ideally, we should use async redis for the worker.
                # For now, we'll wrap the sync call.

                event_id = await loop.run_in_executor(None, webhook_queue.dequeue, 5)

                if event_id:
                    logger.info(f"📨 Processing event: {event_id}")
                    await self.process_event(event_id)
                else:
                    # No events, small sleep to prevent tight loop if redis is down
                    # But dequeue has timeout, so we are good.
                    pass

                # 2. Process outgoing retries periodically
                # In a real system, this might be a separate scheduler or checking every X seconds
                if int(datetime.utcnow().timestamp()) % 10 == 0:
                    await webhook_sender.process_retries()

            except Exception as e:
                logger.error(f"Worker loop error: {e}", exc_info=True)
                await asyncio.sleep(1)

        logger.info("🛑 Webhook Worker stopped")

    def stop(self):
        logger.info("Stopping worker...")
        self.running = False

    async def process_event(self, event_id: str):
        """
        Process a single webhook event.
        1. Fetch event data
        2. Determine logic based on provider/type
        3. Trigger outgoing webhooks (if configured)
        4. Update status
        """
        try:
            # 1. Fetch event from DB
            # We need to access DB via receiver service or direct DB access
            # Let's add a method to receiver or use DB directly
            db = webhook_receiver.db
            res = db.table("webhook_events").select("*").eq("id", event_id).single().execute()

            if not res.data:
                logger.error(f"Event not found in DB: {event_id}")
                return

            event = res.data

            # 2. Business Logic Router
            # Here we would dispatch to specific handlers based on event["provider"] and event["event_type"]
            # e.g. if provider == 'stripe' and type == 'checkout.session.completed' -> handle_checkout()

            logger.info(f"Processing logic for {event['provider']}:{event['event_type']}")

            # Example: Trigger outgoing webhooks (Fan-out)
            # This allows internal events to be pushed to external subscribers
            await webhook_sender.trigger_webhooks(event['event_type'], event['payload'])

            # 3. Update Status
            await webhook_receiver.update_status(event_id, WebhookStatus.PROCESSED)

        except Exception as e:
            logger.error(f"Error processing event {event_id}: {e}")
            await webhook_receiver.update_status(event_id, WebhookStatus.FAILED, str(e))
            # Optional: Send to DLQ if permanent failure?
            # For now, failed status in DB is enough, or push to redis DLQ
            webhook_queue.send_to_dlq({"event_id": event_id, "error": str(e)})

if __name__ == "__main__":
    worker = WebhookWorker()
    asyncio.run(worker.start())
