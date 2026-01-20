"""
OpenTelemetry Infrastructure Package
"""
from .config import (
    DEFAULT_JAEGER_ENDPOINT,
    DEFAULT_OTLP_ENDPOINT,
    DEFAULT_PROMETHEUS_GATEWAY,
    DEFAULT_SERVICE_NAME,
    AgentConfig,
    ExporterConfig,
    SamplingConfig,
    TracerConfig,
)
from .exporters import (
    BaseExporter,
    ExportProcessor,
    JaegerExporter,
    OTLPExporter,
    export_metrics,
    export_spans,
)
from .facade.functions import (
    create_span,
    distributed_tracer,
    get_tracing_analytics,
    register_tracing_agent,
    shutdown,
    trace_ai_operation,
    trace_request,
)
from .models import Event, Metric, SpanKind, SpanStatus, TraceId
from .processors import (
    BaseProcessor,
    ExportLoopProcessor,
    MetricsProcessor,
    PerformanceAnalyzer,
    SpanProcessor,
    create_export_processor_loop,
    create_metrics_processor_loop,
    create_span_processor_loop,
)
from .span import Span
from .tracer import DistributedTracer
from .tracing_agent import TracingAgent

__all__ = [
    "DEFAULT_JAEGER_ENDPOINT", "DEFAULT_OTLP_ENDPOINT", "DEFAULT_PROMETHEUS_GATEWAY", "DEFAULT_SERVICE_NAME",
    "TracerConfig", "ExporterConfig", "SamplingConfig", "AgentConfig",
    "SpanKind", "SpanStatus", "TraceId", "Event", "Metric", "Span",
    "BaseExporter", "OTLPExporter", "JaegerExporter", "ExportProcessor", "export_spans", "export_metrics",
    "TracingAgent", "BaseProcessor", "SpanProcessor", "MetricsProcessor", "ExportLoopProcessor", "PerformanceAnalyzer",
    "create_span_processor_loop", "create_metrics_processor_loop", "create_export_processor_loop",
    "DistributedTracer", "distributed_tracer", "create_span", "trace_request", "trace_ai_operation",
    "get_tracing_analytics", "register_tracing_agent", "shutdown",
]
