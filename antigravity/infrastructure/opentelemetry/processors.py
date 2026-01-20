"""
OpenTelemetry Background Processors Module
==========================================

Background processor implementations for distributed tracing.

Processors:
- SpanProcessor: Buffers and processes spans for export
- MetricsProcessor: Aggregates and calculates performance metrics
- ExportProcessor: Handles batch export to telemetry backends
- PerformanceAnalyzer: Real-time performance analytics

Bug fixes applied:
- Fixed export loop indentation (all statements properly nested in if block)
- Fixed time/sleep logic for consistent intervals
- Added proper exception handling boundaries
"""

import time
import logging
import threading
from typing import Dict, Any, List, Optional, Callable, TYPE_CHECKING
from collections import deque, defaultdict
from abc import ABC, abstractmethod

from .models import SpanKind, SpanStatus, TraceId, Event
from .span import Span

if TYPE_CHECKING:
    from .exporters import BaseExporter

logger = logging.getLogger(__name__)


class BaseProcessor(ABC):
    """Abstract base class for background processors.

    Provides common lifecycle management for background processing loops.
    """

    def __init__(self, name: str, interval_seconds: float = 1.0):
        """Initialize processor.

        Args:
            name: Processor name for logging
            interval_seconds: Sleep interval between processing cycles
        """
        self.name = name
        self.interval_seconds = interval_seconds
        self.shutdown_requested = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

    @abstractmethod
    def process(self) -> None:
        """Execute one processing cycle. Subclasses must implement."""
        pass

    def run_loop(self) -> None:
        """Run the processing loop until shutdown requested."""
        logger.info(f"{self.name} started")

        while not self.shutdown_requested:
            try:
                self.process()
            except Exception as e:
                logger.error(f"Error in {self.name}: {e}")

            # BUG FIX: Consistent sleep at end of loop
            time.sleep(self.interval_seconds)

        logger.info(f"{self.name} stopped")

    def start(self) -> threading.Thread:
        """Start processor in background thread.

        Returns:
            The started thread
        """
        self._thread = threading.Thread(
            target=self.run_loop,
            daemon=True,
            name=self.name
        )
        self._thread.start()
        return self._thread

    def shutdown(self) -> None:
        """Signal shutdown to processor loop."""
        self.shutdown_requested = True
        logger.info(f"{self.name} shutdown requested")


