"""
OpenTelemetry Export Handler Module
===================================

Background processor startup and export callback functionality.
Extracted from tracer.py for modularization.
"""

import logging
import threading
from typing import Dict, Any, List, Optional
from collections import deque

from ..config import TracerConfig

logger = logging.getLogger(__name__)


class ExportHandlerMixin:
    """Mixin providing export handling functionality for DistributedTracer.

    Handles:
    - Background processor thread startup
    - Span export callback for telemetry backends
    """

    # Type hints for attributes from main class
    config: TracerConfig
    trace_buffer: deque
    export_queue: deque
    completed_spans: List[Dict[str, Any]]
    active_spans: Dict[str, Any]
    performance_analytics: Dict[str, Any]
    agent_registry: Dict[str, Any]
    jaeger_endpoint: str
    shutdown_requested: bool
    _processor_threads: List[threading.Thread]

    def _start_background_processors(self) -> None:
        """Start background processors for tracing and analytics.

        Uses factory functions from processors module for proper implementation.
        """
        from ..processors import (
            create_span_processor_loop,
            create_metrics_processor_loop,
            create_export_processor_loop,
        )

        # Create shutdown flag accessor
        def get_shutdown_flag() -> bool:
            return self.shutdown_requested

        # Span processor loop
        span_processor_loop = create_span_processor_loop(
            trace_buffer=self.trace_buffer,
            export_queue=self.export_queue,
            completed_spans=self.completed_spans,
            shutdown_flag=get_shutdown_flag,
            batch_size=self.config.batch_size
        )

        # Metrics processor loop
        metrics_processor_loop = create_metrics_processor_loop(
            performance_analytics=self.performance_analytics,
            completed_spans=self.completed_spans,
            shutdown_flag=get_shutdown_flag,
            interval_seconds=self.config.metrics_interval_seconds
        )

        # Export processor loop (no callback - will use internal export)
        export_processor_loop = create_export_processor_loop(
            export_queue=self.export_queue,
            active_spans=self.active_spans,
            completed_spans=self.completed_spans,
            export_callback=self._export_span_callback,
            shutdown_flag=get_shutdown_flag,
            interval_seconds=self.config.export_interval_seconds
        )

        # Create and start threads
        processors = [
            ("SpanProcessor", span_processor_loop),
            ("MetricsProcessor", metrics_processor_loop),
            ("ExportProcessor", export_processor_loop),
        ]

        for name, target in processors:
            thread = threading.Thread(
                target=target,
                daemon=True,
                name=name
            )
            thread.start()
            self._processor_threads.append(thread)
            self.agent_registry[f"background_{name.lower()}"] = thread
            logger.info(f"Started {name} background processor")

        logger.info(
            f"Started distributed tracing system with "
            f"{len(self.agent_registry)} agents"
        )

    def _export_span_callback(self, span_dict: Dict[str, Any]) -> bool:
        """Callback for exporting a single span to telemetry backend.

        Args:
            span_dict: Span data dictionary to export

        Returns:
            True if export successful, False otherwise
        """
        if not self.jaeger_endpoint:
            return True  # No endpoint configured, skip export

        try:
            # Import requests lazily to avoid import errors
            try:
                import requests
            except ImportError:
                logger.warning("requests module not installed, skipping export")
                return True

            # Convert to OTLP format
            otlp_data = {
                "resourceSpans": [span_dict]
            }

            # Send to Jaeger collector
            response = requests.post(
                f"{self.jaeger_endpoint}",
                json=otlp_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code in (200, 201, 202, 204):
                logger.debug(
                    f"Exported span {span_dict.get('trace_id', 'unknown')} "
                    f"to OpenTelemetry"
                )
                return True
            else:
                logger.error(
                    f"Failed to export span to OpenTelemetry: "
                    f"{response.status_code}"
                )
                return False

        except Exception as e:
            logger.error(
                f"Error exporting span "
                f"{span_dict.get('trace_id', 'unknown')}: {e}"
            )
            return False


__all__ = ["ExportHandlerMixin"]
