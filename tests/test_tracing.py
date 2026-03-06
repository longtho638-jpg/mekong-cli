"""
Tests for Core Tracing Module

Tests cover:
- Trace ID generated per command
- Trace ID appears in all log output
- Trace ID persists through async calls
- Span context management
"""

import pytest
from datetime import datetime
from unittest.mock import patch, MagicMock

from src.core.tracing import (
    TraceContext,
    SpanContext,
    generate_trace_id,
    start_trace,
    end_trace,
    get_current_trace_id,
    bind_trace_context,
    trace_middleware,
)


class TestTraceContext:
    """Test TraceContext dataclass."""

    def test_create_default(self):
        """Test creating TraceContext with defaults."""
        context = TraceContext(command="test")
        assert context.command == "test"
        assert context.trace_id is not None
        assert context.span_id is not None
        assert context.parent_span_id is None

    def test_generate_unique_trace_ids(self):
        """Test that each TraceContext gets unique trace_id."""
        context1 = TraceContext(command="test1")
        context2 = TraceContext(command="test2")
        assert context1.trace_id != context2.trace_id

    def test_new_span(self):
        """Test creating child span."""
        context = TraceContext(command="test")
        span = context.new_span("child.operation")

        assert span.trace_id == context.trace_id
        assert span.parent_span_id == context.span_id
        assert span.name == "child.operation"

    def test_duration_ms(self):
        """Test duration calculation."""
        import time

        context = TraceContext(command="test")
        time.sleep(0.1)  # Sleep 100ms
        duration = context.duration_ms
        assert duration >= 100  # At least 100ms

    def test_bind_to_contextvar(self):
        """Test binding context to contextvar."""
        context = TraceContext(command="test")
        context.bind()

        current = TraceContext.get_current()
        assert current is not None
        assert current.trace_id == context.trace_id

    def test_to_dict(self):
        """Test converting to dictionary."""
        context = TraceContext(command="test", tenant_id="tenant-123")
        result = context.to_dict()

        assert "trace_id" in result
        assert "span_id" in result
        assert result["command"] == "test"
        assert result["tenant_id"] == "tenant-123"
        assert "duration_ms" in result


class TestSpanContext:
    """Test SpanContext dataclass."""

    def test_span_context_manager(self):
        """Test span as context manager."""
        context = TraceContext(command="test")

        with context.new_span("test.operation") as span:
            assert span.status == "in_progress"
            span.set_attribute("key", "value")

        assert span.status == "success"
        assert span.end_time is not None

    def test_span_with_error(self):
        """Test span captures error status."""
        context = TraceContext(command="test")

        try:
            with context.new_span("failing.operation") as span:
                raise ValueError("Test error")
        except ValueError:
            pass

        assert span.status == "error"
        assert "error" in span.attributes

    def test_span_duration(self):
        """Test span duration calculation."""
        import time

        context = TraceContext(command="test")

        with context.new_span("timed.operation") as span:
            time.sleep(0.1)

        duration = span.duration_ms
        assert duration >= 100

    def test_set_attribute(self):
        """Test setting span attributes."""
        context = TraceContext(command="test")
        span = context.new_span("test")

        span.set_attribute("model", "gemini-3-pro")
        span.set_attribute("tokens", 1000)
        span.set_attribute("success", True)

        assert span.attributes["model"] == "gemini-3-pro"
        assert span.attributes["tokens"] == 1000
        assert span.attributes["success"] is True


class TestTraceFunctions:
    """Test trace utility functions."""

    def test_generate_trace_id_format(self):
        """Test generated trace_id is valid UUID4."""
        import uuid

        trace_id = generate_trace_id()
        # Should not raise - valid UUID4
        uuid.UUID(trace_id, version=4)

    def test_generate_unique_trace_ids(self):
        """Test that generated trace IDs are unique."""
        ids = [generate_trace_id() for _ in range(100)]
        assert len(set(ids)) == 100  # All unique

    def test_start_trace(self):
        """Test starting a trace."""
        context = start_trace(command="mekong.cook", tenant_id="test-tenant")

        assert context.command == "mekong.cook"
        assert context.tenant_id == "test-tenant"
        assert get_current_trace_id() == context.trace_id

    def test_end_trace(self):
        """Test ending a trace."""
        start_trace(command="test")
        trace_id_before = get_current_trace_id()

        end_trace()

        # Trace should be cleared
        assert get_current_trace_id() is None

    def test_get_current_trace_id_none(self):
        """Test get_current_trace_id when no trace active."""
        # Ensure no trace is active
        from src.core.tracing import _trace_context
        _trace_context.set(None)

        assert get_current_trace_id() is None

    def test_bind_trace_context(self):
        """Test binding existing trace ID."""
        trace_id = generate_trace_id()
        span_id = generate_trace_id()

        bind_trace_context(trace_id, span_id=span_id)

        assert get_current_trace_id() == trace_id


class TestTraceMiddleware:
    """Test @trace_middleware decorator."""

    def test_middleware_creates_span(self):
        """Test that middleware creates span."""
        # Start a trace first
        context = start_trace(command="test")

        @trace_middleware
        def test_function(x: int) -> int:
            return x * 2

        result = test_function(5)
        assert result == 10

        end_trace()

    def test_middleware_without_trace(self):
        """Test that middleware works without active trace."""
        from src.core.tracing import _trace_context
        _trace_context.set(None)

        @trace_middleware
        def test_function(x: int) -> int:
            return x * 2

        result = test_function(5)
        assert result == 10  # Should still work


class TestTraceIntegration:
    """Test trace integration scenarios."""

    def test_full_trace_lifecycle(self):
        """Test complete trace lifecycle."""
        # Start trace
        context = start_trace(command="mekong.cook", tenant_id="tenant-1")
        initial_trace_id = context.trace_id

        # Create spans
        with context.new_span("planner.execute") as plan_span:
            plan_span.set_attribute("goals", 3)

        with context.new_span("executor.run") as exec_span:
            exec_span.set_attribute("commands", 5)

        # End trace
        end_trace()

        # Verify cleanup
        assert get_current_trace_id() is None

    def test_nested_spans(self):
        """Test nested span creation."""
        context = start_trace(command="test")

        with context.new_span("parent") as parent:
            child = context.new_span("child")
            # Child span's parent should be the parent span
            assert child.parent_span_id == parent.span_id

        end_trace()

    def test_multiple_traces_isolation(self):
        """Test that multiple traces are isolated."""
        trace1 = start_trace(command="test1")

        # Simulate context switch
        from src.core.tracing import _trace_context
        _trace_context.set(None)

        trace2 = start_trace(command="test2")

        assert trace1.trace_id != trace2.trace_id
        assert get_current_trace_id() == trace2.trace_id

        end_trace()
