"""
OpenTelemetry Span Processor Module
===================================

Span buffering and processing for distributed tracing.
"""

import time
import logging
from typing import Dict, Any, List, Callable
from collections import deque

from ..models import SpanKind, SpanStatus, TraceId
from ..span import Span
from .base import BaseProcessor

logger = logging.getLogger(__name__)


class SpanProcessor(BaseProcessor):
    """Background processor for span buffering and initial processing.

    Collects spans from a buffer, performs initial processing, and
    queues them for export.
    """

    def __init__(
        self,
        trace_buffer: deque,
        export_queue: deque,
        completed_spans: List[Dict[str, Any]],
        batch_size: int = 100,
        interval_seconds: float = 0.1
    ):
        """Initialize span processor.

        Args:
            trace_buffer: Input buffer of raw span data
            export_queue: Output queue for processed spans
            completed_spans: List to store completed spans
            batch_size: Max spans to process per cycle
            interval_seconds: Processing interval
        """
        super().__init__("SpanProcessor", interval_seconds)
        self.trace_buffer = trace_buffer
        self.export_queue = export_queue
        self.completed_spans = completed_spans
        self.batch_size = batch_size
        self._retention_seconds = 300  # 5 minutes

    def process(self) -> None:
        """Process a batch of spans from the buffer."""
        spans_to_process: List[Dict[str, Any]] = []

        # Collect batch from buffer
        with self._lock:
            while self.trace_buffer and len(spans_to_process) < self.batch_size:
                try:
                    span_data = self.trace_buffer.popleft()
                    spans_to_process.append(span_data)
                except IndexError:
                    break

        if not spans_to_process:
            return

        # Process each span
        processed_spans: List[Dict[str, Any]] = []
        for span_dict in spans_to_process:
            try:
                # Create processing span for internal tracking
                processing_span = Span(
                    trace_id=TraceId(),
                    kind=SpanKind.INTERNAL,
                    operation_name="span_processor",
                    service_name="tracing_service",
                    resource_name="span_buffer"
                )

                # Merge with original data
                span_dict.update({
                    "processed_at": time.time(),
                    "processor": self.name
                })

                processed_spans.append(span_dict)
                processing_span.finish(SpanStatus.FINISHED)

            except Exception as e:
                logger.error(f"Error processing span: {e}")
                span_dict["processing_error"] = str(e)

        # Queue for export
        for span in processed_spans:
            try:
                self.export_queue.append(span)
            except Exception as e:
                logger.error(f"Error queueing span for export: {e}")

        # Move to completed
        self.completed_spans.extend(processed_spans)

        # Clean old completed spans
        self._cleanup_completed_spans()

        if processed_spans:
            logger.debug(f"Processed {len(processed_spans)} spans")

    def _cleanup_completed_spans(self) -> None:
        """Remove old completed spans beyond retention period."""
        current_time = time.time()
        cutoff_time = current_time - self._retention_seconds

        # Filter completed spans (keep those within retention)
        with self._lock:
            valid_spans: List[Dict[str, Any]] = []
            for s in self.completed_spans:
                end_time = s.get("end_time") if isinstance(s, dict) else getattr(s, "end_time", None)
                if end_time is not None and end_time > cutoff_time:
                    valid_spans.append(s)
                elif end_time is None:
                    valid_spans.append(s)  # Keep spans without end_time

            # Limit to last 1000
            if len(valid_spans) > 1000:
                valid_spans = valid_spans[-1000:]

            self.completed_spans.clear()
            self.completed_spans.extend(valid_spans)


def create_span_processor_loop(
    trace_buffer: deque,
    export_queue: deque,
    completed_spans: List[Dict[str, Any]],
    shutdown_flag: Callable[[], bool],
    batch_size: int = 100
) -> Callable[[], None]:
    """Create a span processor loop function.

    Factory function for backwards compatibility with DistributedTracer.

    Args:
        trace_buffer: Input buffer of raw span data
        export_queue: Output queue for processed spans
        completed_spans: List to store completed spans
        shutdown_flag: Callable returning True when shutdown requested
        batch_size: Max spans to process per cycle

    Returns:
        Loop function for threading.Thread target
    """
    processor = SpanProcessor(
        trace_buffer=trace_buffer,
        export_queue=export_queue,
        completed_spans=completed_spans,
        batch_size=batch_size
    )

    def loop() -> None:
        while not shutdown_flag():
            try:
                processor.process()
            except Exception as e:
                logger.error(f"Error in span processor loop: {e}")
            time.sleep(0.1)

    return loop


__all__ = ["SpanProcessor", "create_span_processor_loop"]
