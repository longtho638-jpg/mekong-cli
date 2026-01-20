"""
🔍 DistributedTracer - OpenTelemetry-Ready Tracing
===================================================

Request correlation, span tracking, performance profiling.
Ready for OpenTelemetry export to Jaeger/Zipkin.

MAX LEVEL: Production-ready distributed tracing.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.tracing package.
"""

from antigravity.core.tracing import (
    ConsoleExporter,
    DistributedTracer,
    InMemoryExporter,
    Span,
    SpanEvent,
    SpanExporter,
    SpanKind,
    SpanStatus,
    Trace,
    end_span,
    get_trace_id,
    get_tracer,
    start_span,
    start_trace,
    trace_function,
)

__all__ = [
    "SpanKind",
    "SpanStatus",
    "SpanEvent",
    "Span",
    "Trace",
    "SpanExporter",
    "ConsoleExporter",
    "InMemoryExporter",
    "DistributedTracer",
    "get_tracer",
    "trace_function",
    "start_trace",
    "start_span",
    "end_span",
    "get_trace_id",
]
