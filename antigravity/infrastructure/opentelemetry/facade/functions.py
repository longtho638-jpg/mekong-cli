"""
Tracing convenience functions for OpenTelemetry.
"""
from typing import Any, Dict, List, Optional

from ..config import TracerConfig
from ..models import Span
from ..tracer import DistributedTracer

# Create global tracer instance
distributed_tracer = DistributedTracer(
    config=TracerConfig(enable_background_processors=False)
)

def create_span(
    operation_name: str,
    service_name: str,
    resource_name: str,
    parent_span: Optional[Span] = None,
    tags: Optional[List[str]] = None,
    attributes: Optional[Dict[str, Any]] = None
) -> Span:
    """Create span for distributed tracing."""
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
    """Trace HTTP request."""
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
    """Trace AI operation."""
    return distributed_tracer.trace_ai_operation(
        operation_name=operation_name,
        input_data=input_data,
        service_name=service_name,
        model_name=model_name,
        output_data=output_data,
        execution_time=execution_time
    )

def get_tracing_analytics() -> Dict[str, Any]:
    """Get comprehensive tracing analytics."""
    return distributed_tracer.get_tracing_analytics()

def register_tracing_agent(agent_config: Dict[str, Any]) -> None:
    """Register custom tracing agent."""
    distributed_tracer.register_tracing_agent(agent_config)

def shutdown() -> None:
    """Gracefully shutdown distributed tracing system."""
    distributed_tracer.shutdown()
