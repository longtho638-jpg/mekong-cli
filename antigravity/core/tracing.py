"""
🔍 DistributedTracer - OpenTelemetry-Ready Tracing
===================================================

Request correlation, span tracking, performance profiling.
Ready for OpenTelemetry export to Jaeger/Zipkin.

MAX LEVEL: Production-ready distributed tracing.
"""

import functools
import logging
import threading
import uuid
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)

# Context variables for trace propagation
current_trace: ContextVar[Optional["Trace"]] = ContextVar("current_trace", default=None)
current_span: ContextVar[Optional["Span"]] = ContextVar("current_span", default=None)


class SpanKind(Enum):
    """Type of span."""

    INTERNAL = "internal"
    SERVER = "server"
    CLIENT = "client"
    PRODUCER = "producer"
    CONSUMER = "consumer"


class SpanStatus(Enum):
    """Span completion status."""

    UNSET = "unset"
    OK = "ok"
    ERROR = "error"


@dataclass
class SpanEvent:
    """Event within a span."""

    name: str
    timestamp: datetime = field(default_factory=datetime.now)
    attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Span:
    """
    A single span in a trace.

    Represents one unit of work in a distributed system.
    """

    trace_id: str
    span_id: str
    name: str
    parent_span_id: Optional[str] = None
    kind: SpanKind = SpanKind.INTERNAL
    status: SpanStatus = SpanStatus.UNSET
    start_time: datetime = field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    attributes: Dict[str, Any] = field(default_factory=dict)
    events: List[SpanEvent] = field(default_factory=list)

    @property
    def duration_ms(self) -> float:
        """Get span duration in milliseconds."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds() * 1000
        return 0

    def add_event(self, name: str, attributes: Dict = None):
        """Add event to span."""
        self.events.append(SpanEvent(name, attributes=attributes or {}))

    def set_attribute(self, key: str, value: Any):
        """Set span attribute."""
        self.attributes[key] = value

    def set_status(self, status: SpanStatus, message: str = None):
        """Set span status."""
        self.status = status
        if message:
            self.attributes["status.message"] = message

    def end(self, status: SpanStatus = SpanStatus.OK):
        """End the span."""
        self.end_time = datetime.now()
        self.status = status

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for export."""
        return {
            "traceId": self.trace_id,
            "spanId": self.span_id,
            "parentSpanId": self.parent_span_id,
            "name": self.name,
            "kind": self.kind.value,
            "status": self.status.value,
            "startTime": self.start_time.isoformat(),
            "endTime": self.end_time.isoformat() if self.end_time else None,
            "duration_ms": self.duration_ms,
            "attributes": self.attributes,
            "events": [
                {
                    "name": e.name,
                    "timestamp": e.timestamp.isoformat(),
                    "attributes": e.attributes,
                }
                for e in self.events
            ],
        }


@dataclass
class Trace:
    """
    A complete trace across services.

    Contains multiple related spans.
    """

    trace_id: str
    root_span_id: str
    service_name: str
    spans: List[Span] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def add_span(self, span: Span):
        """Add span to trace."""
        self.spans.append(span)

    def get_root_span(self) -> Optional[Span]:
        """Get root span."""
        for span in self.spans:
            if span.span_id == self.root_span_id:
                return span
        return None

    @property
    def total_duration_ms(self) -> float:
        """Get total trace duration."""
        root = self.get_root_span()
        return root.duration_ms if root else 0


class SpanExporter:
    """
    Base class for span exporters.

    Extend this for Jaeger, Zipkin, Prometheus, etc.
    """

    def export(self, spans: List[Span]) -> bool:
        """Export spans to backend."""
        raise NotImplementedError


class ConsoleExporter(SpanExporter):
    """Export spans to console for debugging."""

    def export(self, spans: List[Span]) -> bool:
        for span in spans:
            logger.info(f"📍 Span: {span.name} ({span.duration_ms:.2f}ms) - {span.status.value}")
        return True


class InMemoryExporter(SpanExporter):
    """Store spans in memory for querying."""

    def __init__(self, max_spans: int = 10000):
        self.spans: List[Dict] = []
        self.max_spans = max_spans
        self._lock = threading.Lock()

    def export(self, spans: List[Span]) -> bool:
        with self._lock:
            for span in spans:
                self.spans.append(span.to_dict())
                if len(self.spans) > self.max_spans:
                    self.spans.pop(0)
        return True

    def get_spans(self, trace_id: str = None) -> List[Dict]:
        """Get spans, optionally filtered by trace."""
        if trace_id:
            return [s for s in self.spans if s["traceId"] == trace_id]
        return list(self.spans)


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

    def get_metrics(self) -> Dict[str, Any]:
        """Get tracing metrics."""
        return {**self.metrics, "active_traces": len(self.traces)}


# Global tracer instance
_tracer = DistributedTracer()


def get_tracer() -> DistributedTracer:
    """Get global tracer."""
    return _tracer


def trace_function(name: str = None):
    """
    Decorator to automatically trace a function.

    Usage:
        @trace_function("my_operation")
        def my_function():
            ...
    """

    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            span_name = name or func.__name__
            span = _tracer.start_span(span_name)
            span.set_attribute("function", func.__name__)

            try:
                result = func(*args, **kwargs)
                _tracer.end_span(span, SpanStatus.OK)
                return result
            except Exception as e:
                span.set_attribute("error.message", str(e))
                span.set_attribute("error.type", type(e).__name__)
                _tracer.end_span(span, SpanStatus.ERROR)
                raise

        return wrapper

    return decorator


# Convenience functions
def start_trace(name: str) -> Span:
    return _tracer.start_trace(name)


def start_span(name: str) -> Span:
    return _tracer.start_span(name)


def end_span(span: Span, status: SpanStatus = SpanStatus.OK):
    _tracer.end_span(span, status)


def get_trace_id() -> Optional[str]:
    return _tracer.get_current_trace_id()
