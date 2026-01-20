"""
Tracing Exporters.
"""
import logging
import threading
from typing import Dict, List

from .models import Span

logger = logging.getLogger(__name__)


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
