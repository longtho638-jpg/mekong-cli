import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

import aiohttp
import boto3

from backend.api.config import settings
from backend.db.session import SessionLocal
from backend.services.audit_service import audit_service

logger = logging.getLogger(__name__)

class AuditProcessor:
    """
    Background worker for audit log processing:
    1. SIEM Forwarding (Splunk, ELK, Datadog)
    2. Archival to Cold Storage (S3)
    3. Retention Policy Enforcement
    """

    def __init__(self):
        self.is_running = False
        self.batch_size = 100
        self.siem_enabled = False # Toggle via config
        self.splunk_hec_url = getattr(settings, "SPLUNK_HEC_URL", None)
        self.splunk_token = getattr(settings, "SPLUNK_TOKEN", None)
        self.datadog_api_key = getattr(settings, "DATADOG_API_KEY", None)

        if self.splunk_hec_url and self.splunk_token:
            self.siem_enabled = True

    async def start(self):
        self.is_running = True
        logger.info("AuditProcessor started.")
        # Start background tasks
        asyncio.create_task(self.retention_job())
        # If we had a queue for logs (e.g. Redis/Kafka), we would start a consumer here.
        # For now, we assume the middleware writes directly to DB, and we might poll for new logs
        # to forward to SIEM if we want "near real-time" without slowing down API.

    async def stop(self):
        self.is_running = False
        logger.info("AuditProcessor stopped.")

    async def forward_to_siem(self, logs: List[Dict[str, Any]]):
        """
        Forward logs to configured SIEM.
        """
        if not self.siem_enabled or not logs:
            return

        if self.splunk_hec_url:
            await self._send_to_splunk(logs)

        # Add other SIEMs here

    async def _send_to_splunk(self, logs: List[Dict[str, Any]]):
        headers = {"Authorization": f"Splunk {self.splunk_token}"}
        payload = ""
        for log in logs:
            event = {
                "time": datetime.fromisoformat(log["timestamp"]).timestamp(),
                "host": "agency-os-api",
                "source": "audit-log",
                "sourcetype": "_json",
                "event": log
            }
            payload += json.dumps(event) + "\n"

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(self.splunk_hec_url, data=payload, headers=headers) as resp:
                    if resp.status != 200:
                        logger.error(f"Failed to send to Splunk: {await resp.text()}")
            except Exception as e:
                logger.error(f"Splunk forward error: {e}")

    async def retention_job(self):
        """
        Daily job to archive old logs and clean up hot storage.
        """
        while self.is_running:
            try:
                # Run daily at 2 AM UTC roughly
                now = datetime.utcnow()
                if now.hour == 2:
                    logger.info("Running audit retention job...")
                    db = SessionLocal()

                    # 1. Archive logs older than 365 days
                    # This requires S3 setup
                    # await audit_service.archive_old_logs(db, retention_days=365)

                    db.close()

                    # Sleep for 23 hours to avoid repeating same day
                    await asyncio.sleep(23 * 3600)

                await asyncio.sleep(3600) # Check every hour
            except Exception as e:
                logger.error(f"Retention job error: {e}")
                await asyncio.sleep(3600)

audit_processor = AuditProcessor()
