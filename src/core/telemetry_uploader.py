"""
Telemetry Uploader — Batch Upload to Analytics Backend

Uploads telemetry events to existing analytics backend.

Reference: plans/260307-1602-telemetry-consent-opt-in/plan.md
"""

import logging
import os
from typing import List, Optional

import requests

from .telemetry_consent import ConsentManager
from .telemetry_collector import TelemetryCollector

logger = logging.getLogger(__name__)


class TelemetryUploader:
    """
    Upload telemetry events to analytics backend.

    Backend endpoint: POST /api/v1/telemetry/events
    """

    def __init__(
        self,
        collector: TelemetryCollector,
        consent_manager: ConsentManager,
        backend_url: Optional[str] = None,
    ):
        self._collector = collector
        self._consent_manager = consent_manager
        self._backend_url = backend_url or os.getenv(
            "TELEMETRY_BACKEND_URL",
            "https://api.mekong.dev/api/v1/telemetry/events",
        )
        self._batch_size = 100

    def upload_batch(self) -> int:
        """Upload pending events to backend."""
        if not self._consent_manager.has_consent():
            return 0

        events = self._collector.get_pending_events()
        if not events:
            return 0

        uploaded = 0
        for i in range(0, len(events), self._batch_size):
            batch = events[i : i + self._batch_size]
            if self._upload_events(batch):
                uploaded += len(batch)

        if uploaded > 0:
            self._collector.clear_buffer()

        return uploaded

    def _upload_events(self, events: List[dict]) -> bool:
        """Upload events to backend."""
        try:
            response = requests.post(
                self._backend_url,
                json={"events": events},
                headers={
                    "Content-Type": "application/json",
                    "X-Anonymous-ID": self._consent_manager.get_anonymous_id(),
                },
                timeout=10,
            )
            response.raise_for_status()
            logger.info(f"Uploaded {len(events)} telemetry events")
            return True
        except requests.RequestException as e:
            logger.warning(f"Telemetry upload failed: {e}")
            return False

    def upload_async(self) -> int:
        """Async upload (runs in background)."""
        import threading
        thread = threading.Thread(target=self.upload_batch, daemon=True)
        thread.start()
        return 0  # Return immediately, upload happens in background


def get_uploader() -> TelemetryUploader:
    """Get singleton TelemetryUploader instance."""
    from .telemetry_consent import get_consent_manager
    from .telemetry_collector import get_collector

    return TelemetryUploader(
        collector=get_collector(),
        consent_manager=get_consent_manager(),
    )
