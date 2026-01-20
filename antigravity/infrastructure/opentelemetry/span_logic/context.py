"""
Span context and relationship management.
"""
from typing import Optional

from .models import TraceId


class SpanContext:
    def __init__(self, trace_id: TraceId):
        self.trace_id = trace_id
        self.parent_span: Optional['Span'] = None

    def set_parent(self, parent_span: 'Span') -> None:
        """Set parent span for this span."""
        self.parent_span = parent_span
        if parent_span and parent_span.trace_id:
            self.trace_id.parent_id = parent_span.trace_id.trace_id

    def get_parent_id(self) -> Optional[str]:
        """Get parent span trace ID."""
        if self.parent_span is not None:
            return self.parent_span.trace_id.trace_id
        return self.trace_id.parent_id
