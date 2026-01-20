"""
OpenTelemetry Base Exporter Module
==================================

Abstract base class for telemetry exporters.
"""

import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

try:
    import requests
    from requests import Response
except ImportError:
    requests = None  # type: ignore
    Response = None  # type: ignore

from ..config import ExporterConfig
from ..models import Metric

logger = logging.getLogger(__name__)


class BaseExporter(ABC):
    """Abstract base class for telemetry exporters."""

    def __init__(self, config: ExporterConfig):
        """Initialize exporter with configuration.

        Args:
            config: Exporter configuration
        """
        self.config = config
        self.export_queue: List[Dict[str, Any]] = []
        self.failed_exports: List[Dict[str, Any]] = []

    @abstractmethod
    def export_spans(self, spans: List[Dict[str, Any]]) -> bool:
        """Export spans to backend.

        Args:
            spans: List of span dictionaries to export

        Returns:
            True if export successful, False otherwise
        """
        pass

    @abstractmethod
    def export_metrics(self, metrics: List[Metric]) -> bool:
        """Export metrics to backend.

        Args:
            metrics: List of metrics to export

        Returns:
            True if export successful, False otherwise
        """
        pass

    def _send_http_request(
        self,
        url: str,
        data: Dict[str, Any],
        method: str = "POST"
    ) -> Optional[Any]:
        """Send HTTP request to telemetry backend.

        Args:
            url: Endpoint URL
            data: JSON data to send
            method: HTTP method (default: POST)

        Returns:
            Response object if successful, None otherwise
        """
        if requests is None:
            logger.error("requests module not installed, cannot export telemetry")
            return None

        for attempt in range(self.config.retry_count):
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    json=data,
                    headers=self.config.headers,
                    timeout=self.config.timeout_seconds
                )

                if response.status_code in (200, 201, 202, 204):
                    return response

                logger.warning(
                    f"Export attempt {attempt + 1} failed with status "
                    f"{response.status_code}: {response.text}"
                )

            except Exception as e:
                if hasattr(e, '__class__') and 'Timeout' in e.__class__.__name__:
                    logger.warning(f"Export attempt {attempt + 1} timed out")
                else:
                    logger.error(f"Export attempt {attempt + 1} failed: {e}")

            # Wait before retry
            if attempt < self.config.retry_count - 1:
                time.sleep(self.config.retry_delay_seconds)

        return None


__all__ = ["BaseExporter"]
