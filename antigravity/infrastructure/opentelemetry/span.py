"""
OpenTelemetry Span Module
=========================

Span implementation for distributed tracing with OpenTelemetry compatibility.

Features:
- Span lifecycle management (create, finish, status tracking)
- Event and attribute attachment
- Parent-child span relationships
- Tag management for filtering

Bug fixes applied:
- self.tags initialized as dict {} (not list [])
- add_event appends event only once (no duplicate to_dict)
- parent_span handled correctly (stores reference)
"""

import time
import logging
from typing import Dict, Any, List, Optional

from .models import SpanKind, SpanStatus, Event, Metric, TraceId


logger = logging.getLogger(__name__)


class Span:
    """OpenTelemetry span representation.

    A span represents a single operation within a trace. Spans can be nested
    to form a trace tree with parent-child relationships.

    Attributes:
        trace_id: Unique trace identifier
        kind: Type of span (SERVER, CLIENT, PRODUCER, CONSUMER, INTERNAL)
        operation_name: Name of the operation being traced
        service_name: Name of the service generating this span
        resource_name: Name of the resource being accessed
        status: Current lifecycle status of the span
        events: List of events that occurred during the span
        start_time: Timestamp when span was created
        end_time: Timestamp when span was finished
        attributes: Key-value pairs with additional context
        tags: Key-value pairs for filtering (FIX: now dict, not list)
        parent_span: Reference to parent span if this is a child span
    """

    def __init__(
        self,
        trace_id: TraceId,
        kind: SpanKind,
        operation_name: str,
        service_name: str,
        resource_name: str
    ):
        """Initialize a new span.

        Args:
            trace_id: Trace identifier for this span
            kind: Type of span
            operation_name: Name of the operation
            service_name: Name of the service
            resource_name: Name of the resource
        """
        self.trace_id = trace_id
        self.kind = kind
        self.operation_name = operation_name
        self.service_name = service_name
        self.resource_name = resource_name
        self.status = SpanStatus.CREATED
        self.events: List[Event] = []
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.attributes: Dict[str, Any] = {}
        # BUG FIX: Initialize tags as dictionary, not list
        self.tags: Dict[str, str] = {}
        # BUG FIX: Store parent span reference properly
        self.parent_span: Optional['Span'] = None

    def set_parent(self, parent_span: 'Span') -> None:
        """Set parent span for this span.

        Args:
            parent_span: The parent span reference
        """
        self.parent_span = parent_span
        # Update trace_id parent_id if parent exists
        if parent_span and parent_span.trace_id:
            self.trace_id.parent_id = parent_span.trace_id.trace_id

    def add_event(self, event: Event) -> None:
        """Add event to span.

        BUG FIX: Only appends the event object once (removed duplicate to_dict append).

        Args:
            event: The event to add
        """
        # Set span_id on event
        event.span_id = self.trace_id.trace_id

        # Ensure timestamp is set
        if event.timestamp is None:
            event.timestamp = time.time()

        # BUG FIX: Only append once (removed duplicate event.to_dict() append)
        self.events.append(event)

    def add_tag(self, key: str, value: str) -> None:
        """Add tag to span for filtering.

        Tags are key-value string pairs used for indexing and filtering spans.

        Args:
            key: Tag key
            value: Tag value
        """
        # BUG FIX: This now works because tags is a dict
        self.tags[key] = value
        self.attributes[key] = value

    def add_attribute(self, key: str, value: Any) -> None:
        """Add attribute to span.

        Attributes provide additional context about the span.

        Args:
            key: Attribute key
            value: Attribute value (any type)
        """
        self.attributes[key] = value

    def set_status(self, status: SpanStatus) -> None:
        """Set span status.

        Args:
            status: New status for the span
        """
        self.status = status

    def start(self) -> None:
        """Mark span as running."""
        self.status = SpanStatus.RUNNING
        if self.start_time is None:
            self.start_time = time.time()

    def finish(
        self,
        status: SpanStatus = SpanStatus.FINISHED,
        end_time: Optional[float] = None
    ) -> None:
        """Finish span and record end time.

        Args:
            status: Final status of the span
            end_time: Optional explicit end time (defaults to now)
        """
        self.status = status
        self.end_time = end_time or time.time()

        # Calculate duration
        duration = self.end_time - self.start_time

        # Add completion event
        completion_event = Event(
            name="span.end",
            attributes={"status": status.value},
            timestamp=self.end_time
        )
        self.add_event(completion_event)

        logger.info(
            f"Span {self.trace_id.trace_id} ({self.kind.value}) "
            f"finished in {duration:.3f}s with status {status.value}"
        )

    def get_duration(self) -> Optional[float]:
        """Get span duration in seconds.

        Returns:
            Duration in seconds if span is finished, None otherwise
        """
        if self.end_time is not None:
            return self.end_time - self.start_time
        return None

    def get_parent_id(self) -> Optional[str]:
        """Get parent span trace ID.

        Returns:
            Parent trace ID string if parent exists, None otherwise
        """
        if self.parent_span is not None:
            return self.parent_span.trace_id.trace_id
        return self.trace_id.parent_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert span to dictionary for serialization.

        Returns:
            Dictionary representation of the span
        """
        return {
            "trace_id": self.trace_id.trace_id,
            # BUG FIX: Use get_parent_id() helper for correct parent handling
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
            "attributes": self.attributes
        }

    def __repr__(self) -> str:
        return (
            f"Span(trace_id={self.trace_id.trace_id}, "
            f"operation={self.operation_name}, "
            f"status={self.status.value})"
        )


__all__ = ["Span"]
