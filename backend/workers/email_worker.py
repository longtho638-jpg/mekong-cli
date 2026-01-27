import asyncio
import logging
import time
from typing import Any, Dict

from backend.services.email_service import get_email_service
from backend.workers.worker_base import BaseWorker

logger = logging.getLogger(__name__)

def send_email_handler(payload: Dict[str, Any]):
    """
    Handler for 'send_email' jobs.
    Wraps the async EmailService in a synchronous handler.

    Payload schema matches EmailService.send_email arguments.
    """
    to_email = payload.get("to_email")
    subject = payload.get("subject")

    logger.info(f"Starting email job: To={to_email}, Subject={subject}")

    async def _execute_async():
        service = get_email_service()
        # Filter payload to only include valid arguments for send_email
        # simplistic approach: pass **payload and let python raise TypeError if unexpected args
        # or we could validate strictly.
        await service.send_email(**payload)

    try:
        # Run the async email sending within this synchronous worker thread
        asyncio.run(_execute_async())
        logger.info(f"Email sent successfully to {to_email}")
        return {"status": "sent", "recipient": to_email}
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise

if __name__ == "__main__":
    # Standalone execution
    worker = BaseWorker(
        queues=["high"], # Email is usually high priority
        worker_id=f"email-worker-{int(time.time())}"
    )
    worker.register_handler("send_email", send_email_handler)
    worker.start()
