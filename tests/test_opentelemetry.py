"""
OpenTelemetry Module Tests
==========================

Comprehensive test suite for antigravity.infrastructure.opentelemetry module.

Tests cover:
- DistributedTracer initialization and configuration
- Span creation, lifecycle, and export
- TracingAgent registration and lifecycle
- Background processors (start/stop with mocks)
- Data models serialization (to_dict)

All network requests are mocked to avoid actual HTTP calls.
"""

import time
from antigravity.infrastructure.opentelemetry import (
    DEFAULT_JAEGER_ENDPOINT,
    DEFAULT_OTLP_ENDPOINT,
    DEFAULT_PROMETHEUS_GATEWAY,
    DEFAULT_SERVICE_NAME,
    AgentConfig,
    # Exporters
    BaseExporter,
    # Processors
    BaseProcessor,
    # Tracer
    DistributedTracer,
    Event,
    ExporterConfig,
    ExportLoopProcessor,
    ExportProcessor,
    JaegerExporter,
    Metric,
    MetricsProcessor,
    OTLPExporter,
    PerformanceAnalyzer,
    SamplingConfig,
    # Span
    Span,
    # Models
    SpanKind,
    SpanProcessor,
    SpanStatus,
    TraceId,
    # Config
    TracerConfig,
    # Tracing Agent
    TracingAgent,
)
from collections import deque
from unittest.mock import MagicMock, Mock, patch

import pytest

# =============================================================================
# Test: Configuration Dataclasses
# =============================================================================


class TestTracerConfig:
    """Test TracerConfig dataclass."""

    def test_default_values(self):
        """Test default configuration values."""
        config = TracerConfig()
        assert config.jaeger_endpoint == DEFAULT_JAEGER_ENDPOINT
        assert config.otlp_endpoint == DEFAULT_OTLP_ENDPOINT
        assert config.prometheus_gateway == DEFAULT_PROMETHEUS_GATEWAY
        assert config.service_name == DEFAULT_SERVICE_NAME
        assert config.trace_buffer_size == 10000
        assert config.export_queue_size == 1000
        assert config.batch_size == 100
        assert config.enable_background_processors is True
        assert config.enable_auto_export is True

    def test_custom_values(self):
        """Test custom configuration values."""
        config = TracerConfig(
            jaeger_endpoint="http://custom:14268",
            service_name="test-service",
            trace_buffer_size=5000,
            enable_background_processors=False
        )
        assert config.jaeger_endpoint == "http://custom:14268"
        assert config.service_name == "test-service"
        assert config.trace_buffer_size == 5000
        assert config.enable_background_processors is False


class TestExporterConfig:
    """Test ExporterConfig dataclass."""

    def test_required_endpoint(self):
        """Test that endpoint is required."""
        config = ExporterConfig(endpoint="http://localhost:4317")
        assert config.endpoint == "http://localhost:4317"
        assert config.timeout_seconds == 10
        assert config.retry_count == 3

    def test_custom_headers(self):
        """Test custom headers."""
        config = ExporterConfig(
            endpoint="http://localhost:4317",
            headers={"Authorization": "Bearer token"}
        )
        assert config.headers["Authorization"] == "Bearer token"


class TestAgentConfig:
    """Test AgentConfig dataclass."""

    def test_agent_config_creation(self):
        """Test agent configuration creation."""
        config = AgentConfig(
            name="test-agent",
            operations=["op1", "op2"],
            critical_operations=["op1"],
            enabled=True
        )
        assert config.name == "test-agent"
        assert config.operations == ["op1", "op2"]
        assert config.critical_operations == ["op1"]
        assert config.enabled is True


# =============================================================================
# Test: Data Models
# =============================================================================


