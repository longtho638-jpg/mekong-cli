"""
OpenTelemetry Distributed Tracer Module
=======================================

Main distributed tracing implementation with OpenTelemetry compatibility.

Features:
- Request correlation IDs across service boundaries
- Span context propagation
- Performance metrics aggregation
- Jaeger/OTLP integration
- Background processors for async export

Bug fixes applied:
- Fixed syntax errors (missing commas, parentheses)
- Fixed malformed dict comprehensions
- Fixed indentation issues in export loop
- Fixed span filter logic (keep recent, not old)
- Removed undefined attribute references
- Fixed agent registry dict comprehension
"""

import time
import logging
import json
import hashlib
import threading
from typing import Dict, Any, List, Optional, Callable
from collections import defaultdict, deque

from .models import SpanKind, SpanStatus, TraceId, Event, Metric
from .span import Span
from .tracing_agent import TracingAgent
from .processors import (
    create_span_processor_loop,
    create_metrics_processor_loop,
    create_export_processor_loop,
)
from .config import (
    TracerConfig,
    DEFAULT_JAEGER_ENDPOINT,
    DEFAULT_OTLP_ENDPOINT,
    DEFAULT_PROMETHEUS_GATEWAY,
    DEFAULT_SERVICE_NAME,
)


logger = logging.getLogger(__name__)


