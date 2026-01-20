"""
OpenTelemetry Models Module
===========================

Core data models for distributed tracing:
- TraceId: Trace identifier with parent context
- SpanKind: Span type enumeration
- SpanStatus: Span lifecycle status
- Event: Trace events with attributes
- Metric: Performance metrics
"""

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional


class SpanKind(Enum):
    """Span types for OpenTelemetry."""
    SERVER = "server"
    CLIENT = "client"
    PRODUCER = "producer"
    CONSUMER = "consumer"
    INTERNAL = "internal"


class SpanStatus(Enum):
    """Span status tracking."""
    CREATED = "created"
    RUNNING = "running"
    FINISHED = "finished"
    ERROR = "error"
    TIMEOUT = "timeout"


@dataclass
class TraceId:
    """OpenTelemetry trace identifier."""

    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: Optional[str] = None
    service_name: Optional[str] = None
    span_created: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert trace ID to dictionary."""
        return {
            "trace_id": self.trace_id,
            "parent_id": self.parent_id,
            "service_name": self.service_name,
            "span_created": self.span_created
        }

    def __str__(self) -> str:
        return self.trace_id


@dataclass
class Event:
    """OpenTelemetry event."""

    name: str
    timestamp: float = field(default_factory=time.time)
    attributes: Dict[str, Any] = field(default_factory=dict)
    resource: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    span_id: Optional[str] = None  # Set when event is added to a span

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        result = {
            "id": self.id,
            "name": self.name,
            "timestamp": self.timestamp,
            "attributes": self.attributes,
        }
        if self.resource is not None:
            result["resource"] = self.resource
        if self.span_id is not None:
            result["span_id"] = self.span_id
        return result


@dataclass
class Metric:
    """OpenTelemetry metric."""

    name: str
    value: float
    unit: str
    description: str
    attributes: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary."""
        return {
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            "description": self.description,
            "attributes": self.attributes,
            "timestamp": self.timestamp
        }


__all__ = [
    "SpanKind",
    "SpanStatus",
    "TraceId",
    "Event",
    "Metric",
]