class TestTraceId:
    """Test TraceId dataclass."""

    def test_auto_generated_trace_id(self):
        """Test that trace_id is auto-generated."""
        trace_id = TraceId()
        assert trace_id.trace_id is not None
        assert len(trace_id.trace_id) == 36  # UUID format

    def test_with_parent_id(self):
        """Test trace_id with parent."""
        trace_id = TraceId(parent_id="parent-123", service_name="test-service")
        assert trace_id.parent_id == "parent-123"
        assert trace_id.service_name == "test-service"

    def test_to_dict(self):
        """Test serialization to dictionary."""
        trace_id = TraceId(service_name="test-service")
        data = trace_id.to_dict()
        assert "trace_id" in data
        assert data["service_name"] == "test-service"
        assert "span_created" in data

    def test_str_representation(self):
        """Test string representation."""
        trace_id = TraceId()
        assert str(trace_id) == trace_id.trace_id


class TestSpanKind:
    """Test SpanKind enumeration."""

    def test_span_kinds(self):
        """Test all span kind values."""
        assert SpanKind.SERVER.value == "server"
        assert SpanKind.CLIENT.value == "client"
        assert SpanKind.PRODUCER.value == "producer"
        assert SpanKind.CONSUMER.value == "consumer"
        assert SpanKind.INTERNAL.value == "internal"


class TestSpanStatus:
    """Test SpanStatus enumeration."""

    def test_span_statuses(self):
        """Test all span status values."""
        assert SpanStatus.CREATED.value == "created"
        assert SpanStatus.RUNNING.value == "running"
        assert SpanStatus.FINISHED.value == "finished"
        assert SpanStatus.ERROR.value == "error"
        assert SpanStatus.TIMEOUT.value == "timeout"


class TestEvent:
    """Test Event dataclass."""

    def test_event_creation(self):
        """Test event creation with defaults."""
        event = Event(name="test-event")
        assert event.name == "test-event"
        assert event.timestamp is not None
        assert event.attributes == {}
        assert event.id is not None

    def test_event_with_attributes(self):
        """Test event with custom attributes."""
        event = Event(
            name="test-event",
            attributes={"key": "value", "count": 42}
        )
        assert event.attributes["key"] == "value"
        assert event.attributes["count"] == 42

    def test_event_to_dict(self):
        """Test event serialization."""
        event = Event(
            name="test-event",
            attributes={"key": "value"},
            resource="test-resource"
        )
        data = event.to_dict()
        assert data["name"] == "test-event"
        assert data["attributes"]["key"] == "value"
        assert data["resource"] == "test-resource"
        assert "id" in data
        assert "timestamp" in data


class TestMetric:
    """Test Metric dataclass."""

    def test_metric_creation(self):
        """Test metric creation."""
        metric = Metric(
            name="request_duration",
            value=1.5,
            unit="seconds",
            description="Request duration in seconds"
        )
        assert metric.name == "request_duration"
        assert metric.value == 1.5
        assert metric.unit == "seconds"
        assert metric.description == "Request duration in seconds"

    def test_metric_to_dict(self):
        """Test metric serialization."""
        metric = Metric(
            name="cpu_usage",
            value=75.5,
            unit="percent",
            description="CPU usage percentage",
            attributes={"host": "server-1"}
        )
        data = metric.to_dict()
        assert data["name"] == "cpu_usage"
        assert data["value"] == 75.5
        assert data["unit"] == "percent"
        assert data["attributes"]["host"] == "server-1"
        assert "timestamp" in data


# =============================================================================
# Test: Span
# =============================================================================