class DistributedTracer:
    """Distributed OpenTelemetry tracing system.

    Provides comprehensive distributed tracing with:
    - Span lifecycle management
    - Background processing for async export
    - Agent-based operation tracking
    - Performance analytics

    Attributes:
        active_spans: Currently active spans by trace ID
        completed_spans: List of completed span data
        trace_buffer: Buffer for incoming trace data
        agent_registry: Registered tracing agents
        performance_analytics: Real-time performance metrics
    """

    def __init__(
        self,
        jaeger_endpoint: str = DEFAULT_JAEGER_ENDPOINT,
        otlp_endpoint: str = DEFAULT_OTLP_ENDPOINT,
        prometheus_gateway: str = DEFAULT_PROMETHEUS_GATEWAY,
        service_name: str = DEFAULT_SERVICE_NAME,
        config: Optional[TracerConfig] = None
    ):
        """Initialize distributed tracer.

        Args:
            jaeger_endpoint: Jaeger collector endpoint URL
            otlp_endpoint: OTLP collector endpoint URL
            prometheus_gateway: Prometheus pushgateway URL
            service_name: Default service name for spans
            config: Optional TracerConfig for advanced settings
        """
        # Store endpoints as instance attributes
        self.jaeger_endpoint = jaeger_endpoint
        self.otlp_endpoint = otlp_endpoint
        self.prometheus_gateway = prometheus_gateway
        self.service_name = service_name
        self.config = config or TracerConfig(
            jaeger_endpoint=jaeger_endpoint,
            otlp_endpoint=otlp_endpoint,
            prometheus_gateway=prometheus_gateway,
            service_name=service_name
        )

        # Core data structures
        self.active_spans: Dict[str, Span] = {}
        self.completed_spans: List[Dict[str, Any]] = []
        self.trace_buffer: deque = deque(maxlen=self.config.trace_buffer_size)
        self.metrics_aggregator: Dict[str, List[Any]] = defaultdict(list)
        self.export_queue: deque = deque(maxlen=self.config.export_queue_size)
        self.agent_registry: Dict[str, Any] = {}

        # Performance analytics
        self.performance_analytics: Dict[str, Any] = {
            "request_count": 0,
            "error_rate": 0.0,
            "avg_response_time": 0.0,
            "service_breakers": 0
        }

        # Thread safety
        self.lock = threading.Lock()
        self.shutdown_requested = False

        # Background processor threads
        self._processor_threads: List[threading.Thread] = []

        # Register default agents
        self._register_default_agents()

        # Start background processors if enabled
        if self.config.enable_background_processors:
            self._start_background_processors()

    def _register_default_agents(self) -> None:
        """Register default tracing agents for common services."""
        # Payment processor agent
        self.agent_registry["payment_processor"] = TracingAgent(
            name="payment_processor",
            operations=["create", "process", "refund", "cancel"],
            critical_operations=["create", "process", "refund"],
            tracing_system=self
        )

        # User service agent
        self.agent_registry["user_service"] = TracingAgent(
            name="user_service",
            operations=["authenticate", "authorize", "profile", "preferences"],
            critical_operations=["authenticate", "authorize"],
            tracing_system=self
        )

        # Queue processor agent
        self.agent_registry["queue_processor"] = TracingAgent(
            name="queue_processor",
            operations=["submit", "complete", "fail", "timeout"],
            critical_operations=["submit", "complete"],
            tracing_system=self
        )

        # AI processor agent
        self.agent_registry["ai_processor"] = TracingAgent(
            name="ai_processor",
            operations=["inference", "optimize", "train"],
            critical_operations=["inference"],
            tracing_system=self
        )

        logger.info(f"Registered {len(self.agent_registry)} tracing agents")

    def _start_background_processors(self) -> None:
        """Start background processors for tracing and analytics.

        Uses factory functions from processors module for proper implementation.
        """
        # Create shutdown flag accessor
        def get_shutdown_flag() -> bool:
            return self.shutdown_requested

        # Span processor loop
        span_processor_loop = create_span_processor_loop(
            trace_buffer=self.trace_buffer,
            export_queue=self.export_queue,
            completed_spans=self.completed_spans,
            shutdown_flag=get_shutdown_flag,
            batch_size=self.config.batch_size
        )

        # Metrics processor loop
        metrics_processor_loop = create_metrics_processor_loop(
            performance_analytics=self.performance_analytics,
            completed_spans=self.completed_spans,
            shutdown_flag=get_shutdown_flag,
            interval_seconds=self.config.metrics_interval_seconds
        )

        # Export processor loop (no callback - will use internal export)
        export_processor_loop = create_export_processor_loop(
            export_queue=self.export_queue,
            active_spans=self.active_spans,
            completed_spans=self.completed_spans,
            export_callback=self._export_span_callback,
            shutdown_flag=get_shutdown_flag,
            interval_seconds=self.config.export_interval_seconds
        )

        # Create and start threads
        processors = [
            ("SpanProcessor", span_processor_loop),
            ("MetricsProcessor", metrics_processor_loop),
            ("ExportProcessor", export_processor_loop),
        ]

        for name, target in processors:
            thread = threading.Thread(
                target=target,
                daemon=True,
                name=name
            )
            thread.start()
            self._processor_threads.append(thread)
            # BUG FIX: Removed extra "] from original code
            self.agent_registry[f"background_{name.lower()}"] = thread
            logger.info(f"Started {name} background processor")

        logger.info(
            f"Started distributed tracing system with "
            f"{len(self.agent_registry)} agents"
        )

    def _export_span_callback(self, span_dict: Dict[str, Any]) -> bool:
        """Callback for exporting a single span to telemetry backend.

        Args:
            span_dict: Span data dictionary to export

        Returns:
            True if export successful, False otherwise
        """
        if not self.jaeger_endpoint:
            return True  # No endpoint configured, skip export

        try:
            # Import requests lazily to avoid import errors
            try:
                import requests
            except ImportError:
                logger.warning("requests module not installed, skipping export")
                return True

            # Convert to OTLP format
            otlp_data = {
                "resourceSpans": [span_dict]
            }

            # Send to Jaeger collector
            response = requests.post(
                f"{self.jaeger_endpoint}",
                json=otlp_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )

            if response.status_code in (200, 201, 202, 204):
                logger.debug(
                    f"Exported span {span_dict.get('trace_id', 'unknown')} "
                    f"to OpenTelemetry"
                )
                return True
            else:
                logger.error(
                    f"Failed to export span to OpenTelemetry: "
                    f"{response.status_code}"
                )
                return False

        except Exception as e:
            logger.error(
                f"Error exporting span "
                f"{span_dict.get('trace_id', 'unknown')}: {e}"
            )
            return False

    def create_span(
        self,
        operation_name: str,
        service_name: str,
        resource_name: str,
        parent_span: Optional[Span] = None,
        tags: Optional[List[str]] = None,  # BUG FIX: Added comma
        attributes: Optional[Dict[str, Any]] = None
    ) -> Span:
        """Create new span for tracing.

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
        # Create trace ID with parent context
        parent_trace_id = None
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
        resource_name: str = "http_request"  # BUG FIX: Added comma
    ) -> Span:
        """Trace HTTP request.

        Args:
            request_data: Dictionary containing request information
            service_name: Name of the service handling the request
            operation_name: Name of the operation
            resource_name: Resource being accessed (default: http_request)

        Returns:
            Span for the request
        """
        span = self.create_span(
            operation_name=operation_name,
            service_name=service_name,
            resource_name=resource_name,
            tags=["http", "request"]
        )

        # Add request event
        # BUG FIX: Fixed missing closing parenthesis
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
        input_data: Dict[str, Any],  # BUG FIX: Moved before default params
        service_name: str = "ai_service",
        model_name: str = "optimization_model",
        output_data: Optional[Any] = None,
        execution_time: float = 0.0
    ) -> Span:
        """Trace AI model operation.

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
        # BUG FIX: Fixed missing closing parentheses on hashlib calls
        if input_data:
            input_json = json.dumps(input_data, sort_keys=True)
            input_hash = hashlib.md5(input_json.encode()).hexdigest()[:8]
            span.add_attribute("input_hash", input_hash)

        if output_data:
            output_json = json.dumps(output_data, sort_keys=True)
            output_hash = hashlib.md5(output_json.encode()).hexdigest()[:8]
            span.add_attribute("output_hash", output_hash)

        return span

    def create_tracing_agent(
        self,
        name: str,
        operations: List[str],
        critical_operations: Optional[List[str]] = None
    ) -> TracingAgent:
        """Create tracing agent with specific operations.

        Args:
            name: Unique agent name
            operations: List of operations the agent handles
            critical_operations: Subset requiring enhanced tracing

        Returns:
            New TracingAgent instance
        """
        return TracingAgent(
            name=name,
            operations=operations,
            critical_operations=critical_operations or [],
            tracing_system=self
        )

    def register_tracing_agent(self, agent_config: Dict[str, Any]) -> None:
        """Register custom tracing agent.

        Args:
            agent_config: Agent configuration dictionary with:
                - name: Agent name (required)
                - operations: List of operations (default: [])
                - critical_operations: Critical ops list (default: [])
        """
        name = agent_config.get("name")
        if not name:
            raise ValueError("Agent config must include 'name'")

        agent = TracingAgent(
            name=name,
            operations=agent_config.get("operations", []),
            critical_operations=agent_config.get("critical_operations", []),
            tracing_system=self
        )

        self.agent_registry[name] = agent
        logger.info(f"Registered custom tracing agent: {name}")

    def get_tracing_analytics(self) -> Dict[str, Any]:
        """Get comprehensive tracing analytics.

        Returns:
            Dictionary containing:
                - timestamp: Current time
                - active_agents: Count of active tracing agents
                - total_spans_created: Total span count
                - total_spans_exported: Exported span count
                - performance_analytics: Performance metrics
                - agent_registry: Agent status summary
                - export_queue_size: Pending exports
        """
        # Count active agents (TracingAgent objects only, not Thread objects)
        active_agents = []
        for agent in self.agent_registry.values():
            if hasattr(agent, "active") and agent.active:
                active_agents.append(agent)

        # Count non-shutdown agents
        non_shutdown_agents = [
            agent for agent in active_agents
            if hasattr(agent, "shutdown_requested") and not agent.shutdown_requested
        ]

        # Count exported spans
        exported_count = sum(
            1 for s in self.completed_spans
            if isinstance(s, dict) and s.get("exported", False)
        )

        # BUG FIX: Fixed malformed dict comprehension
        agent_info = {
            name: agent.name
            for name, agent in self.agent_registry.items()
            if hasattr(agent, "operations")
        }

        return {
            "timestamp": time.time(),
            "active_agents": len(active_agents),
            "total_spans_created": len(self.active_spans) + len(self.completed_spans),
            "total_spans_exported": exported_count,
            "performance_analytics": self.performance_analytics.copy(),
            "agent_registry": {
                "agents": agent_info,
                "active_count": len(non_shutdown_agents),
                "registered_count": len([
                    a for a in self.agent_registry.values()
                    if hasattr(a, "operations")
                ])
            },
            "export_queue_size": len(self.export_queue),
            "recent_errors": []
        }

    def finish_span(
        self,
        span: Span,
        status: SpanStatus = SpanStatus.FINISHED
    ) -> None:
        """Finish a span and queue for export.

        Args:
            span: The span to finish
            status: Final status of the span
        """
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

    def shutdown(self) -> None:
        """Gracefully shutdown distributed tracing system.

        Signals all background processors to stop and waits briefly
        for cleanup.
        """
        logger.info("Initiating distributed tracing system shutdown...")

        self.shutdown_requested = True

        # Shutdown all registered tracing agents
        for name, agent in self.agent_registry.items():
            if hasattr(agent, "shutdown"):
                try:
                    agent.shutdown()
                except Exception as e:
                    logger.error(f"Error shutting down agent {name}: {e}")

        # Wait briefly for processors to finish
        time.sleep(2)

        # BUG FIX: Removed reference to undefined self.redis_client

        logger.info("Distributed tracing system shutdown completed")


__all__ = [
    "DistributedTracer",
]
