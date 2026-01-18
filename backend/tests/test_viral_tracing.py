"""
🧪 Test Suite: DistributedTracer
=================================

Tests for OpenTelemetry-ready tracing system.
"""

import os
import sys
import time

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from antigravity.core.tracing import (
    DistributedTracer,
    InMemoryExporter,
    Span,
    SpanStatus,
    Trace,
    get_trace_id,
    get_tracer,
    start_span,
    start_trace,
    trace_function,
)


class TestSpan:
    """Test span data structure."""

    def test_span_creation(self):
        """Test creating a span."""
        span = Span(trace_id="abc123", span_id="span001", name="test_operation")

        assert span.trace_id == "abc123"
        assert span.status == SpanStatus.UNSET
        assert span.end_time is None

    def test_span_add_event(self):
        """Test adding events to span."""
        span = Span(trace_id="t", span_id="s", name="test")

        span.add_event("checkpoint", {"step": 1})

        assert len(span.events) == 1
        assert span.events[0].name == "checkpoint"

    def test_span_set_attribute(self):
        """Test setting span attributes."""
        span = Span(trace_id="t", span_id="s", name="test")

        span.set_attribute("user_id", "u123")
        span.set_attribute("request_size", 1024)

        assert span.attributes["user_id"] == "u123"
        assert span.attributes["request_size"] == 1024

    def test_span_duration(self):
        """Test span duration calculation."""
        span = Span(trace_id="t", span_id="s", name="test")
        time.sleep(0.05)
        span.end()

        assert span.duration_ms >= 50
        assert span.duration_ms < 200  # Should be quick

    def test_span_to_dict(self):
        """Test span serialization."""
        span = Span(trace_id="t", span_id="s", name="test")
        span.end(SpanStatus.OK)

        data = span.to_dict()

        assert data["traceId"] == "t"
        assert data["spanId"] == "s"
        assert data["status"] == "ok"


class TestTrace:
    """Test trace container."""

    def test_trace_creation(self):
        """Test creating a trace."""
        trace = Trace(trace_id="trace001", root_span_id="root001", service_name="test_service")

        assert trace.trace_id == "trace001"
        assert len(trace.spans) == 0

    def test_add_span_to_trace(self):
        """Test adding spans to trace."""
        trace = Trace(trace_id="t", root_span_id="r", service_name="svc")
        span = Span(trace_id="t", span_id="r", name="root")

        trace.add_span(span)

        assert len(trace.spans) == 1

    def test_get_root_span(self):
        """Test getting root span."""
        trace = Trace(trace_id="t", root_span_id="root", service_name="svc")
        root = Span(trace_id="t", span_id="root", name="root_op")
        child = Span(trace_id="t", span_id="child", name="child_op", parent_span_id="root")

        trace.add_span(root)
        trace.add_span(child)

        found_root = trace.get_root_span()
        assert found_root.span_id == "root"


class TestDistributedTracer:
    """Test main tracer class."""

    @pytest.fixture
    def tracer(self):
        return DistributedTracer(service_name="test_service")

    def test_start_trace(self, tracer):
        """Test starting a new trace."""
        span = tracer.start_trace("test_operation")

        assert span is not None
        assert len(span.trace_id) == 16
        assert tracer.metrics["traces_created"] == 1

    def test_start_child_span(self, tracer):
        """Test starting child span."""
        root = tracer.start_trace("parent")
        child = tracer.start_span("child_operation")

        assert child.parent_span_id == root.span_id
        assert child.trace_id == root.trace_id

    def test_end_span(self, tracer):
        """Test ending a span."""
        span = tracer.start_trace("ending_test")
        tracer.end_span(span, SpanStatus.OK)

        assert span.end_time is not None
        assert span.status == SpanStatus.OK

    def test_slow_span_tracking(self, tracer):
        """Test slow spans are tracked."""
        span = tracer.start_trace("slow_operation")
        time.sleep(0.15)  # > 100ms threshold
        tracer.end_span(span)

        assert tracer.metrics["slow_spans"] >= 1

    def test_error_span_tracking(self, tracer):
        """Test error spans are tracked."""
        span = tracer.start_trace("error_operation")
        tracer.end_span(span, SpanStatus.ERROR)

        assert tracer.metrics["error_spans"] >= 1

    def test_get_current_trace_id(self, tracer):
        """Test getting current trace ID."""
        tracer.start_trace("context_test")
        trace_id = tracer.get_current_trace_id()

        assert trace_id is not None
        assert len(trace_id) == 16


class TestExporters:
    """Test span exporters."""

    def test_in_memory_exporter(self):
        """Test in-memory exporter stores spans."""
        exporter = InMemoryExporter(max_spans=100)
        span = Span(trace_id="t", span_id="s", name="test")
        span.end()

        exporter.export([span])

        stored = exporter.get_spans()
        assert len(stored) == 1

    def test_in_memory_exporter_max_spans(self):
        """Test exporter enforces max spans."""
        exporter = InMemoryExporter(max_spans=3)

        for i in range(5):
            span = Span(trace_id="t", span_id=f"s{i}", name="test")
            exporter.export([span])

        assert len(exporter.spans) == 3

    def test_in_memory_filter_by_trace_id(self):
        """Test filtering spans by trace ID."""
        exporter = InMemoryExporter()

        span1 = Span(trace_id="trace_a", span_id="s1", name="test")
        span2 = Span(trace_id="trace_b", span_id="s2", name="test")

        exporter.export([span1, span2])

        filtered = exporter.get_spans(trace_id="trace_a")
        assert len(filtered) == 1
        assert filtered[0]["traceId"] == "trace_a"


class TestTraceDecorator:
    """Test @trace_function decorator."""

    def test_trace_function_success(self):
        """Test decorator traces successful function."""

        @trace_function("decorated_function")
        def my_function():
            return "result"

        result = my_function()

        assert result == "result"

    def test_trace_function_error(self):
        """Test decorator traces erroring function."""

        @trace_function("error_function")
        def failing_function():
            raise ValueError("Test error")

        with pytest.raises(ValueError):
            failing_function()

    def test_trace_function_uses_name(self):
        """Test decorator uses provided name."""
        tracer = get_tracer()

        @trace_function("custom_name")
        def named_function():
            pass

        named_function()

        recent = tracer.get_recent_spans(limit=1)
        assert len(recent) >= 1


class TestConvenienceFunctions:
    """Test module-level functions."""

    def test_start_trace_function(self):
        """Test start_trace function."""
        span = start_trace("module_trace")

        assert span is not None
        assert span.name == "module_trace"

    def test_start_span_function(self):
        """Test start_span function."""
        start_trace("parent")
        span = start_span("child")

        assert span is not None
        assert span.parent_span_id is not None

    def test_get_trace_id_function(self):
        """Test get_trace_id function."""
        start_trace("id_test")
        trace_id = get_trace_id()

        assert trace_id is not None


# Run with: pytest backend/tests/test_viral_tracing.py -v