class TestSpan:
    """Test Span class."""

    def test_span_creation(self):
        """Test basic span creation."""
        trace_id = TraceId(service_name="test-service")
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test-operation",
            service_name="test-service",
            resource_name="test-resource"
        )
        assert span.trace_id == trace_id
        assert span.kind == SpanKind.SERVER
        assert span.operation_name == "test-operation"
        assert span.service_name == "test-service"
        assert span.resource_name == "test-resource"
        assert span.status == SpanStatus.CREATED
        assert span.events == []
        assert span.attributes == {}
        assert span.tags == {}
        assert span.parent_span is None
        assert span.start_time is not None
        assert span.end_time is None

    def test_span_start(self):
        """Test span start method."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        span.start()
        assert span.status == SpanStatus.RUNNING

    def test_span_finish(self):
        """Test span finish method."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        span.start()
        time.sleep(0.01)  # Small delay
        span.finish()
        assert span.status == SpanStatus.FINISHED
        assert span.end_time is not None
        assert span.end_time > span.start_time
        # Check completion event was added
        event_names = [e.name for e in span.events]
        assert "span.end" in event_names

    def test_span_finish_with_error(self):
        """Test span finish with error status."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        span.finish(status=SpanStatus.ERROR)
        assert span.status == SpanStatus.ERROR

    def test_span_add_event(self):
        """Test adding event to span."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        event = Event(name="test-event", attributes={"key": "value"})
        span.add_event(event)
        assert len(span.events) == 1
        assert span.events[0].name == "test-event"
        assert span.events[0].span_id == trace_id.trace_id

    def test_span_add_tag(self):
        """Test adding tag to span."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        span.add_tag("environment", "production")
        assert span.tags["environment"] == "production"
        assert span.attributes["environment"] == "production"

    def test_span_add_attribute(self):
        """Test adding attribute to span."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        span.add_attribute("user_id", 12345)
        assert span.attributes["user_id"] == 12345

    def test_span_set_parent(self):
        """Test setting parent span."""
        parent_trace_id = TraceId(service_name="parent")
        parent_span = Span(
            trace_id=parent_trace_id,
            kind=SpanKind.SERVER,
            operation_name="parent-op",
            service_name="parent-service",
            resource_name="parent-resource"
        )
        child_trace_id = TraceId(service_name="child")
        child_span = Span(
            trace_id=child_trace_id,
            kind=SpanKind.CLIENT,
            operation_name="child-op",
            service_name="child-service",
            resource_name="child-resource"
        )
        child_span.set_parent(parent_span)
        assert child_span.parent_span == parent_span
        assert child_span.trace_id.parent_id == parent_trace_id.trace_id

    def test_span_get_duration(self):
        """Test getting span duration."""
        trace_id = TraceId()
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test",
            service_name="test",
            resource_name="test"
        )
        # Duration should be None before finish
        assert span.get_duration() is None
        span.finish()
        duration = span.get_duration()
        assert duration is not None
        assert duration >= 0

    def test_span_to_dict(self):
        """Test span serialization."""
        trace_id = TraceId(service_name="test-service")
        span = Span(
            trace_id=trace_id,
            kind=SpanKind.SERVER,
            operation_name="test-operation",
            service_name="test-service",
            resource_name="test-resource"
        )
        span.add_tag("env", "test")
        span.add_attribute("user_id", 123)
        span.finish()

        data = span.to_dict()
        assert data["trace_id"] == trace_id.trace_id
        assert data["kind"] == "server"
        assert data["operation_name"] == "test-operation"
        assert data["service_name"] == "test-service"
        assert data["resource_name"] == "test-resource"
        assert data["status"] == "finished"
        assert data["start_time"] is not None
        assert data["end_time"] is not None
        assert data["duration"] is not None
        assert data["tags"]["env"] == "test"
        assert data["attributes"]["user_id"] == 123
        assert len(data["events"]) >= 1  # At least completion event


# =============================================================================
# Test: TracingAgent
# =============================================================================


