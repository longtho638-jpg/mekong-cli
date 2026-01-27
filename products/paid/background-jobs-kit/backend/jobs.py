import asyncio
import tyro
import json
from typing import Dict, Any, Optional
from app.services.queue import get_queue_service
from app.services.scheduler import SchedulerService
from app.worker import run_worker

async def create_job(task_name: str, payload: str = "{}", delay: int = 0):
    """
    Create a new job.

    Args:
        task_name: Name of the task to execute
        payload: JSON string payload
        delay: Delay in seconds
    """
    try:
        payload_dict = json.loads(payload)
    except json.JSONDecodeError:
        print("Error: Payload must be valid JSON")
        return

    queue = get_queue_service()
    job_id = await queue.enqueue(task_name, payload_dict, delay_seconds=delay)
    print(f"Job created with ID: {job_id}")

async def stats():
    """
    View queue statistics.
    """
    queue = get_queue_service()
    stats = await queue.get_stats()
    print("\nQueue Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    print("")

async def worker(queue_name: str = "default"):
    """
    Start a worker process.
    """
    print(f"Starting worker for queue: {queue_name}")
    await run_worker()

async def scheduler():
    """
    Start the scheduler process.
    """
    print("Starting scheduler...")
    service = SchedulerService()
    await service.start()

async def clear_failed():
    """
    Clear all failed jobs.
    """
    queue = get_queue_service()
    count = await queue.clear_failed()
    print(f"Cleared {count} failed jobs")

def main():
    # Use tyro to dispatch to one of the async functions
    # We need to run the coroutine returned by tyro
    task = tyro.extras.subcommand_cli_from_dict({
        "create-job": create_job,
        "stats": stats,
        "worker": worker,
        "scheduler": scheduler,
        "clear-failed": clear_failed,
    })

    if asyncio.iscoroutine(task):
        asyncio.run(task)

if __name__ == "__main__":
    main()
