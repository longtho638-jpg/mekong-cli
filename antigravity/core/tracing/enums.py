"""
Tracing Enums.
"""
from enum import Enum


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