class TestTracingAgent:
    """Test TracingAgent class."""

    def test_agent_creation(self):
        """Test basic agent creation."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1", "op2", "op3"],
            critical_operations=["op1"]
        )
        assert agent.name == "test-agent"
        assert agent.operations == ["op1", "op2", "op3"]
        assert agent.critical_operations == ["op1"]
        assert agent.active is True
        assert agent.shutdown_requested is False

    def test_is_critical_operation(self):
        """Test critical operation check."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1", "op2"],
            critical_operations=["op1"]
        )
        assert agent.is_critical_operation("op1") is True
        assert agent.is_critical_operation("op2") is False

    def test_is_supported_operation(self):
        """Test supported operation check."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1", "op2"]
        )
        assert agent.is_supported_operation("op1") is True
        assert agent.is_supported_operation("op3") is False

    def test_record_operation(self):
        """Test recording operations."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1", "op2"]
        )
        agent.record_operation("op1", success=True)
        agent.record_operation("op1", success=True)
        agent.record_operation("op1", success=False)

        stats = agent.get_operation_stats()
        assert stats["op1"]["total_count"] == 3
        assert stats["op1"]["error_count"] == 1
        assert stats["op1"]["error_rate_percent"] > 0

    def test_register_and_unregister_span(self):
        """Test span registration lifecycle."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1"]
        )
        mock_span = Mock()
        agent.register_span("span-123", mock_span)
        assert agent.get_active_span_count() == 1

        agent.unregister_span("span-123")
        assert agent.get_active_span_count() == 0

    def test_get_health_status(self):
        """Test health status retrieval."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1", "op2"]
        )
        agent.record_operation("op1", success=True)
        agent.record_operation("op2", success=False)

        health = agent.get_health_status()
        assert health["name"] == "test-agent"
        assert health["active"] is True
        assert health["shutdown_requested"] is False
        assert health["total_operations"] == 2
        assert health["total_errors"] == 1
        assert "error_rate_percent" in health
        assert "last_activity" in health

    def test_activate_deactivate(self):
        """Test agent activation/deactivation."""
        agent = TracingAgent(name="test-agent", operations=["op1"])
        assert agent.active is True

        agent.deactivate()
        assert agent.active is False

        agent.activate()
        assert agent.active is True
        assert agent.shutdown_requested is False

    def test_shutdown(self):
        """Test agent shutdown."""
        agent = TracingAgent(name="test-agent", operations=["op1"])
        agent.shutdown()
        assert agent.shutdown_requested is True
        assert agent.active is False

    def test_to_dict(self):
        """Test agent serialization."""
        agent = TracingAgent(
            name="test-agent",
            operations=["op1", "op2"],
            critical_operations=["op1"]
        )
        agent.record_operation("op1", success=True)

        data = agent.to_dict()
        assert data["name"] == "test-agent"
        assert data["operations"] == ["op1", "op2"]
        assert data["critical_operations"] == ["op1"]
        assert data["active"] is True
        assert "stats" in data


# =============================================================================
# Test: DistributedTracer
# =============================================================================


