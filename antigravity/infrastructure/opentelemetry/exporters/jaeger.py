"""
OpenTelemetry Jaeger Exporter Module
====================================

Jaeger-compatible trace exporter implementation.
"""

import logging
from typing import Dict, Any, List

from ..config import ExporterConfig, DEFAULT_JAEGER_ENDPOINT
from ..models import Metric
from .base import BaseExporter

logger = logging.getLogger(__name__)


class JaegerExporter(BaseExporter):
    """Jaeger-compatible trace exporter.

    Exports traces to Jaeger collector using the Thrift HTTP protocol.
    """

    def __init__(
        self,
        endpoint: str = DEFAULT_JAEGER_ENDPOINT,
        timeout_seconds: int = 10,
        service_name: str = "mekong-cli"
    ):
        """Initialize Jaeger exporter.

        Args:
            endpoint: Jaeger collector endpoint
            timeout_seconds: Request timeout
            service_name: Service name for trace attribution
        """
        config = ExporterConfig(
            endpoint=endpoint,
            timeout_seconds=timeout_seconds,
            headers={"Content-Type": "application/json"}
        )
        super().__init__(config)
        self.service_name = service_name

    def export_spans(self, spans: List[Dict[str, Any]]) -> bool:
        """Export spans to Jaeger.

        Args:
            spans: List of span dictionaries

        Returns:
            True if export successful
        """
        if not spans:
            return True

        # Convert to Jaeger format
        jaeger_batch: Dict[str, Any] = {
            "batch": {
                "process": {
                    "serviceName": self.service_name,
                    "tags": []
                },
                "spans": self._convert_to_jaeger_format(spans)
            }
        }

        url = f"{self.config.endpoint}/api/traces"
        response = self._send_http_request(url, jaeger_batch)

        if response is not None:
            logger.info(f"Exported {len(spans)} spans to Jaeger")
            return True

        self.failed_exports.extend(spans)
        return False

    def _convert_to_jaeger_format(
        self,
        spans: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Convert OTLP spans to Jaeger format.

        Args:
            spans: List of span dictionaries in OTLP format

        Returns:
            List of spans in Jaeger format
        """
        jaeger_spans: List[Dict[str, Any]] = []

        for span in spans:
            trace_id = span.get("trace_id", "")
            jaeger_span: Dict[str, Any] = {
                "traceIdLow": trace_id[:16],
                "traceIdHigh": trace_id[16:32] if len(trace_id) > 16 else "",
                "spanId": trace_id[:16],
                "parentSpanId": span.get("parent_id", "") or "",
                "operationName": span.get("operation_name", "unknown"),
                "startTime": int(span.get("start_time", 0) * 1000000),
                "duration": int((span.get("duration", 0) or 0) * 1000000),
                "tags": self._convert_tags(span.get("tags", {})),
                "logs": self._convert_events(span.get("events", []))
            }
            jaeger_spans.append(jaeger_span)

        return jaeger_spans

    def _convert_tags(self, tags: Dict[str, str]) -> List[Dict[str, Any]]:
        """Convert tags dict to Jaeger tag format.

        Args:
            tags: Dictionary of tags

        Returns:
            List of Jaeger-formatted tags
        """
        return [
            {"key": key, "vType": "STRING", "vStr": str(value)}
            for key, value in tags.items()
        ]

    def _convert_events(
        self,
        events: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Convert events to Jaeger log format.

        Args:
            events: List of event dictionaries

        Returns:
            List of Jaeger-formatted logs
        """
        logs: List[Dict[str, Any]] = []
        for event in events:
            log: Dict[str, Any] = {
                "timestamp": int(event.get("timestamp", 0) * 1000000),
                "fields": [
                    {"key": "event", "vType": "STRING", "vStr": event.get("name", "")}
                ]
            }
            # Add event attributes as fields
            for key, value in event.get("attributes", {}).items():
                log["fields"].append({
                    "key": key,
                    "vType": "STRING",
                    "vStr": str(value)
                })
            logs.append(log)
        return logs

    def export_metrics(self, metrics: List[Metric]) -> bool:
        """Export metrics (Jaeger doesn't support metrics directly).

        Args:
            metrics: List of metrics (ignored)

        Returns:
            True (no-op for Jaeger)
        """
        logger.debug("Jaeger exporter does not support metrics export")
        return True


__all__ = ["JaegerExporter"]
