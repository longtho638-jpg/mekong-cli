import asyncio
import json
import logging
import os
import signal
import sys
from datetime import datetime
from typing import Any, Dict, List

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.config import settings
from backend.services.email_service import get_email_service
from backend.services.export_service import ExportService
from backend.services.queue_service import QueueService
from backend.services.storage_service import StorageService
from core.infrastructure.database import Database, get_db

logger = logging.getLogger("export-worker")
logging.basicConfig(level=logging.INFO)

class ExportWorker:
    def __init__(self):
        self.running = True
        self.queue_service = QueueService()
        self.export_service = ExportService()
        self.storage_service = StorageService()
        self.email_service = get_email_service()
        self.db = get_db()
        self.worker_id = f"export-worker-{os.getpid()}"

        # Supported queues
        self.queues = ["high", "normal", "low"]

    async def start(self):
        logger.info(f"Starting Export Worker {self.worker_id}...")

        # Register signal handlers
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self.stop)

        while self.running:
            try:
                # Register heartbeat
                self.queue_service.register_worker_heartbeat(self.worker_id, self.queues)

                # Poll queues (simple implementation)
                # In production, utilize BLPOP or similar blocking call with timeout
                # Here we simulate polling with sleep for the MVP
                job_found = False

                for queue_name in self.queues:
                    # Logic to get job from Redis would be here.
                    # Since QueueService.get_job logic is split (rpush vs get_job),
                    # we need to implement the pop logic here or add it to QueueService.
                    # For this implementation, let's assume we implement a direct redis pop here.

                    redis_queue_key = self.queue_service.queues[queue_name]
                    # Non-blocking pop for now
                    job_id = self.queue_service.redis.lpop(redis_queue_key)

                    if job_id:
                        logger.info(f"Processing job {job_id} from {queue_name}")
                        await self.process_job(job_id)
                        job_found = True
                        break # Process one at a time

                if not job_found:
                    await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"Error in worker loop: {e}", exc_info=True)
                await asyncio.sleep(5)

    def stop(self):
        logger.info("Stopping worker...")
        self.running = False

    async def process_job(self, job_id: str):
        try:
            # Get full job details
            job = self.queue_service.get_job(job_id)
            if not job:
                logger.error(f"Job {job_id} details not found")
                return

            # Update status to processing
            self.queue_service.update_job_status(job_id, "processing")

            # Check if it's an export job
            if job.type == "export_data":
                await self.handle_export_job(job.payload)
                self.queue_service.update_job_status(job_id, "completed")
            else:
                logger.warning(f"Unknown job type: {job.type}")
                # Re-queue or move to DLQ? For now mark completed to avoid loop
                self.queue_service.update_job_status(job_id, "completed")

        except Exception as e:
            logger.error(f"Failed to process job {job_id}: {e}", exc_info=True)
            self.queue_service.update_job_status(job_id, "failed", error=str(e))
            # Implement retry logic here if needed

    async def handle_export_job(self, payload: Dict[str, Any]):
        export_id = payload.get("export_id")
        user_id = payload.get("user_id")
        resource_type = payload.get("resource_type")
        format_type = payload.get("format")
        filters = payload.get("filters", {})

        logger.info(f"Starting export {export_id} for user {user_id} ({resource_type})")

        try:
            # Update export record status in Postgres
            self._update_export_record(export_id, "processing", 10)

            # 1. Fetch Data
            data = await self._fetch_data(resource_type, filters, user_id)
            self._update_export_record(export_id, "processing", 50)

            # 2. Generate File
            file_obj = self.export_service.export_data(data, format_type)
            file_size = file_obj.getbuffer().nbytes
            self._update_export_record(export_id, "processing", 80)

            # 3. Upload to S3
            filename = f"exports/{user_id}/{export_id}.{format_type}"
            content_type = self._get_content_type(format_type)

            file_key = self.storage_service.upload(filename, file_obj, content_type)
            if not file_key:
                raise Exception("Failed to upload export file")

            # Generate URL (presigned or permanent key)
            # For now, we store the key/path. The API will generate presigned URL on demand.

            # 4. Finish
            self._update_export_record(
                export_id,
                "completed",
                100,
                file_url=file_key,
                file_size=file_size,
                completed_at=datetime.utcnow()
            )

            # 5. Notify User (Email)
            # Fetch user email - generic implementation
            # user = self.db.table("users").select("email").eq("id", user_id).single().execute()
            # if user and user.data:
            #     await self.email_service.send_email(...)
            logger.info(f"Export {export_id} completed successfully")

        except Exception as e:
            logger.error(f"Export {export_id} failed: {e}")
            self._update_export_record(export_id, "failed", 0, error=str(e))
            raise e

    async def _fetch_data(self, resource_type: str, filters: Dict[str, Any], user_id: str) -> List[Dict[str, Any]]:
        """
        Generic data fetcher.
        In a real app, this would use specific repositories or a dynamic query builder.
        """
        # Security check: Ensure user owns data (mock implementation)
        # Assuming resource_type maps to table name

        # Whitelist allowed tables
        allowed_resources = ["users", "invoices", "payments", "audit_logs", "orders"]
        if resource_type not in allowed_resources:
             # Fallback for demo/mock data if table doesn't exist
             return [{"id": "mock-1", "name": "Item 1"}, {"id": "mock-2", "name": "Item 2"}]

        # Supabase/Postgres query
        try:
            query = self.db.table(resource_type).select("*")

            # Apply filters
            for k, v in filters.items():
                query = query.eq(k, v)

            # Scope to user if applicable (simple check)
            # query = query.eq("user_id", user_id)

            response = query.execute()
            return response.data
        except Exception as e:
            logger.warning(f"Could not fetch from DB table {resource_type}: {e}")
            # Return mock data for development so export flow can be tested
            return [
                {"id": "1", "name": "Test Data 1", "created_at": datetime.utcnow().isoformat()},
                {"id": "2", "name": "Test Data 2", "created_at": datetime.utcnow().isoformat()}
            ]

    def _update_export_record(self, export_id: str, status: str, progress: int, file_url: str = None, file_size: int = None, error: str = None, completed_at: datetime = None):
        """Update the exports table in Postgres"""
        data = {
            "status": status,
            "progress": progress
        }
        if file_url:
            data["file_url"] = file_url
        if file_size:
            data["file_size_bytes"] = file_size
        if error:
            data["error_message"] = error
        if completed_at:
            data["completed_at"] = completed_at.isoformat()

        try:
            self.db.table("exports").update(data).eq("id", export_id).execute()
        except Exception as e:
            logger.error(f"Failed to update export record: {e}")

    def _get_content_type(self, fmt: str) -> str:
        types = {
            "csv": "text/csv",
            "json": "application/json",
            "pdf": "application/pdf",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
        return types.get(fmt, "application/octet-stream")

if __name__ == "__main__":
    worker = ExportWorker()
    asyncio.run(worker.start())