class TestDistributedTracer:
    """Test DistributedTracer class."""

    def test_tracer_initialization_without_background_processors(self):
        """Test tracer initialization with background processors disabled."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)
        assert tracer.service_name == DEFAULT_SERVICE_NAME
        assert tracer.jaeger_endpoint == DEFAULT_JAEGER_ENDPOINT
        assert tracer.active_spans == {}
        assert tracer.completed_spans == []
        assert tracer.shutdown_requested is False
        # Default agents should be registered
        assert "payment_processor" in tracer.agent_registry
        assert "user_service" in tracer.agent_registry
        assert "queue_processor" in tracer.agent_registry
        assert "ai_processor" in tracer.agent_registry

    def test_tracer_custom_endpoints(self):
        """Test tracer with custom endpoints."""
        tracer = DistributedTracer(
            jaeger_endpoint="http://custom-jaeger:14268",
            otlp_endpoint="http://custom-otlp:4317",
            service_name="custom-service",
            config=TracerConfig(enable_background_processors=False)
        )
        assert tracer.jaeger_endpoint == "http://custom-jaeger:14268"
        assert tracer.otlp_endpoint == "http://custom-otlp:4317"
        assert tracer.service_name == "custom-service"

    def test_create_span(self):
        """Test span creation via tracer."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        span = tracer.create_span(
            operation_name="test-operation",
            service_name="test-service",
            resource_name="test-resource",
            tags=["tag1", "tag2"],
            attributes={"key": "value"}
        )

        assert span is not None
        assert span.operation_name == "test-operation"
        assert span.service_name == "test-service"
        assert span.resource_name == "test-resource"
        assert span.trace_id.trace_id in tracer.active_spans
        assert tracer.performance_analytics["request_count"] >= 1

    def test_create_span_with_parent(self):
        """Test creating child span with parent."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        parent_span = tracer.create_span(
            operation_name="parent-op",
            service_name="test-service",
            resource_name="test-resource"
        )
        child_span = tracer.create_span(
            operation_name="child-op",
            service_name="test-service",
            resource_name="test-resource",
            parent_span=parent_span
        )

        assert child_span.parent_span == parent_span
        assert child_span.trace_id.parent_id == parent_span.trace_id.trace_id

    def test_trace_request(self):
        """Test tracing HTTP request."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        request_data = {
            "method": "GET",
            "url": "/api/test",
            "user_agent": "test-agent",
            "client_ip": "127.0.0.1"
        }

        span = tracer.trace_request(
            request_data=request_data,
            service_name="api-service",
            operation_name="get_test"
        )

        assert span is not None
        assert span.operation_name == "get_test"
        assert span.service_name == "api-service"
        # Check http event was added
        event_names = [e.name for e in span.events]
        assert "http.request" in event_names

    def test_trace_ai_operation(self):
        """Test tracing AI operation."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        input_data = {"prompt": "test prompt", "max_tokens": 100}
        output_data = {"response": "test response"}

        span = tracer.trace_ai_operation(
            operation_name="inference",
            input_data=input_data,
            service_name="ai-service",
            model_name="test-model",
            output_data=output_data,
            execution_time=1.5
        )

        assert span is not None
        assert span.operation_name == "inference"
        assert span.service_name == "ai-service"
        # Check ai event was added
        event_names = [e.name for e in span.events]
        assert "ai.operation" in event_names
        # Check hashes were added
        assert "input_hash" in span.attributes

    def test_finish_span(self):
        """Test finishing span via tracer."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        span = tracer.create_span(
            operation_name="test-op",
            service_name="test-service",
            resource_name="test-resource"
        )
        trace_id = span.trace_id.trace_id
        assert trace_id in tracer.active_spans

        tracer.finish_span(span)
        assert trace_id not in tracer.active_spans
        assert span.status == SpanStatus.FINISHED
        assert len(tracer.trace_buffer) >= 1

    def test_create_tracing_agent(self):
        """Test creating tracing agent via tracer."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        agent = tracer.create_tracing_agent(
            name="custom-agent",
            operations=["op1", "op2"],
            critical_operations=["op1"]
        )

        assert agent.name == "custom-agent"
        assert agent.operations == ["op1", "op2"]
        assert agent.critical_operations == ["op1"]
        assert agent.tracing_system == tracer

    def test_register_tracing_agent(self):
        """Test registering custom tracing agent."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        agent_config = {
            "name": "custom-agent",
            "operations": ["op1", "op2"],
            "critical_operations": ["op1"]
        }
        tracer.register_tracing_agent(agent_config)

        assert "custom-agent" in tracer.agent_registry
        agent = tracer.agent_registry["custom-agent"]
        assert agent.name == "custom-agent"

    def test_register_tracing_agent_requires_name(self):
        """Test that agent registration requires name."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        with pytest.raises(ValueError, match="Agent config must include 'name'"):
            tracer.register_tracing_agent({"operations": ["op1"]})

    def test_get_tracing_analytics(self):
        """Test getting tracing analytics."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        # Create some spans
        span1 = tracer.create_span(
            operation_name="op1",
            service_name="test",
            resource_name="test"
        )
        tracer.finish_span(span1)

        analytics = tracer.get_tracing_analytics()
        assert "timestamp" in analytics
        assert "total_spans_created" in analytics
        assert "performance_analytics" in analytics
        assert "agent_registry" in analytics
        assert "export_queue_size" in analytics

    def test_shutdown(self):
        """Test tracer shutdown."""
        config = TracerConfig(enable_background_processors=False)
        tracer = DistributedTracer(config=config)

        tracer.shutdown()
        assert tracer.shutdown_requested is True


