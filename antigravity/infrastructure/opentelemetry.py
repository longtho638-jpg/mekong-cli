"""
OpenTelemetry Facade Module (DEPRECATED)
=========================================

This file is deprecated. The OpenTelemetry implementation has been
modularized into the `antigravity.infrastructure.opentelemetry` package.

Python will prefer the package (opentelemetry/) over this file when
importing `antigravity.infrastructure.opentelemetry`.

All imports should work transparently via the package's __init__.py.

If you need to import directly from this file (not recommended), the
imports below re-export everything from the package for backward
compatibility.
"""

# Re-export everything from the package
# Note: This file is typically not loaded due to Python's package preference
from antigravity.infrastructure.opentelemetry import (
    # Config
    DEFAULT_JAEGER_ENDPOINT,
    DEFAULT_OTLP_ENDPOINT,
    DEFAULT_PROMETHEUS_GATEWAY,
    DEFAULT_SERVICE_NAME,
    TracerConfig,
    ExporterConfig,
    SamplingConfig,
    AgentConfig,
    # Models
    SpanKind,
    SpanStatus,
    TraceId,
    Event,
    Metric,
    # Span
    Span,
    # Exporters
    BaseExporter,
    OTLPExporter,
    JaegerExporter,
    ExportProcessor,
    export_spans,
    export_metrics,
    # Tracing Agent
    TracingAgent,
    # Processors
    BaseProcessor,
    SpanProcessor,
    MetricsProcessor,
    ExportLoopProcessor,
    PerformanceAnalyzer,
    create_span_processor_loop,
    create_metrics_processor_loop,
    create_export_processor_loop,
    # Tracer
    DistributedTracer,
    # Global Instance
    distributed_tracer,
    # Convenience Functions
    create_span,
    trace_request,
    trace_ai_operation,
    get_tracing_analytics,
    register_tracing_agent,
    shutdown,
)

__all__ = [
    # Config
    "DEFAULT_JAEGER_ENDPOINT",
    "DEFAULT_OTLP_ENDPOINT",
    "DEFAULT_PROMETHEUS_GATEWAY",
    "DEFAULT_SERVICE_NAME",
    "TracerConfig",
    "ExporterConfig",
    "SamplingConfig",
    "AgentConfig",
    # Models
    "SpanKind",
    "SpanStatus",
    "TraceId",
    "Event",
    "Metric",
    # Span
    "Span",
    # Exporters
    "BaseExporter",
    "OTLPExporter",
    "JaegerExporter",
    "ExportProcessor",
    "export_spans",
    "export_metrics",
    # Tracing Agent
    "TracingAgent",
    # Processors
    "BaseProcessor",
    "SpanProcessor",
    "MetricsProcessor",
    "ExportLoopProcessor",
    "PerformanceAnalyzer",
    "create_span_processor_loop",
    "create_metrics_processor_loop",
    "create_export_processor_loop",
    # Tracer
    "DistributedTracer",
    # Global Instance
    "distributed_tracer",
    # Convenience Functions
    "create_span",
    "trace_request",
    "trace_ai_operation",
    "get_tracing_analytics",
    "register_tracing_agent",
    "shutdown",
]
