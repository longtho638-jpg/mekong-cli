"""
OpenTelemetry Exporters Module
==============================

Telemetry export implementations for distributed tracing.

Exporters:
- OTLPExporter: OpenTelemetry Protocol exporter
- JaegerExporter: Jaeger-compatible exporter
- PrometheusExporter: Prometheus metrics exporter

Bug fixes applied:
- requests module imported
- Fixed malformed dict comprehension in export loop
- Fixed indentation issues in export logic
"""

import time
import logging
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from collections import deque

# BUG FIX: Ensure requests is imported
try:
    import requests
except ImportError:
    requests = None  # Handle gracefully if not installed

from .config import ExporterConfig, DEFAULT_JAEGER_ENDPOINT, DEFAULT_OTLP_ENDPOINT
from .models import Metric


logger = logging.getLogger(__name__)


class BaseExporter(ABC):
    """Abstract base class for telemetry exporters."""

    def __init__(self, config: ExporterConfig):
        """Initialize exporter with configuration.

        Args:
            config: Exporter configuration
        """
        self.config = config
        self.export_queue: deque = deque(maxlen=1000)
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
    ) -> Optional[requests.Response]:
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

            except requests.exceptions.Timeout:
                logger.warning(f"Export attempt {attempt + 1} timed out")
            except requests.exceptions.RequestException as e:
                logger.error(f"Export attempt {attempt + 1} failed: {e}")

            # Wait before retry
            if attempt < self.config.retry_count - 1:
                time.sleep(self.config.retry_delay_seconds)

        return None


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
        otlp_data = {
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
        otlp_metrics = {
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
        jaeger_batch = {
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
        jaeger_spans = []

        for span in spans:
            jaeger_span = {
                "traceIdLow": span.get("trace_id", "")[:16],
                "traceIdHigh": span.get("trace_id", "")[16:32] if len(span.get("trace_id", "")) > 16 else "",
                "spanId": span.get("trace_id", "")[:16],
                "parentSpanId": span.get("parent_id", "") or "",
                "operationName": span.get("operation_name", "unknown"),
                "startTime": int(span.get("start_time", 0) * 1000000),  # microseconds
                "duration": int((span.get("duration", 0) or 0) * 1000000),  # microseconds
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
        # BUG FIX: Fixed malformed dict comprehension - now proper list comprehension
        return [
            {"key": key, "vType": "STRING", "vStr": str(value)}
            for key, value in tags.items()
        ]

    def _convert_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert events to Jaeger log format.

        Args:
            events: List of event dictionaries

        Returns:
            List of Jaeger-formatted logs
        """
        logs = []
        for event in events:
            log = {
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


class ExportProcessor:
    """Background processor for batching and exporting telemetry data.

    Manages export queue and handles batch processing with proper error handling.
    """

    def __init__(
        self,
        exporters: Optional[List[BaseExporter]] = None,
        batch_size: int = 100,
        export_interval_seconds: int = 60
    ):
        """Initialize export processor.

        Args:
            exporters: List of exporters to use
            batch_size: Maximum spans per batch
            export_interval_seconds: Seconds between export cycles
        """
        self.exporters = exporters or []
        self.batch_size = batch_size
        self.export_interval_seconds = export_interval_seconds
        self.export_queue: deque = deque(maxlen=1000)
        self.shutdown_requested = False

    def add_span(self, span_dict: Dict[str, Any]) -> None:
        """Add span to export queue.

        Args:
            span_dict: Span dictionary to queue for export
        """
        self.export_queue.append(span_dict)

    def process_export_batch(self) -> int:
        """Process a batch of spans from the queue.

        Returns:
            Number of spans processed
        """
        if not self.export_queue:
            return 0

        # Collect batch
        batch = []
        while self.export_queue and len(batch) < self.batch_size:
            batch.append(self.export_queue.popleft())

        if not batch:
            return 0

        # Export to all configured exporters
        # BUG FIX: Fixed indentation - export logic now properly nested
        for exporter in self.exporters:
            try:
                success = exporter.export_spans(batch)
                if success:
                    # Mark spans as exported
                    for span_dict in batch:
                        span_dict["exported"] = True
                    logger.debug(
                        f"Exported {len(batch)} spans via "
                        f"{exporter.__class__.__name__}"
                    )
                else:
                    logger.warning(
                        f"Failed to export batch via "
                        f"{exporter.__class__.__name__}"
                    )
            except Exception as e:
                logger.error(
                    f"Error exporting via {exporter.__class__.__name__}: {e}"
                )

        return len(batch)

    def run_export_loop(self) -> None:
        """Run export processing loop.

        This method is designed to run in a background thread.
        """
        while not self.shutdown_requested:
            try:
                time.sleep(self.export_interval_seconds)

                # Process export batch
                exported_count = self.process_export_batch()

                if exported_count > 0:
                    logger.info(f"Processed export batch of {exported_count} spans")

            except Exception as e:
                logger.error(f"Error in export processor loop: {e}")

    def shutdown(self) -> None:
        """Signal shutdown to export loop."""
        self.shutdown_requested = True

        # Flush remaining spans
        while self.export_queue:
            self.process_export_batch()

        logger.info("Export processor shutdown complete")


# Convenience functions for direct export
def export_spans(
    spans: List[Dict[str, Any]],
    endpoint: str = DEFAULT_OTLP_ENDPOINT,
    exporter_type: str = "otlp"
) -> bool:
    """Export spans to telemetry backend.

    Args:
        spans: List of span dictionaries
        endpoint: Backend endpoint URL
        exporter_type: Type of exporter ("otlp" or "jaeger")

    Returns:
        True if export successful
    """
    if exporter_type == "jaeger":
        exporter = JaegerExporter(endpoint=endpoint)
    else:
        exporter = OTLPExporter(endpoint=endpoint)

    return exporter.export_spans(spans)


def export_metrics(
    metrics: List[Metric],
    endpoint: str = DEFAULT_OTLP_ENDPOINT
) -> bool:
    """Export metrics to telemetry backend.

    Args:
        metrics: List of metrics
        endpoint: Backend endpoint URL

    Returns:
        True if export successful
    """
    exporter = OTLPExporter(endpoint=endpoint)
    return exporter.export_metrics(metrics)


__all__ = [
    "BaseExporter",
    "OTLPExporter",
    "JaegerExporter",
    "ExportProcessor",
    "export_spans",
    "export_metrics",
]