# =============================================================================
# Test: Background Processors
# =============================================================================


class TestSpanProcessor:
    """Test SpanProcessor class."""

    def test_processor_initialization(self):
        """Test span processor initialization."""
        trace_buffer = deque()
        export_queue = deque()
        completed_spans = []

        processor = SpanProcessor(
            trace_buffer=trace_buffer,
            export_queue=export_queue,
            completed_spans=completed_spans,
            batch_size=50
        )

        assert processor.name == "SpanProcessor"
        assert processor.batch_size == 50
        assert processor.shutdown_requested is False

    def test_process_spans(self):
        """Test processing spans from buffer."""
        trace_buffer = deque()
        export_queue = deque()
        completed_spans = []

        # Add test spans to buffer
        span_data = {
            "trace_id": "test-123",
            "operation_name": "test-op",
            "end_time": time.time()
        }
        trace_buffer.append(span_data)

        processor = SpanProcessor(
            trace_buffer=trace_buffer,
            export_queue=export_queue,
            completed_spans=completed_spans
        )
        processor.process()

        # Span should be moved to export queue and completed
        assert len(trace_buffer) == 0
        assert len(export_queue) >= 1
        assert len(completed_spans) >= 1

    def test_processor_start_stop(self):
        """Test processor start and shutdown."""
        processor = SpanProcessor(
            trace_buffer=deque(),
            export_queue=deque(),
            completed_spans=[]
        )

        thread = processor.start()
        assert thread.is_alive()

        processor.shutdown()
        time.sleep(0.2)  # Allow thread to stop
        assert processor.shutdown_requested is True


class TestMetricsProcessor:
    """Test MetricsProcessor class."""

    def test_processor_initialization(self):
        """Test metrics processor initialization."""
        performance_analytics = {"request_count": 0}
        completed_spans = []

        processor = MetricsProcessor(
            performance_analytics=performance_analytics,
            completed_spans=completed_spans,
            interval_seconds=1.0
        )

        assert processor.name == "MetricsProcessor"
        assert processor.interval_seconds == 1.0

    def test_process_metrics(self):
        """Test processing metrics from completed spans."""
        performance_analytics = {"request_count": 10}
        completed_spans = [
            {"status": "finished", "duration": 0.5},
            {"status": "finished", "duration": 1.0},
            {"status": "error", "duration": 0.3}
        ]

        processor = MetricsProcessor(
            performance_analytics=performance_analytics,
            completed_spans=completed_spans
        )
        processor.process()

        assert "error_rate" in performance_analytics
        assert "avg_response_time" in performance_analytics
        assert "timestamp" in performance_analytics


class TestExportLoopProcessor:
    """Test ExportLoopProcessor class."""

    def test_processor_initialization(self):
        """Test export processor initialization."""
        export_queue = deque()
        active_spans = {}
        completed_spans = []

        processor = ExportLoopProcessor(
            export_queue=export_queue,
            active_spans=active_spans,
            completed_spans=completed_spans,
            interval_seconds=1.0
        )

        assert processor.name == "ExportProcessor"
        assert processor.interval_seconds == 1.0

    def test_process_with_mock_callback(self):
        """Test processing with mocked export callback."""
        export_queue = deque()
        active_spans = {}
        completed_spans = []

        # Add test span to queue
        span_data = {"trace_id": "test-123", "operation_name": "test"}
        export_queue.append(span_data)

        mock_callback = Mock(return_value=True)
        processor = ExportLoopProcessor(
            export_queue=export_queue,
            active_spans=active_spans,
            completed_spans=completed_spans,
            export_callback=mock_callback
        )
        processor.process()

        # Callback should have been called
        mock_callback.assert_called_once()
        # Span should be marked as exported
        assert len(completed_spans) >= 1


