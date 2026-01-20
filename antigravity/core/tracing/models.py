"""
Tracing Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from .enums import SpanKind, SpanStatus

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
