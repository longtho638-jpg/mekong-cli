"""
OpenTelemetry Distributed Tracer Core Module
=============================================

Main DistributedTracer class with OpenTelemetry compatibility.
Uses mixins for modular functionality.

Features:
- Request correlation IDs across service boundaries
- Span context propagation
- Performance metrics aggregation
- Jaeger/OTLP integration
- Background processors for async export
"""

import logging
import threading
import time
from collections import defaultdict, deque
from typing import Any, Dict, List, Optional

from ..config import (
    DEFAULT_JAEGER_ENDPOINT,
    DEFAULT_OTLP_ENDPOINT,
    DEFAULT_PROMETHEUS_GATEWAY,
    DEFAULT_SERVICE_NAME,
    TracerConfig,
)
from ..models import SpanStatus
from ..span import Span
from .agent_manager import AgentManagerMixin
from .export_handler import ExportHandlerMixin
from .span_operations import SpanOperationsMixin

logger = logging.getLogger(__name__)


class DistributedTracer(
    AgentManagerMixin,
    SpanOperationsMixin,
    ExportHandlerMixin
):
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

        # Get agent info
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

        logger.info("Distributed tracing system shutdown completed")


__all__ = ["DistributedTracer"]
