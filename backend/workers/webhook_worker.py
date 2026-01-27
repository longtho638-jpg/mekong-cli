import asyncio
import json
import logging
import time
from typing import Any, Dict

import aiohttp

from backend.workers.worker_base import BaseWorker

logger = logging.getLogger(__name__)

def process_webhook_handler(payload: Dict[str, Any]):
    """
    Handler for 'process_webhook' jobs.
    Delivers webhooks to external URLs with retry logic.

    Payload:
    - url: str
    - method: str (default: POST)
    - headers: dict
    - body: dict
    - event_id: str
    """
    url = payload.get("url")
    method = payload.get("method", "POST")
    headers = payload.get("headers", {})
    body = payload.get("body", {})
    event_id = payload.get("event_id")

    logger.info(f"Processing webhook {event_id} to {url}")

    async def _send_webhook():
        async with aiohttp.ClientSession() as session:
            try:
                async with session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=body,
                    timeout=10
                ) as response:
                    response_text = await response.text()
                    if response.status >= 400:
                        raise Exception(f"Webhook failed with status {response.status}: {response_text}")

                    return {
                        "status": response.status,
                        "response": response_text[:200] # Truncate log
                    }
            except Exception as e:
                logger.error(f"Webhook delivery failed: {str(e)}")
                raise

    # Run async code synchronously
    try:
        result = asyncio.run(_send_webhook())
        logger.info(f"Webhook {event_id} delivered successfully: {result['status']}")
        return result
    except Exception as e:
        # Rethrow to trigger worker retry logic
        raise e

if __name__ == "__main__":
    worker = BaseWorker(
        queues=["normal"], # Webhooks are normal priority
        worker_id=f"webhook-worker-{int(time.time())}"
    )
    worker.register_handler("process_webhook", process_webhook_handler)
    worker.start()