class TestPerformanceAnalyzer:
    """Test PerformanceAnalyzer class."""

    def test_analyzer_initialization(self):
        """Test performance analyzer initialization."""
        performance_analytics = {}
        agent_registry = {}

        analyzer = PerformanceAnalyzer(
            performance_analytics=performance_analytics,
            agent_registry=agent_registry,
            interval_seconds=30.0
        )

        assert analyzer.name == "PerformanceAnalyzer"
        assert analyzer.interval_seconds == 30.0

    def test_analyze_with_agents(self):
        """Test analysis with registered agents."""
        performance_analytics = {}
        test_agent = TracingAgent(name="test", operations=["op1", "op2"])
        agent_registry = {"test": test_agent}

        analyzer = PerformanceAnalyzer(
            performance_analytics=performance_analytics,
            agent_registry=agent_registry
        )
        analyzer.process()

        assert "active_agents" in performance_analytics
        assert "total_registered_operations" in performance_analytics
        assert performance_analytics["active_agents"] == 1
        assert performance_analytics["total_registered_operations"] == 2


# =============================================================================
# Test: Exporters (with mocked network)
# =============================================================================


class TestOTLPExporter:
    """Test OTLPExporter class."""

    def test_exporter_initialization(self):
        """Test OTLP exporter initialization."""
        exporter = OTLPExporter(endpoint="http://localhost:4317")
        assert exporter.config.endpoint == "http://localhost:4317"

    @patch('antigravity.infrastructure.opentelemetry.exporters.base.requests')
    def test_export_spans_success(self, mock_requests):
        """Test successful span export with mocked requests."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_requests.request.return_value = mock_response

        exporter = OTLPExporter(endpoint="http://localhost:4317")
        spans = [{"trace_id": "test-123", "operation_name": "test"}]

        result = exporter.export_spans(spans)
        assert result is True
        mock_requests.request.assert_called_once()

    @patch('antigravity.infrastructure.opentelemetry.exporters.base.requests')
    def test_export_spans_failure(self, mock_requests):
        """Test failed span export with mocked requests."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_requests.request.return_value = mock_response

        exporter = OTLPExporter(endpoint="http://localhost:4317")
        exporter.config.retry_count = 1  # Reduce retries for test
        spans = [{"trace_id": "test-123"}]

        result = exporter.export_spans(spans)
        assert result is False
        assert len(exporter.failed_exports) >= 1

    def test_export_empty_spans(self):
        """Test exporting empty span list."""
        exporter = OTLPExporter(endpoint="http://localhost:4317")
        result = exporter.export_spans([])
        assert result is True

    @patch('antigravity.infrastructure.opentelemetry.exporters.base.requests')
    def test_export_metrics_success(self, mock_requests):
        """Test successful metrics export with mocked requests."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_requests.request.return_value = mock_response

        exporter = OTLPExporter(endpoint="http://localhost:4317")
        metrics = [
            Metric(name="test_metric", value=1.0, unit="count", description="Test")
        ]

        result = exporter.export_metrics(metrics)
        assert result is True


class TestJaegerExporter:
    """Test JaegerExporter class."""

    def test_exporter_initialization(self):
        """Test Jaeger exporter initialization."""
        exporter = JaegerExporter(
            endpoint="http://localhost:14268",
            service_name="test-service"
        )
        assert exporter.config.endpoint == "http://localhost:14268"
        assert exporter.service_name == "test-service"

    @patch('antigravity.infrastructure.opentelemetry.exporters.base.requests')
    def test_export_spans_success(self, mock_requests):
        """Test successful span export with mocked requests."""
        mock_response = Mock()
        mock_response.status_code = 202
        mock_requests.request.return_value = mock_response

        exporter = JaegerExporter(endpoint="http://localhost:14268")
        spans = [
            {
                "trace_id": "test-123456789012345678901234",
                "parent_id": None,
                "operation_name": "test-op",
                "start_time": time.time(),
                "duration": 0.5,
                "tags": {"env": "test"},
                "events": [{"name": "event1", "timestamp": time.time(), "attributes": {}}]
            }
        ]

        result = exporter.export_spans(spans)
        assert result is True

    def test_convert_tags(self):
        """Test tag conversion to Jaeger format."""
        exporter = JaegerExporter()
        tags = {"env": "prod", "version": "1.0"}
        converted = exporter._convert_tags(tags)

        assert len(converted) == 2
        assert converted[0]["key"] in ["env", "version"]
        assert converted[0]["vType"] == "STRING"

    def test_export_metrics_noop(self):
        """Test that metrics export is a no-op for Jaeger."""
        exporter = JaegerExporter()
        metrics = [
            Metric(name="test", value=1.0, unit="count", description="Test")
        ]
        result = exporter.export_metrics(metrics)
        assert result is True  # Always returns True (no-op)


class TestExportProcessor:
    """Test ExportProcessor class."""

    def test_processor_initialization(self):
        """Test export processor initialization."""
        processor = ExportProcessor(
            exporters=[],
            batch_size=50,
            export_interval_seconds=30
        )
        assert processor.batch_size == 50
        assert processor.export_interval_seconds == 30
        assert processor.shutdown_requested is False

    def test_add_span(self):
        """Test adding span to queue."""
        processor = ExportProcessor()
        span_data = {"trace_id": "test-123"}
        processor.add_span(span_data)
        assert len(processor.export_queue) == 1

    @patch('antigravity.infrastructure.opentelemetry.exporters.base.requests')
    def test_process_export_batch(self, mock_requests):
        """Test processing export batch with mocked exporter."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_requests.request.return_value = mock_response

        exporter = OTLPExporter(endpoint="http://localhost:4317")
        processor = ExportProcessor(exporters=[exporter])

        # Add spans
        processor.add_span({"trace_id": "test-1"})
        processor.add_span({"trace_id": "test-2"})

        count = processor.process_export_batch()
        assert count == 2
        assert len(processor.export_queue) == 0

    def test_shutdown(self):
        """Test processor shutdown."""
        processor = ExportProcessor()
        processor.add_span({"trace_id": "test-1"})

        processor.shutdown()
        assert processor.shutdown_requested is True
        # Queue should be flushed
        assert len(processor.export_queue) == 0


