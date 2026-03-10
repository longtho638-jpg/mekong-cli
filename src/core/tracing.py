"""
Core Tracing - Trace ID generation and context management

Generates per-command trace IDs that propagate through the entire
Plan-Execute-Verify cycle for unified log correlation.
"""

from __future__ import annotations

import uuid
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


# Context variable for trace context (async-safe)
_trace_context: ContextVar[Optional[TraceContext]] = ContextVar(
    "_trace_context",
    default=None,
)


@dataclass
class TraceContext:
    """
    Trace context for correlating logs across async operations.

    Attributes:
        trace_id: Unique identifier for the entire trace (UUID4)
        span_id: Current span within the trace
        parent_span_id: Parent span ID for nested operations
        command: Command being executed
        start_time: Trace start timestamp
        tenant_id: Optional tenant ID for multi-tenant tracing
    """

    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    span_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_span_id: Optional[str] = None
    command: str = "unknown"
    start_time: datetime = field(default_factory=datetime.utcnow)
    tenant_id: Optional[str] = None
    _current_span: Optional[SpanContext] = field(default=None, repr=False)

    def new_span(self, name: str) -> SpanContext:
        """Create a new child span within this trace."""
        # Use current span's ID as parent if available, otherwise use context's span_id
        parent_id = self._current_span.span_id if self._current_span else self.span_id
        span = SpanContext(
            trace_id=self.trace_id,
            span_id=str(uuid.uuid4()),
            parent_span_id=parent_id,
            name=name,
            _parent_context=self,
        )
        return span

    def _set_current_span(self, span: Optional[SpanContext]) -> None:
        """Set the current active span."""
        self._current_span = span
        if span:
            self.span_id = span.span_id

    def bind(self) -> None:
        """Bind this trace context to the current contextvar."""
        _trace_context.set(self)
        # Also bind to structlog context
        structlog.contextvars.bind_contextvars(
            trace_id=self.trace_id,
            span_id=self.span_id,
            command=self.command,
        )

    @classmethod
    def get_current(cls) -> Optional[TraceContext]:
        """Get the current trace context."""
        return _trace_context.get()

    def to_dict(self) -> dict:
        """Convert to dictionary for logging."""
        return {
            "trace_id": self.trace_id,
            "span_id": self.span_id,
            "command": self.command,
            "tenant_id": self.tenant_id,
            "duration_ms": self.duration_ms,
        }

    @property
    def duration_ms(self) -> float:
        """Get elapsed time since trace start in milliseconds."""
        delta = datetime.utcnow() - self.start_time
        return delta.total_seconds() * 1000


@dataclass
class SpanContext:
    """
    Span context for tracking individual operations within a trace.

    Usage:
        with trace_context.new_span("planner.execute") as span:
            span.set_attribute("model", "gemini-3-pro")
            # ... operation ...
    """

    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    name: str
    start_time: datetime = field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    attributes: dict = field(default_factory=dict)
    status: str = "in_progress"  # in_progress, success, error
    _parent_context: Optional[TraceContext] = field(default=None, repr=False)

    def __enter__(self) -> SpanContext:
        """Enter span context."""
        self.start_time = datetime.utcnow()
        structlog.contextvars.bind_contextvars(
            trace_id=self.trace_id,
            span_id=self.span_id,
            span_name=self.name,
        )
        # Track this span in the parent context
        if self._parent_context:
            self._parent_context._set_current_span(self)
        logger.debug("span.start", span_name=self.name)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit span context."""
        self.end_time = datetime.utcnow()
        self.status = "error" if exc_type else "success"
        if exc_type:
            self.attributes["error"] = str(exc_val)

        duration_ms = (self.end_time - self.start_time).total_seconds() * 1000

        structlog.contextvars.bind_contextvars(
            trace_id=self.trace_id,
            span_id=self.span_id,
        )
        logger.info(
            "span.end",
            span_name=self.name,
            status=self.status,
            duration_ms=round(duration_ms, 2),
            **self.attributes,
        )
        # Clear current span when exiting
        if self._parent_context:
            self._parent_context._set_current_span(None)

    def set_attribute(self, key: str, value: str | int | float | bool) -> None:
        """Set a span attribute."""
        self.attributes[key] = value

    @property
    def duration_ms(self) -> float:
        """Get span duration in milliseconds."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds() * 1000
        return (datetime.utcnow() - self.start_time).total_seconds() * 1000


def generate_trace_id() -> str:
    """Generate a new UUID4 trace ID."""
    return str(uuid.uuid4())


def start_trace(
    command: str,
    tenant_id: Optional[str] = None,
) -> TraceContext:
    """
    Start a new trace for a command.

    Args:
        command: Command name being executed
        tenant_id: Optional tenant ID

    Returns:
        New TraceContext bound to current context
    """
    context = TraceContext(
        trace_id=generate_trace_id(),
        command=command,
        tenant_id=tenant_id,
    )
    context.bind()

    logger.info(
        "trace.start",
        trace_id=context.trace_id,
        command=command,
        tenant_id=tenant_id,
    )

    return context


def end_trace() -> None:
    """End the current trace and log summary."""
    context = _trace_context.get()
    if context:
        logger.info(
            "trace.end",
            trace_id=context.trace_id,
            command=context.command,
            duration_ms=round(context.duration_ms, 2),
        )
        _trace_context.set(None)


def get_current_trace_id() -> Optional[str]:
    """Get the current trace ID."""
    context = _trace_context.get()
    return context.trace_id if context else None


def bind_trace_context(
    trace_id: str,
    span_id: Optional[str] = None,
    **extra_context: str,
) -> None:
    """
    Bind an existing trace ID to the logging context.

    Useful for propagating trace IDs across service boundaries.

    Args:
        trace_id: Existing trace ID to bind
        span_id: Optional span ID
        **extra_context: Additional context to bind
    """
    context_vars = {"trace_id": trace_id}
    if span_id:
        context_vars["span_id"] = span_id
    context_vars.update(extra_context)

    structlog.contextvars.bind_contextvars(**context_vars)

    # Also update the contextvar for get_current_trace_id to work
    existing = _trace_context.get()
    if existing:
        existing.trace_id = trace_id
        if span_id:
            existing.span_id = span_id
    else:
        new_context = TraceContext(command="external")
        new_context.trace_id = trace_id
        if span_id:
            new_context.span_id = span_id
        _trace_context.set(new_context)


def trace_middleware(func):
    """
    Middleware decorator to add tracing to any function.

    Automatically starts a span before function execution and ends after.

    Usage:
        @trace_middleware
        def plan(goal: str) -> Recipe:
            ...
    """
    import functools

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        context = _trace_context.get()
        if not context:
            return func(*args, **kwargs)

        span_name = f"{func.__module__}.{func.__qualname__}"
        with context.new_span(span_name) as span:
            span.set_attribute("function", func.__name__)
            return func(*args, **kwargs)

    return wrapper


__all__ = [
    "TraceContext",
    "SpanContext",
    "generate_trace_id",
    "start_trace",
    "end_trace",
    "get_current_trace_id",
    "bind_trace_context",
    "trace_middleware",
]
