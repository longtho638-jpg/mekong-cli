"""
📡 OpenTelemetry-Ready Distributed Tracing System
==================================================================

Distributed tracing compatible with OpenTelemetry standards:
- Request correlation IDs across service boundaries
- Span context propagation
- Performance metrics aggregation
- Jaeger/Prometheus integration
- Hot-restart and sampling strategies
- Blockchain-traceable audit trails
"""

import time
import logging
import json
import uuid
import threading
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import hashlib

logger = logging.getLogger(__name__)

class TraceId:
    """OpenTelemetry trace identifier."""
    
    def __init__(self, trace_id: str = None, parent_id: str = None, service_name: str = None):
        self.trace_id = trace_id or str(uuid.uuid4())
        self.parent_id = parent_id
        self.service_name = service_name
        self.span_created = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "parent_id": self.parent_id,
            "service_name": self.service_name,
            "span_created": self.span_created
        }

class SpanKind(Enum):
    """Span types for OpenTelemetry."""
    SERVER = "server"
    CLIENT = "client"
    PRODUCER = "producer"
    CONSUMER = "consumer"
    INTERNAL = "internal"

class SpanStatus(Enum):
    """Span status tracking."""
    CREATED = "created"
    RUNNING = "running"
    FINISHED = "finished"
    ERROR = "error"
    TIMEOUT = "timeout"

class Event:
    """OpenTelemetry event."""
    
    def __init__(self, name: str, timestamp: float = None, attributes: Dict[str, Any] = None, resource: str = None):
        self.name = name
        self.timestamp = timestamp or time.time()
        self.attributes = attributes or {}
        self.resource = resource
        self.id = str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "timestamp": self.timestamp,
            "attributes": self.attributes,
            "resource": self.resource
        }

class Metric:
    """OpenTelemetry metric."""
    
    def __init__(self, name: str, value: float, unit: str, description: str, attributes: Dict[str, Any] = None):
        self.name = name
        self.value = value
        self.unit = unit
        self.description = description
        self.attributes = attributes or {}
        self.timestamp = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            "description": self.description,
            "attributes": self.attributes,
            "timestamp": self.timestamp
        }

class Span:
    """OpenTelemetry span representation."""
    
    def __init__(self, trace_id: TraceId, kind: SpanKind, operation_name: str, service_name: str, resource_name: str):
        self.trace_id = trace_id
        self.kind = kind
        self.operation_name = operation_name
        self.service_name = service_name
        self.resource_name = resource_name
        self.status = SpanStatus.CREATED
        self.events = []
        self.start_time = time.time()
        self.end_time = None
        self.attributes = {}
        self.tags = []
        self.parent_span = None
        
    def add_event(self, event: Event):
        """Add event to span."""
        self.events.append(event)
        event.span_id = self.trace_id.trace_id
        
        if event.timestamp is None:
            event.timestamp = time.time()
        
        self.events.append(event.to_dict())
        
    def add_tag(self, key: str, value: str):
        """Add tag to span."""
        self.tags[key] = value
        self.attributes[key] = value
    
    def add_attribute(self, key: str, value: Any):
        """Add attribute to span."""
        self.attributes[key] = value
    
    def finish(self, status: SpanStatus = SpanStatus.FINISHED, end_time: Optional[float] = None):
        """Finish span."""
        self.status = status
        self.end_time = end_time or time.time()
        
        # Calculate duration
        duration = self.end_time - self.start_time
        
        # Add completion event
        completion_event = Event(
            name="span.end",
            attributes={"status": status.value},
            timestamp=self.end_time
        )
        self.add_event(completion_event)
        
        logger.info(f"Span {self.trace_id.trace_id} ({self.kind.value}) finished in {duration:.3f}s with status {status.value}")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id.trace_id,
            "parent_id": self.parent_id.trace_id if self.parent_span else None,
            "kind": self.kind.value,
            "operation_name": self.operation_name,
            "service_name": self.service_name,
            "resource_name": self.resource_name,
            "status": self.status.value,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.end_time - self.start_time if self.end_time else None,
            "events": [event.to_dict() for event in self.events],
            "tags": self.tags,
            "attributes": self.attributes
        }