class SpanProcessor(BaseProcessor):
    """Background processor for span buffering and initial processing.

    Collects spans from a buffer, performs initial processing, and
    queues them for export.
    """

    def __init__(
        self,
        trace_buffer: deque,
        export_queue: deque,
        completed_spans: List,
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
        processed_spans = []
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
            # Handle both dict and Span objects
            valid_spans = []
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


class MetricsProcessor(BaseProcessor):
    """Background processor for metrics aggregation.

    Periodically calculates performance metrics from span data and
    updates the analytics store.
    """

    def __init__(
        self,
        performance_analytics: Dict[str, Any],
        completed_spans: List,
        interval_seconds: float = 30.0
    ):
        """Initialize metrics processor.

        Args:
            performance_analytics: Dictionary to store computed metrics
            completed_spans: List of completed spans for analysis
            interval_seconds: Aggregation interval (default 30s)
        """
        super().__init__("MetricsProcessor", interval_seconds)
        self.performance_analytics = performance_analytics
        self.completed_spans = completed_spans
        self._metrics_history: deque = deque(maxlen=1000)

    def process(self) -> None:
        """Aggregate and compute performance metrics."""
        try:
            # Calculate metrics from completed spans
            total_requests = self.performance_analytics.get("request_count", 0)
            total_errors = 0
            total_duration = 0.0
            span_count = 0

            for span in self.completed_spans[-100:]:  # Last 100 spans
                if isinstance(span, dict):
                    status = span.get("status", "")
                    if status == "error":
                        total_errors += 1
                    duration = span.get("duration")
                    if duration is not None:
                        total_duration += duration
                        span_count += 1

            # Compute rates
            error_rate = (total_errors / span_count * 100) if span_count > 0 else 0.0
            avg_response_time = (total_duration / span_count) if span_count > 0 else 0.0

            # Update analytics
            with self._lock:
                self.performance_analytics.update({
                    "request_count": total_requests,
                    "error_rate": round(error_rate, 2),
                    "avg_response_time": round(avg_response_time, 4),
                    "timestamp": time.time(),
                    "spans_analyzed": span_count
                })

            # Store in history
            self._metrics_history.append({
                "timestamp": time.time(),
                "error_rate": error_rate,
                "avg_response_time": avg_response_time,
                "span_count": span_count
            })

            logger.debug(
                f"Metrics updated: error_rate={error_rate:.2f}%, "
                f"avg_response_time={avg_response_time:.4f}s"
            )

        except Exception as e:
            logger.error(f"Error computing metrics: {e}")


class ExportLoopProcessor(BaseProcessor):
    """Background processor for exporting telemetry data.

    BUG FIXES APPLIED:
    - Fixed indentation: all statements properly nested in if block
    - Fixed exception handling boundaries
    - Fixed span cleanup logic
    """

    def __init__(
        self,
        export_queue: deque,
        active_spans: Dict[str, Any],
        completed_spans: List,
        export_callback: Optional[Callable[[Dict[str, Any]], bool]] = None,
        interval_seconds: float = 60.0
    ):
        """Initialize export processor.

        Args:
            export_queue: Queue of spans to export
            active_spans: Dictionary of active spans
            completed_spans: List of completed spans
            export_callback: Function to call for each span export
            interval_seconds: Export interval (default 60s)
        """
        super().__init__("ExportProcessor", interval_seconds)
        self.export_queue = export_queue
        self.active_spans = active_spans
        self.completed_spans = completed_spans
        self.export_callback = export_callback
        self._retention_seconds = 3600  # 1 hour

    def process(self) -> None:
        """Process export batch.

        BUG FIX: All operations properly indented within the export_batch block.
        """
        # Get batch from queue
        export_batch: Optional[List[Dict[str, Any]]] = None

        with self._lock:
            if self.export_queue:
                # Collect items from queue
                export_batch = []
                while self.export_queue and len(export_batch) < 100:
                    try:
                        export_batch.append(self.export_queue.popleft())
                    except IndexError:
                        break

        # BUG FIX: Properly structured if block - all operations inside
        if export_batch:
            logger.info(f"Processing export batch of {len(export_batch)} spans")

            # Process all spans in batch
            for span_dict in export_batch:
                try:
                    # Export via callback if provided
                    if self.export_callback:
                        success = self.export_callback(span_dict)
                        # BUG FIX: Mark as exported inside try block
                        if success:
                            span_dict["exported"] = True
                    else:
                        # No callback, just mark as exported
                        span_dict["exported"] = True

                    # BUG FIX: Remove from active spans (inside loop)
                    trace_id = span_dict.get("trace_id")
                    if trace_id and trace_id in self.active_spans:
                        del self.active_spans[trace_id]

                except Exception as e:
                    logger.error(f"Error exporting span: {e}")
                    span_dict["export_error"] = str(e)

            # BUG FIX: Move to completed (inside if block, after loop)
            self.completed_spans.extend(export_batch)

            # BUG FIX: Clean old spans (inside if block)
            self._cleanup_old_spans()

            logger.debug(f"Exported {len(export_batch)} spans")

    def _cleanup_old_spans(self) -> None:
        """Remove spans older than retention period.

        BUG FIX: Corrected comparison logic (keep recent, not old).
        """
        current_time = time.time()
        cutoff_time = current_time - self._retention_seconds

        with self._lock:
            # BUG FIX: Keep spans with end_time > cutoff (recent), not < cutoff (old)
            valid_spans = []
            for s in self.completed_spans:
                if isinstance(s, dict):
                    end_time = s.get("end_time", current_time)
                else:
                    end_time = getattr(s, "end_time", current_time)

                # Keep if end_time is None or within retention
                if end_time is None or end_time > cutoff_time:
                    valid_spans.append(s)

            self.completed_spans.clear()
            self.completed_spans.extend(valid_spans)


class PerformanceAnalyzer(BaseProcessor):
    """Background processor for real-time performance analytics.

    Analyzes span patterns and provides health insights.
    """

    def __init__(
        self,
        performance_analytics: Dict[str, Any],
        agent_registry: Dict[str, Any],
        interval_seconds: float = 60.0
    ):
        """Initialize performance analyzer.

        Args:
            performance_analytics: Dictionary to store analytics
            agent_registry: Registry of tracing agents
            interval_seconds: Analysis interval (default 60s)
        """
        super().__init__("PerformanceAnalyzer", interval_seconds)
        self.performance_analytics = performance_analytics
        self.agent_registry = agent_registry
        self._health_history: deque = deque(maxlen=100)

    def process(self) -> None:
        """Analyze performance and update analytics."""
        try:
            # Count active agents
            active_agents = 0
            total_operations = 0

            for agent_name, agent in self.agent_registry.items():
                # Skip background processor entries (Thread objects)
                if not hasattr(agent, "active"):
                    continue

                if agent.active and not agent.shutdown_requested:
                    active_agents += 1
                    if hasattr(agent, "operations"):
                        total_operations += len(agent.operations)

            # Update analytics
            with self._lock:
                self.performance_analytics.update({
                    "active_agents": active_agents,
                    "total_registered_operations": total_operations,
                    "health_check_timestamp": time.time()
                })

            # Store health snapshot
            self._health_history.append({
                "timestamp": time.time(),
                "active_agents": active_agents,
                "error_rate": self.performance_analytics.get("error_rate", 0)
            })

            logger.debug(
                f"Performance analysis: {active_agents} active agents, "
                f"{total_operations} operations registered"
            )

        except Exception as e:
            logger.error(f"Error in performance analysis: {e}")


def create_span_processor_loop(
    trace_buffer: deque,
    export_queue: deque,
    completed_spans: List,
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

    def loop():
        while not shutdown_flag():
            try:
                processor.process()
            except Exception as e:
                logger.error(f"Error in span processor loop: {e}")
            time.sleep(0.1)

    return loop


def create_metrics_processor_loop(
    performance_analytics: Dict[str, Any],
    completed_spans: List,
    shutdown_flag: Callable[[], bool],
    interval_seconds: float = 30.0
) -> Callable[[], None]:
    """Create a metrics processor loop function.

    Factory function for backwards compatibility with DistributedTracer.

    Args:
        performance_analytics: Dictionary to store computed metrics
        completed_spans: List of completed spans
        shutdown_flag: Callable returning True when shutdown requested
        interval_seconds: Processing interval

    Returns:
        Loop function for threading.Thread target
    """
    processor = MetricsProcessor(
        performance_analytics=performance_analytics,
        completed_spans=completed_spans,
        interval_seconds=interval_seconds
    )

    def loop():
        while not shutdown_flag():
            try:
                time.sleep(interval_seconds)
                processor.process()
            except Exception as e:
                logger.error(f"Error in metrics processor loop: {e}")

    return loop


def create_export_processor_loop(
    export_queue: deque,
    active_spans: Dict[str, Any],
    completed_spans: List,
    export_callback: Optional[Callable[[Dict[str, Any]], bool]],
    shutdown_flag: Callable[[], bool],
    interval_seconds: float = 60.0
) -> Callable[[], None]:
    """Create an export processor loop function.

    Factory function for backwards compatibility with DistributedTracer.

    BUG FIX: Proper exception handling and indentation.

    Args:
        export_queue: Queue of spans to export
        active_spans: Dictionary of active spans
        completed_spans: List of completed spans
        export_callback: Function to call for each span export
        shutdown_flag: Callable returning True when shutdown requested
        interval_seconds: Export interval

    Returns:
        Loop function for threading.Thread target
    """
    processor = ExportLoopProcessor(
        export_queue=export_queue,
        active_spans=active_spans,
        completed_spans=completed_spans,
        export_callback=export_callback,
        interval_seconds=interval_seconds
    )

    def loop():
        while not shutdown_flag():
            try:
                time.sleep(interval_seconds)
                processor.process()
            except Exception as e:
                # BUG FIX: Only log error, don't set shutdown flag
                logger.error(f"Error in export processor loop: {e}")

    return loop


__all__ = [
    "BaseProcessor",
    "SpanProcessor",
    "MetricsProcessor",
    "ExportLoopProcessor",
    "PerformanceAnalyzer",
    "create_span_processor_loop",
    "create_metrics_processor_loop",
    "create_export_processor_loop",
]
