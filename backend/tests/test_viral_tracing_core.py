"""
🧪 Test Suite: Viral Tracing Core
=================================

Tests for core data structures of the tracing system.
"""

import os
import sys
import time

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from antigravity.core.tracing import (
    InMemoryExporter,
    Span,
    SpanStatus,
    Trace,
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
