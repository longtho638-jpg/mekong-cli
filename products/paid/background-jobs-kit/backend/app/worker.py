import time
import logging
import signal
import sys
import asyncio
from typing import Dict, Any
from app.services.queue import get_queue_service, JobStatus

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("worker")

queue_service = get_queue_service()
running = True

def signal_handler(sig, frame):
    global running
    logger.info("Shutdown signal received, stopping worker...")
    running = False

async def execute_task(task_name: str, payload: Dict[str, Any]):
    """
    Task registry and execution logic.
    In a real app, this would dispatch to specific functions.
    """
    logger.info(f"Executing task: {task_name} with payload: {payload}")

    # Simulate processing time
    await asyncio.sleep(2)

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

async def run_worker():
    # signal.signal works on the main thread, which is fine here.
    # We check 'running' flag in the loop.
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    logger.info("Worker started, waiting for jobs...")

    while running:
        try:
            job = await queue_service.dequeue()
            if job:
                logger.info(f"Processing job {job.job_id} ({job.task_name})")
                try:
                    result = await execute_task(job.task_name, job.payload)
                    await queue_service.complete_job(job.job_id, result)
                except Exception as e:
                    logger.error(f"Error processing job {job.job_id}: {str(e)}")
                    await queue_service.fail_job(job.job_id, str(e))
            else:
                # Sleep briefly to avoid hammering Redis when empty
                await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Worker loop error: {str(e)}")
            await asyncio.sleep(5)

    logger.info("Worker stopped.")

if __name__ == "__main__":
    asyncio.run(run_worker())
