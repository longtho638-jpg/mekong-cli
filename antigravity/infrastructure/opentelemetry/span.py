"""
OpenTelemetry Span Facade.
"""

from typing import Any, Dict, List, Optional

from .models import Event, SpanKind, SpanStatus, TraceId
from .span_logic.attributes import SpanAttributes
from .span_logic.context import SpanContext
from .span_logic.lifecycle import SpanLifecycle


class Span(SpanLifecycle, SpanContext, SpanAttributes):
    """OpenTelemetry span representation."""

    def __init__(
        self,
        trace_id: TraceId,
        kind: SpanKind,
        operation_name: str,
        service_name: str,
        resource_name: str,
    ):
        SpanLifecycle.__init__(self)
        SpanContext.__init__(self, trace_id)
        SpanAttributes.__init__(self)

        self.kind = kind
        self.operation_name = operation_name
        self.service_name = service_name
        self.resource_name = resource_name

    def add_event(self, event: Event) -> None:
        """Add event to span, auto-setting span_id from trace_id."""
        super().add_event(event, self.trace_id.trace_id)

    def finish(
        self, status: SpanStatus = SpanStatus.FINISHED, end_time: Optional[float] = None
    ) -> None:
        """Finish the span and record completion event."""
        SpanLifecycle.finish(self, status, end_time)
        completion_event = Event(
            name="span.end", attributes={"status": status.value}, timestamp=self.end_time
        )
        super().add_event(completion_event, self.trace_id.trace_id)

    def to_dict(self) -> Dict[str, Any]:
        """Convert span to dictionary for serialization."""
        return {
            "trace_id": self.trace_id.trace_id,
            "parent_id": self.get_parent_id(),
            "kind": self.kind.value,
            "operation_name": self.operation_name,
            "service_name": self.service_name,
            "resource_name": self.resource_name,
            "status": self.status.value,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.get_duration(),
            "events": [event.to_dict() for event in self.events],
            "tags": self.tags,
            "attributes": self.attributes,
        }

    def __repr__(self) -> str:
        return (
            f"Span(trace_id={self.trace_id.trace_id}, "
            f"operation={self.operation_name}, "
            f"status={self.status.value})"
        )