# =============================================================================
# Test: Backward Compatibility (Module-level functions)
# =============================================================================


class TestBackwardCompatibility:
    """Test backward compatibility with module-level functions."""

    def test_distributed_tracer_global_instance(self):
        """Test that global distributed_tracer instance exists."""
        from antigravity.infrastructure.opentelemetry import distributed_tracer
        assert distributed_tracer is not None
        assert isinstance(distributed_tracer, DistributedTracer)

    def test_create_span_function(self):
        """Test module-level create_span function."""
        from antigravity.infrastructure.opentelemetry import create_span
        span = create_span(
            operation_name="test-op",
            service_name="test-service",
            resource_name="test-resource"
        )
        assert span is not None
        assert span.operation_name == "test-op"

    def test_trace_request_function(self):
        """Test module-level trace_request function."""
        from antigravity.infrastructure.opentelemetry import trace_request
        span = trace_request(
            request_data={"method": "GET", "url": "/test"},
            service_name="api",
            operation_name="get_test"
        )
        assert span is not None

    def test_trace_ai_operation_function(self):
        """Test module-level trace_ai_operation function."""
        from antigravity.infrastructure.opentelemetry import trace_ai_operation
        span = trace_ai_operation(
            operation_name="inference",
            input_data={"prompt": "test"}
        )
        assert span is not None

    def test_get_tracing_analytics_function(self):
        """Test module-level get_tracing_analytics function."""
        from antigravity.infrastructure.opentelemetry import get_tracing_analytics
        analytics = get_tracing_analytics()
        assert isinstance(analytics, dict)
        assert "timestamp" in analytics

    def test_register_tracing_agent_function(self):
        """Test module-level register_tracing_agent function."""
        from antigravity.infrastructure.opentelemetry import register_tracing_agent
        register_tracing_agent({
            "name": "test-backward-compat-agent",
            "operations": ["op1"]
        })
        # No error means success
