import logging
import os
from typing import Optional

import aiohttp

logger = logging.getLogger(__name__)


class AlertingService:
    def __init__(self):
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
        self.pagerduty_key = os.getenv("PAGERDUTY_KEY")

    async def notify_failure(self, backup_id: str, error: str):
        """
        Send alerts to configured channels on backup failure.
        """
        message = f"🚨 **Backup Failed** 🚨\nID: {backup_id}\nError: {error}\nTimestamp: {os.getenv('HOSTNAME', 'unknown')}"

        # Log regardless
        logger.critical(message)

        if self.slack_webhook:
            await self._send_slack(message)

        if self.pagerduty_key:
            await self._send_pagerduty(f"Backup Failed: {backup_id}", error)

    async def notify_success(self, backup_id: str, size_bytes: int):
        """
        Send notification on success (usually just logs or slack info).
        """
        message = f"✅ Backup Successful\nID: {backup_id}\nSize: {size_bytes} bytes"
        logger.info(message)

        # Optionally send to slack if configured for info
        # if self.slack_webhook:
        #    await self._send_slack(message)

    async def _send_slack(self, text: str):
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(self.slack_webhook, json={"text": text})
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    async def _send_pagerduty(self, summary: str, details: str):
        # https://developer.pagerduty.com/docs/events-api-v2/trigger-events/
        url = "https://events.pagerduty.com/v2/enqueue"
        payload = {
            "routing_key": self.pagerduty_key,
            "event_action": "trigger",
            "dedup_key": f"backup-fail-{summary}",
            "payload": {
                "summary": summary,
                "severity": "critical",
                "source": "backup-service",
                "custom_details": {"error": details},
            },
        }
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(url, json=payload)
        except Exception as e:
            logger.error(f"Failed to send PagerDuty alert: {e}")
