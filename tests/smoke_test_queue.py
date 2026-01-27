import logging
import os
import sys
import threading
import time
import uuid
from datetime import datetime, timedelta

# Add root directory to path to allow imports from backend and antigravity
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.queue_service import QueueService
from backend.workers.worker_base import BaseWorker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smoke_test")

def mock_email_handler(payload):
    logger.info(f"Sending email to {payload.get('to')}...")
    time.sleep(0.5)
    if payload.get("fail"):
        raise ValueError("Simulated failure")
    return {"status": "sent"}

def run_worker_thread(worker):
    logger.info("Starting worker thread...")
    worker.start()

def test_job_flow():
    queue_service = QueueService()

    # Clean up queues before test
    logger.info("Cleaning queues...")
    queue_service.redis.delete("agencyos:queue:high")
    queue_service.redis.delete("agencyos:queue:normal")
    queue_service.redis.delete("agencyos:queue:dlq")

    # 1. Enqueue a normal job
    logger.info("1. Enqueueing normal job...")
    job_id = queue_service.enqueue_job(
        job_type="test_email",
        payload={"to": "test@example.com", "subject": "Hello"},
        priority="high"
    )
    logger.info(f"Job enqueued: {job_id}")

    # Verify job is in Redis
    job = queue_service.get_job(job_id)
    assert job is not None
    assert job.status == "pending"
    assert job.priority == "high"

    # 2. Start Worker
    logger.info("2. Starting Worker...")
    # NOTE: Workers should NOT listen to DLQ in normal operation to avoid infinite loops on failed jobs
    worker = BaseWorker(queues=["high", "normal"], worker_id="test-worker")
    worker.register_handler("test_email", mock_email_handler)

    # Run worker in separate thread so we can monitor
    worker_thread = threading.Thread(target=run_worker_thread, args=(worker,))
    worker_thread.daemon = True
    worker_thread.start()

    # Wait for processing
    time.sleep(2)

    # 3. Verify Job Completion
    logger.info("3. Verifying Job Completion...")
    job = queue_service.get_job(job_id)
    assert job.status == "completed"
    logger.info("Job completed successfully!")

    # 4. Test Retry Logic
    logger.info("4. Testing Retry Logic...")
    fail_job_id = queue_service.enqueue_job(
        job_type="test_email",
        payload={"to": "fail@example.com", "fail": True},
        priority="normal",
        max_retries=2,
        retry_delay_seconds=[1, 2] # Short delays for testing
    )

    # Worker should pick it up, fail, and schedule retry
    time.sleep(2)

    fail_job = queue_service.get_job(fail_job_id)
    logger.info(f"Failed job status: {fail_job.status}, attempts: {fail_job.attempts}")

    assert fail_job.status == "scheduled" or fail_job.status == "failed" # Depends on timing
    assert fail_job.attempts >= 1

    # If scheduled, we need to wait for the scheduler (built into worker) to pick it up
    logger.info("Waiting for retry...")
    time.sleep(2) # Wait for retry delay

    # Worker checks schedule every poll_interval
    time.sleep(2)

    fail_job = queue_service.get_job(fail_job_id)
    logger.info(f"Failed job status after retry wait: {fail_job.status}, attempts: {fail_job.attempts}")

    # 5. Stop Worker
    logger.info("5. Stopping Worker...")
    worker.running = False
    worker_thread.join(timeout=5)

    logger.info("Smoke test passed!")

if __name__ == "__main__":
    test_job_flow()
