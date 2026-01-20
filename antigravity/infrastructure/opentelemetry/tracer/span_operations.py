"""Span creation, tracing, and finishing operations for DistributedTracer."""

import json
import hashlib
import logging
import threading
from typing import Dict, Any, List, Optional
from collections import deque

from ..models import SpanKind, SpanStatus, TraceId, Event
from ..span import Span

logger = logging.getLogger(__name__)


class SpanOperationsMixin:
    """Mixin providing span creation, tracing, and finishing for DistributedTracer."""

    # Type hints for attributes from main class
    active_spans: Dict[str, Span]
    trace_buffer: deque
    performance_analytics: Dict[str, Any]
    lock: threading.Lock

    def create_span(
        self,
        operation_name: str,
        service_name: str,
        resource_name: str,
        parent_span: Optional[Span] = None,
        tags: Optional[List[str]] = None,
        attributes: Optional[Dict[str, Any]] = None
    ) -> Span:
        """Create new span for tracing with optional parent context."""
        # Create trace ID with parent context
        parent_trace_id: Optional[str] = None
        if parent_span and parent_span.trace_id:
            parent_trace_id = parent_span.trace_id.trace_id

        trace_id = TraceId(
            service_name=service_name,
            parent_id=parent_trace_id
        )

        # Create span
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name=operation_name,
            service_name=service_name,
            resource_name=resource_name
        )

        # Set parent reference
        if parent_span:
            span.set_parent(parent_span)
            parent_span.add_event(Event(
                name="child_span_created",
                attributes={
                    "child_trace_id": span.trace_id.trace_id,
                    "operation_name": operation_name
                }
            ))

        # Add tags
        if tags:
            for tag in tags:
                span.add_tag(tag, f"service:{service_name}")

        # Add attributes
        if attributes:
            for key, value in attributes.items():
                span.add_attribute(key, value)

        # Register span
        with self.lock:
            self.active_spans[span.trace_id.trace_id] = span
            self.performance_analytics["request_count"] += 1

        return span

    def trace_request(
        self,
        request_data: Dict[str, Any],
        service_name: str,
        operation_name: str,
        resource_name: str = "http_request"
    ) -> Span:
        """Trace HTTP request with method, URL, and user agent attributes."""
        span = self.create_span(
            operation_name=operation_name,
            service_name=service_name,
            resource_name=resource_name,
            tags=["http", "request"]
        )

        # Add request event
        request_size = len(str(request_data.get("body", "")))

        request_event = Event(
            name="http.request",
            attributes={
                "method": request_data.get("method", "unknown"),
                "url": request_data.get("url", "unknown"),
                "user_agent": request_data.get("user_agent", "unknown"),
                "request_size": request_size,
                "ip_address": request_data.get("client_ip", "unknown")
            }
        )

        span.add_event(request_event)

        return span

    def trace_ai_operation(
        self,
        operation_name: str,
        input_data: Dict[str, Any],
        service_name: str = "ai_service",
        model_name: str = "optimization_model",
        output_data: Optional[Any] = None,
        execution_time: float = 0.0
    ) -> Span:
        """Trace AI model operation with input/output hashing."""
        span = self.create_span(
            operation_name=operation_name,
            service_name=service_name,
            resource_name="ai_model",
            tags=["ai", "optimization"]
        )

        # Add AI operation event
        ai_event = Event(
            name="ai.operation",
            attributes={
                "model_name": model_name,
                "input_data_size": len(str(input_data)),
                "execution_time": execution_time
            }
        )

        span.add_event(ai_event)

        # Add operation attributes with hash for data fingerprinting
        if input_data:
            input_json = json.dumps(input_data, sort_keys=True)
            input_hash = hashlib.md5(input_json.encode()).hexdigest()[:8]
            span.add_attribute("input_hash", input_hash)

        if output_data:
            output_json = json.dumps(output_data, sort_keys=True)
            output_hash = hashlib.md5(output_json.encode()).hexdigest()[:8]
            span.add_attribute("output_hash", output_hash)

        return span

    def finish_span(
        self,
        span: Span,
        status: SpanStatus = SpanStatus.FINISHED
    ) -> None:
        """Finish a span and queue for export."""
        span.finish(status=status)

        # Move to completed
        span_dict = span.to_dict()

        with self.lock:
            # Remove from active
            trace_id = span.trace_id.trace_id
            if trace_id in self.active_spans:
                del self.active_spans[trace_id]

            # Add to buffer for processing
            self.trace_buffer.append(span_dict)


__all__ = ["SpanOperationsMixin"]
