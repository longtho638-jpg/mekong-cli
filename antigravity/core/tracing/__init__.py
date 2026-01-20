"""
Tracing Package.
"""
from typing import Optional

from .core import DistributedTracer, _tracer, get_tracer
from .decorators import trace_function
from .enums import SpanKind, SpanStatus
from .exporters import ConsoleExporter, InMemoryExporter, SpanExporter
from .models import Span, SpanEvent, Trace


# Convenience functions
def start_trace(name: str) -> Span:
    return _tracer.start_trace(name)


def start_span(name: str) -> Span:
    return _tracer.start_span(name)


def end_span(span: Span, status: SpanStatus = SpanStatus.OK):
    _tracer.end_span(span, status)


def get_trace_id() -> Optional[str]:
    return _tracer.get_current_trace_id()


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
