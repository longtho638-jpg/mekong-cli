"""
OpenTelemetry OTLP Exporter Module
==================================

OpenTelemetry Protocol (OTLP) exporter implementation.
"""

import logging
from typing import Dict, Any, List, Optional

from ..config import ExporterConfig, DEFAULT_OTLP_ENDPOINT
from ..models import Metric
from .base import BaseExporter

logger = logging.getLogger(__name__)


class OTLPExporter(BaseExporter):
    """OpenTelemetry Protocol (OTLP) exporter.

    Exports traces and metrics using the OTLP HTTP protocol.
    """

    def __init__(
        self,
        endpoint: str = DEFAULT_OTLP_ENDPOINT,
        timeout_seconds: int = 10,
        headers: Optional[Dict[str, str]] = None
    ):
        """Initialize OTLP exporter.

        Args:
            endpoint: OTLP collector endpoint
            timeout_seconds: Request timeout
            headers: Optional additional headers
        """
        config = ExporterConfig(
            endpoint=endpoint,
            timeout_seconds=timeout_seconds,
            headers=headers or {"Content-Type": "application/json"}
        )
        super().__init__(config)

    def export_spans(self, spans: List[Dict[str, Any]]) -> bool:
        """Export spans using OTLP protocol.

        Args:
            spans: List of span dictionaries

        Returns:
            True if export successful
        """
        if not spans:
            return True

        # Convert to OTLP format
        otlp_data: Dict[str, Any] = {
            "resourceSpans": [
                {
                    "resource": {
                        "attributes": []
                    },
                    "scopeSpans": [
                        {
                            "spans": spans
                        }
                    ]
                }
            ]
        }

        url = f"{self.config.endpoint}/v1/traces"
        response = self._send_http_request(url, otlp_data)

        if response is not None:
            logger.info(f"Exported {len(spans)} spans to OTLP endpoint")
            return True

        # Store failed exports for retry
        self.failed_exports.extend(spans)
        return False

    def export_metrics(self, metrics: List[Metric]) -> bool:
        """Export metrics using OTLP protocol.

        Args:
            metrics: List of metrics

        Returns:
            True if export successful
        """
        if not metrics:
            return True

        # Convert metrics to OTLP format
        otlp_metrics: Dict[str, Any] = {
            "resourceMetrics": [
                {
                    "resource": {
                        "attributes": []
                    },
                    "scopeMetrics": [
                        {
                            "metrics": [m.to_dict() for m in metrics]
                        }
                    ]
                }
            ]
        }

        url = f"{self.config.endpoint}/v1/metrics"
        response = self._send_http_request(url, otlp_metrics)

        if response is not None:
            logger.info(f"Exported {len(metrics)} metrics to OTLP endpoint")
            return True

        return False


__all__ = ["OTLPExporter"]
