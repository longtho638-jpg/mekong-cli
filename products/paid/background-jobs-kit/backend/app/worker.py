import time
import logging
import signal
import sys
from typing import Dict, Any
from app.services.queue import QueueService, JobStatus

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("worker")

queue_service = QueueService()
running = True

def signal_handler(sig, frame):
    global running
    logger.info("Shutdown signal received, stopping worker...")
    running = False

def execute_task(task_name: str, payload: Dict[str, Any]):
    """
    Task registry and execution logic.
    In a real app, this would dispatch to specific functions.
    """
    logger.info(f"Executing task: {task_name} with payload: {payload}")

    # Simulate processing time
    time.sleep(2)

    if task_name == "email_notification":
        # Simulate email sending
        if "email" not in payload:
            raise ValueError("Missing 'email' in payload")
        return f"Email sent to {payload['email']}"

    elif task_name == "data_processing":
        # Simulate data crunching
        return f"Processed {len(payload.get('data', []))} items"

    elif task_name == "fail_test":
        # Simulate a failure
        raise RuntimeError("Simulated failure for testing")

    else:
        # Default handler or unknown task
        return f"Executed generic task {task_name}"

def run_worker():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    logger.info("Worker started, waiting for jobs...")

    while running:
        try:
            job = queue_service.dequeue()
            if job:
                logger.info(f"Processing job {job.job_id} ({job.task_name})")
                try:
                    result = execute_task(job.task_name, job.payload)
                    queue_service.complete_job(job.job_id, result)
                except Exception as e:
                    logger.error(f"Error processing job {job.job_id}: {str(e)}")
                    queue_service.fail_job(job.job_id, str(e))
            else:
                # Sleep briefly to avoid hammering Redis when empty
                # Using blocking pop (BLPOP) in queue service would be better for prod,
                # but rpoplpush is non-blocking.
                time.sleep(1)

        except Exception as e:
            logger.error(f"Worker loop error: {str(e)}")
            time.sleep(5)

    logger.info("Worker stopped.")

if __name__ == "__main__":
    run_worker()
