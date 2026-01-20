"""
OpenTelemetry Infrastructure Package
=====================================

Modular OpenTelemetry-compatible distributed tracing components.

This package provides:
- Configuration dataclasses and default endpoints
- Core data models (TraceId, SpanKind, SpanStatus, Event, Metric)
- Span implementation with lifecycle management
- DistributedTracer for comprehensive tracing
- TracingAgent for agent-based operation tracking
- Background processors for async export
- Telemetry export implementations (OTLP, Jaeger)

Backward Compatibility:
    This module provides a global `distributed_tracer` instance and
    convenience functions for backward compatibility with the original
    monolithic opentelemetry.py module.
"""

from typing import Dict, Any, List, Optional

from .config import (
    DEFAULT_JAEGER_ENDPOINT,
    DEFAULT_OTLP_ENDPOINT,
    DEFAULT_PROMETHEUS_GATEWAY,
    DEFAULT_SERVICE_NAME,
    TracerConfig,
    ExporterConfig,
    SamplingConfig,
    AgentConfig,
)

from .models import (
    SpanKind,
    SpanStatus,
    TraceId,
    Event,
    Metric,
)

from .span import Span

# Import from new modular packages
from .exporters import (
    BaseExporter,
    OTLPExporter,
    JaegerExporter,
    ExportProcessor,
    export_spans,
    export_metrics,
)

from .tracing_agent import TracingAgent

from .processors import (
    BaseProcessor,
    SpanProcessor,
    MetricsProcessor,
    ExportLoopProcessor,
    PerformanceAnalyzer,
    create_span_processor_loop,
    create_metrics_processor_loop,
    create_export_processor_loop,
)

from .tracer import DistributedTracer


# -----------------------------------------------------------------------------
# Global Distributed Tracer Instance (Backward Compatibility)
# -----------------------------------------------------------------------------

# Create global tracer instance with default configuration
# Background processors are disabled by default for the global instance
# to avoid unexpected background threads during import
distributed_tracer = DistributedTracer(
    config=TracerConfig(enable_background_processors=False)
)


# -----------------------------------------------------------------------------
# Convenience Functions (Backward Compatibility)
# -----------------------------------------------------------------------------

def create_span(
    operation_name: str,
    service_name: str,
    resource_name: str,
    parent_span: Optional[Span] = None,
    tags: Optional[List[str]] = None,
    attributes: Optional[Dict[str, Any]] = None
) -> Span:
    """Create span for distributed tracing.

    Convenience function that delegates to the global distributed_tracer.

    Args:
        operation_name: Name of the operation being traced
        service_name: Name of the service creating the span
        resource_name: Name of the resource being accessed
        parent_span: Optional parent span for context propagation
        tags: Optional list of tag strings
        attributes: Optional dictionary of span attributes

    Returns:
        New Span instance
    """
    return distributed_tracer.create_span(
        operation_name=operation_name,
        service_name=service_name,
        resource_name=resource_name,
        parent_span=parent_span,
        tags=tags,
        attributes=attributes
    )


def trace_request(
    request_data: Dict[str, Any],
    service_name: str = "api_service",
    operation_name: str = "http_request",
    resource_name: str = "http_request"
) -> Span:
    """Trace HTTP request.

    Convenience function that delegates to the global distributed_tracer.

    Args:
        request_data: Dictionary containing request information
        service_name: Name of the service handling the request
        operation_name: Name of the operation
        resource_name: Resource being accessed

    Returns:
        Span for the request
    """
    return distributed_tracer.trace_request(
        request_data=request_data,
        service_name=service_name,
        operation_name=operation_name,
        resource_name=resource_name
    )


def trace_ai_operation(
    operation_name: str,
    input_data: Dict[str, Any],
    service_name: str = "ai_service",
    model_name: str = "optimization_model",
    output_data: Optional[Any] = None,
    execution_time: float = 0.0
) -> Span:
    """Trace AI operation.

    Convenience function that delegates to the global distributed_tracer.

    Args:
        operation_name: Name of the AI operation
        input_data: Input data for the model
        service_name: AI service name
        model_name: Name of the model being used
        output_data: Optional output data from the model
        execution_time: Execution time in seconds

    Returns:
        Span for the AI operation
    """
    return distributed_tracer.trace_ai_operation(
        operation_name=operation_name,
        input_data=input_data,
        service_name=service_name,
        model_name=model_name,
        output_data=output_data,
        execution_time=execution_time
    )


def get_tracing_analytics() -> Dict[str, Any]:
    """Get comprehensive tracing analytics.

    Convenience function that delegates to the global distributed_tracer.

    Returns:
        Dictionary containing tracing analytics
    """
    return distributed_tracer.get_tracing_analytics()


def register_tracing_agent(agent_config: Dict[str, Any]) -> None:
    """Register custom tracing agent.

    Convenience function that delegates to the global distributed_tracer.

    Args:
        agent_config: Agent configuration dictionary
    """
    distributed_tracer.register_tracing_agent(agent_config)


def shutdown() -> None:
    """Gracefully shutdown distributed tracing system.

    Convenience function that delegates to the global distributed_tracer.
    """
    distributed_tracer.shutdown()


# -----------------------------------------------------------------------------
# Module Exports
# -----------------------------------------------------------------------------

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
    # Global Instance (Backward Compatibility)
    "distributed_tracer",
    # Convenience Functions (Backward Compatibility)
    "create_span",
    "trace_request",
    "trace_ai_operation",
    "get_tracing_analytics",
    "register_tracing_agent",
    "shutdown",
]
