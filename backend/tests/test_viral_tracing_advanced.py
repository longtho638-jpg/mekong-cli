"""
🧪 Test Suite: Viral Tracing Advanced
=====================================

Tests for DistributedTracer and convenience utilities.
"""

import os
import sys
import time

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from antigravity.core.tracing import (
    DistributedTracer,
    SpanStatus,
    get_trace_id,
    get_tracer,
    start_span,
    start_trace,
    trace_function,
)


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
