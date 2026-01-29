import json
import logging
import time
from typing import Any, Dict
from uuid import uuid4

from backend.workers.worker_base import BaseWorker

logger = logging.getLogger(__name__)


def export_data_handler(payload: Dict[str, Any]):
    """
    Handler for 'export_data' jobs.
    Handles GDPR/User data exports.

    Payload:
    - user_id: str
    - export_format: 'json' | 'zip'
    - include_logs: bool
    """
    user_id = payload.get("user_id")
    export_format = payload.get("export_format", "json")

    logger.info(f"Starting data export for user {user_id} (Format: {export_format})")

    # Simulate heavy I/O
    # In reality: Fetch all user data, serialize, compress
    time.sleep(10)

    export_id = str(uuid4())
    # Mock URL
    download_url = f"https://api.agencyos.dev/exports/{export_id}.{export_format}"

    logger.info(f"Export completed: {download_url}")

    return {
        "status": "completed",
        "export_id": export_id,
        "download_url": download_url,
        "size_bytes": 1024 * 1024 * 5,  # 5MB
    }


def cleanup_old_data_handler(payload: Dict[str, Any]):
    """
    Handler for 'cleanup_old_data' jobs.
    Scheduled maintenance.
    """
    retention_days = payload.get("retention_days", 30)
    logger.info(f"Starting cleanup of data older than {retention_days} days")

    time.sleep(5)

    logger.info("Cleanup completed. Removed 142 items.")
    return {"status": "completed", "items_removed": 142}


if __name__ == "__main__":
    worker = BaseWorker(
        queues=["low"],  # Exports and cleanup are low priority
        worker_id=f"export-worker-{int(time.time())}",
    )
    worker.register_handler("export_data", export_data_handler)
    worker.register_handler("cleanup_old_data", cleanup_old_data_handler)
    worker.start()