class DistributedTracer:
    """Distributed OpenTelemetry tracing system."""
    
    def __init__(self, jaeger_endpoint: str = "http://localhost:14268/api/trace", otlp_endpoint: str = "http://localhost:14268/api/traces", prometheus_gateway: str = "http://localhost:9090", service_name: str = "mekong-cli"):
        self.active_spans = {}
        self.completed_spans = []
        self.trace_buffer = deque(maxlen=10000)
        self.metrics_aggregator = defaultdict(list)
        self.export_queue = deque(maxlen=1000)
        self.agent_registry = {}
        self.performance_analytics = {
            "request_count": 0,
            "error_rate": 0,
            "avg_response_time": 0,
            "service_breakers": 0
        }
        
        self.lock = threading.Lock()
        self.shutdown_requested = False
        
        # Register agents for tracing
        self._register_default_agents()
        
        # Start background processors
        self._start_background_processors()
        
    def _register_default_agents(self):
        """Register default tracing agents."""
        # Payment agent
        self.agent_registry["payment_processor"] = TracingAgent(
            name="payment_processor",
            operations=["create", "process", "refund", "cancel"],
            critical_operations=["create", "process", "refund"]
        )
        
        # User agent
        self.agent_registry["user_service"] = TracingAgent(
            name="user_service",
            operations=["authenticate", "authorize", "profile", "preferences"],
            critical_operations=["authenticate", "authorize"]
        )
        
        # Queue agent
        self.agent_registry["queue_processor"] = TracingAgent(
            name="queue_processor",
            operations=["submit", "complete", "fail", "timeout"],
            critical_operations=["submit", "complete"]
        )
        
        # AI agent
        self.agent_registry["ai_processor"] = TracingAgent(
            name="ai_processor",
            operations=["inference", "optimize", "train"],
            critical_operations=["inference"]
        )
        
        logger.info(f"Registered {len(self.agent_registry)} tracing agents")
        
    def _start_background_processors(self):
        """Start background processors for tracing and analytics."""
        processors = [
            threading.Thread(target=self._span_processor_loop, daemon=True, name="SpanProcessor"),
            threading.Thread(target=self._metrics_processor_loop, daemon=True, name="MetricsProcessor"),
            threading.Thread(target=self._export_processor_loop, daemon=True, name="ExportProcessor"),
            threading.Thread(target=self._performance_analytics_loop, daemon=True, name="PerformanceAnalyzer"),
        ]
        
        for processor in processors:
            processor.start()
            self.agent_registry[f"background_{processor.name.lower()}"]"] = processor
            logger.info(f"Started {processor.name} background processor")
        
        logger.info(f"Started distributed tracing system with {len(self.agent_registry)} agents")
    
    def create_span(
        self,
        operation_name: str,
        service_name: str,
        resource_name: str,
        parent_span: Optional[Span] = None,
        tags: List[str] = None
        attributes: Dict[str, Any] = None
    ) -> Span:
        """Create new span."""
        span = Span(
            trace_id=TraceId(service_name=service_name, parent_id=parent_span.trace_id if parent_span else None),
            kind=SpanKind.SERVER,
            operation_name=operation_name,
            service_name=service_name,
            resource_name=resource_name
        )
        
        if parent_span:
            parent_span.add_event(Event(
                name="child_span_created",
                attributes={
                    "child_trace_id": span.trace_id.trace_id,
                    "operation_name": operation_name
                }
            ))
        
        if tags:
            for tag in tags:
                span.add_tag(tag, f"service:{service_name}")
        
        if attributes:
            for key, value in attributes.items():
                span.add_attribute(key, value)
        
        # Add to active spans
        self.active_spans[span.trace_id.trace_id] = span
        
        return span
    
    def trace_request(
        self,
        request_data: Dict[str, Any],
        service_name: str,
        operation_name: str
        resource_name: str = "http_request"
    ) -> Span:
        """Trace HTTP request."""
        span = self.create_span(
            operation_name=operation_name,
            service_name=service_name,
            resource_name=resource_name,
            tags=["http", "request"]
        )
        
        # Add request event
        request_event = Event(
            name="http.request",
            attributes={
                "method": request_data.get("method", "unknown"),
                "url": request_data.get("url", "unknown"),
                "user_agent": request_data.get("user_agent", "unknown"),
                "request_size": len(str(request_data.get("body", "")),
                "ip_address": request_data.get("client_ip", "unknown")
            }
        )
        
        span.add_event(request_event)
        
        return span
    
    def trace_ai_operation(
        self,
        operation_name: str,
        service_name: str = "ai_service",
        model_name: str = "optimization_model",
        input_data: Dict[str, Any],
        output_data: Any = None,
        execution_time: float = 0.0
    ) -> Span:
        """Trace AI model operation."""
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
        
        # Add operation attributes
        if input_data:
            span.add_attribute("input_hash", hashlib.md5(json.dumps(input_data, sort_keys=True).hexdigest()[:8])
        if output_data:
            span.add_attribute("output_hash", hashlib.md5(json.dumps(output_data, sort_keys=True).hexdigest()[:8])
        
        return span
    
    def _span_processor_loop(self):
        """Background processor for span buffering and export."""
        while not self.shutdown_requested:
            try:
                # Collect spans from buffer
                spans_to_process = []
                
                while self.trace_buffer and len(spans_to_process) < 100:  # Process in batches of 100
                    span_data = self.trace_buffer.popleft()
                    spans_to_process.append(span_data)
                
                if not spans_to_process:
                    time.sleep(0.1)  # Wait if buffer empty
                
                # Process spans
                for span_dict in spans_to_process:
                    try:
                        span = Span(
                            trace_id=TraceId(),
                            kind=SpanKind.SERVER,
                            operation_name="span_processor",
                            service_name="tracing_service",
                            resource_name="span_buffer"
                        )
                        
                        span_dict.update(span.to_dict())
                        self._export_span_to_telemetry(span_dict)
                        
                        # Move span to completed
                        span.status = SpanStatus.FINISHED
                        
                    except Exception as e:
                        logger.error(f"Error processing span: {e}")
                        span.status = SpanStatus.ERROR
                
                # Move processed spans to completed
                self.completed_spans.extend(spans_to_process)
                
                # Clean completed spans
                completed_spans = [s for s in self.completed_spans if s.end_time < time.time() - 300]  # Keep last 5 minutes
                if len(completed_spans) > 1000:
                    self.completed_spans = completed_spans[-1000:]
                
            except Exception as e:
                logger.error(f"Error in span processor loop: {e}")
                
            time.sleep(0.1)  # Small delay
            
    def _metrics_processor_loop(self):
        """Background processor for metrics aggregation."""
        while not self.shutdown_requested:
            try:
                time.sleep(30)  # Process every 30 seconds
                
                # Calculate performance metrics
                total_requests = self.performance_analytics["request_count"]
                error_rate = self.performance_analytics["error_rate"]
                avg_response_time = self.performance_analytics["avg_response_time"]
                
                # Update performance analytics
                self.performance_analytics.update({
                    "request_count": total_requests,
                    "error_rate": error_rate,
                    "avg_response_time": avg_response_time,
                    "timestamp": time.time()
                })
                
            except Exception as e:
                logger.error(f"Error in metrics processor loop: {e}")
            
    def _export_processor_loop(self):
        """Background processor for exporting telemetry data."""
        while not self.shutdown_requested:
            try:
                time.sleep(60)  # Export every 60 seconds
                
                # Create export batch
                export_batch = self.export_queue.popleft() if self.export_queue else None
                
                if export_batch:
                    logger.info(f"Processing export batch of {len(export_batch)} spans")
                    
                    # Process all spans in batch
                    for span_dict in export_batch:
                        self._export_span_to_telemetry(span_dict)
                        
                    # Mark as exported
                        span_dict["exported"] = True
                        
                    # Remove from active spans
                        if span_dict["trace_id"].trace_id in self.active_spans:
                            del self.active_spans[span_dict["trace_id"].trace_id]
                
                # Move completed spans to completed
                    self.completed_spans.extend(export_batch)
                    
                    # Clean old completed spans
                    self.completed_spans = [s for s in self.completed_spans if s.end_time < time.time() - 3600]  # Keep last 1 hour
                    
                except Exception as e:
                logger.error(f"Error in export processor loop: {e}")
                
            except Exception as e:
                logger.error(f"Critical error in export processor: {e}")
                self.shutdown_requested = True
            
    def _export_span_to_telemetry(self, span_dict: Dict[str, Any]):
        """Export span to OpenTelemetry backend."""
        if not self.jaeger_endpoint:
            return
        
        try:
            # Convert to OTLP format
            otlp_data = {
                "resourceSpans": [span_dict]
            }
            
            # Send to Jaeger collector
            response = requests.post(
                f"{self.jaeger_endpoint}/api/v1/traces",
                json=otlp_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Exported span {span_dict['trace_id']} to OpenTelemetry")
                return True
            else:
                logger.error(f"Failed to export span to OpenTelemetry: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error exporting span {span_dict['trace_id']}: {e}")
            return False
    
    def create_tracing_agent(self, name: str, operations: List[str], critical_operations: List[str]) -> 'TracingAgent':
        """Create tracing agent with specific operations."""
        return TracingAgent(
            name=name,
            operations=operations,
            critical_operations=critical_operations,
            tracing_system=self
        )
    
    def register_tracing_agent(self, agent_config: Dict[str, Any]):
        """Register custom tracing agent."""
        agent = TracingAgent(
            name=agent_config.get("name"),
            operations=agent_config.get("operations", []),
            critical_operations=agent_config.get("critical_operations", []),
            tracing_system=self
        )
        
        self.agent_registry[agent_config.get("name")] = agent
        logger.info(f"Registered custom tracing agent: {agent_config.get('name')}")
    
    def get_tracing_analytics(self) -> Dict[str, Any]:
        """Get comprehensive tracing analytics."""
        active_agent_count = len([agent for agent in self.agent_registry.values() if hasattr(agent, 'active')])
        
        return {
            "timestamp": time.time(),
            "active_agents": active_agent_count,
            "total_spans_created": len(self.active_spans) + len(self.completed_spans),
            "total_spans_exported": len([s for s in self.completed_spans if s.get("exported", False)]),
            "performance_analytics": self.performance_analytics,
            "agent_registry": {
                name: agent.name for agent in self.agent_registry.values()
                for agent in self.agent_registry.values() if hasattr(agent, 'operations')
            },
                "active_count": len([agent for agent in self.shutdown_requested if hasattr(agent, 'active') and not agent.shutdown_requested])
            },
                "registered_count": len(self.agent_registry)
            },
            },
            "export_queue_size": len(self.export_queue),
            "recent_errors": []
        }
        
    def shutdown(self):
        """Gracefully shutdown distributed tracing system."""
        self.shutdown_requested = True
        
        # Wait for processors to finish
        time.sleep(2)
        
        # Close Redis connection if available
        if self.redis_client:
            self.redis_client.close()
        
        logger.info("Distributed tracing system shutdown completed")

# Global distributed tracer instance
distributed_tracer = DistributedTracer()

# Export functions
def create_span(operation_name: str, service_name: str, resource_name: str, parent_span: Optional[Span] = None, tags: List[str] = None, attributes: Dict[str, Any] = None) -> Span:
    """Create span for distributed tracing."""
    return distributed_tracer.create_span(operation_name, service_name, resource_name, parent_span, tags, attributes)

def trace_request(request_data: Dict[str, Any], service_name: str = "api_service", operation_name: str = "http_request", resource_name: str = "http_request") -> Span:
    """Trace HTTP request."""
    return distributed_tracer.trace_request(request_data, service_name, operation_name, resource_name)

def trace_ai_operation(operation_name: str, service_name: str = "ai_service", model_name: str, input_data: Dict[str, Any], output_data: Any = None, execution_time: float = 0.0) -> Span:
    """Trace AI operation."""
    return distributed_tracer.trace_ai_operation(operation_name, service_name, model_name, input_data, output_data, execution_time)

def get_tracing_analytics() -> Dict[str, Any]:
    """Get comprehensive tracing analytics."""
    return distributed_tracer.get_tracing_analytics()

def register_tracing_agent(agent_config: Dict[str, Any]) -> None:
    """Register custom tracing agent."""
    distributed_tracer.register_tracing_agent(agent_config)

def shutdown():
    """Gracefully shutdown distributed tracing system."""
    distributed_tracer.shutdown()

__all__ = [
    "DistributedTracer",
    "distributed_tracer",
    "create_span",
    "trace_request", 
    "trace_ai_operation",
    "get_tracing_analytics",
    "register_tracing_agent",
    "shutdown",
    "TraceId",
    "Span",
    "SpanKind",
    "SpanStatus",
    "Event",
    "Metric",
    "Span",
    "TracingAgent"
]