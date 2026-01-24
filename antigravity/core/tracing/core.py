"""
Tracing Core Engine.
"""

import logging
import threading
import uuid
from contextvars import ContextVar
from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict, Union


class TracingMetricsDict(TypedDict, total=False):
    """Tracing metrics dictionary type."""

    traces_created: int
    spans_created: int
    avg_duration_ms: float
    slow_spans: int
    error_spans: int
    active_traces: int


from .enums import SpanKind, SpanStatus
from .exporters import InMemoryExporter, SpanExporter
from .models import Span, Trace

logger = logging.getLogger(__name__)

# Context variables for trace propagation
current_trace: ContextVar[Optional["Trace"]] = ContextVar("current_trace", default=None)
current_span: ContextVar[Optional["Span"]] = ContextVar("current_span", default=None)


class DistributedTracer:
    """
    🔍 Distributed Tracing System

    OpenTelemetry-compatible tracing for:
    - Request correlation across services
    - Span tracking and timing
    - Performance profiling
    - Error tracking
    """

    def __init__(self, service_name: str = "antigravity"):
        self.service_name = service_name
        self.traces: Dict[str, Trace] = {}
        self.exporters: List[SpanExporter] = []
        self._lock = threading.Lock()

        # Add default exporter
        self.memory_exporter = InMemoryExporter()
        self.add_exporter(self.memory_exporter)

        # Performance metrics
        self.metrics = {
            "traces_created": 0,
            "spans_created": 0,
            "avg_duration_ms": 0.0,
            "slow_spans": 0,  # > 100ms
            "error_spans": 0,
        }

    def add_exporter(self, exporter: SpanExporter):
        """Add span exporter."""
        self.exporters.append(exporter)

    def _generate_id(self) -> str:
        """Generate unique ID."""
        return uuid.uuid4().hex[:16]

    def start_trace(self, name: str, attributes: Dict = None) -> Span:
        """
        Start a new trace with root span.

        Returns the root span.
        """
        trace_id = self._generate_id()
        span_id = self._generate_id()

        span = Span(
            trace_id=trace_id,
            span_id=span_id,
            name=name,
            kind=SpanKind.SERVER,
            attributes=attributes or {},
        )

        trace = Trace(trace_id=trace_id, root_span_id=span_id, service_name=self.service_name)
        trace.add_span(span)

        with self._lock:
            self.traces[trace_id] = trace
            self.metrics["traces_created"] += 1
            self.metrics["spans_created"] += 1

        # Set context
        current_trace.set(trace)
        current_span.set(span)

        return span

    def start_span(self, name: str, kind: SpanKind = SpanKind.INTERNAL) -> Span:
        """
        Start a child span in current trace.
        """
        trace = current_trace.get()
        parent = current_span.get()

        if not trace:
            # No active trace, start new one
            return self.start_trace(name)

        span = Span(
            trace_id=trace.trace_id,
            span_id=self._generate_id(),
            name=name,
            parent_span_id=parent.span_id if parent else None,
            kind=kind,
        )

        trace.add_span(span)
        current_span.set(span)

        with self._lock:
            self.metrics["spans_created"] += 1

        return span

    def end_span(self, span: Span, status: SpanStatus = SpanStatus.OK):
        """End a span and export."""
        span.end(status)

        # Update metrics
        with self._lock:
            if span.duration_ms > 100:
                self.metrics["slow_spans"] += 1
            if status == SpanStatus.ERROR:
                self.metrics["error_spans"] += 1

            # Update average
            total = self.metrics["spans_created"]
            current_avg = self.metrics["avg_duration_ms"]
            self.metrics["avg_duration_ms"] = (current_avg * (total - 1) + span.duration_ms) / total

        # Export
        for exporter in self.exporters:
            try:
                exporter.export([span])
            except Exception as e:
                logger.error(f"Export failed: {e}")

        # Restore parent span in context
        trace = current_trace.get()
        if trace and span.parent_span_id:
            for s in trace.spans:
                if s.span_id == span.parent_span_id:
                    current_span.set(s)
                    break

    def get_trace(self, trace_id: str) -> Optional[Trace]:
        """Get trace by ID."""
        return self.traces.get(trace_id)

    def get_current_trace_id(self) -> Optional[str]:
        """Get current trace ID for propagation."""
        trace = current_trace.get()
        return trace.trace_id if trace else None

    def get_recent_spans(self, limit: int = 100) -> List[Dict]:
        """Get recent spans."""
        return self.memory_exporter.get_spans()[-limit:]

    def get_metrics(self) -> TracingMetricsDict:
        """Get tracing metrics."""
        return {
            **self.metrics,  # type: ignore
            "active_traces": len(self.traces),
        }


# Global tracer instance
_tracer = DistributedTracer()


def get_tracer() -> DistributedTracer:
    """Get global tracer."""
    return _tracer
