"""
OpenTelemetry Configuration Module
==================================

Default endpoints and configuration dataclasses for distributed tracing.
"""

from dataclasses import dataclass, field
from typing import Optional


# Default Endpoints
DEFAULT_JAEGER_ENDPOINT = "http://localhost:14268/api/traces"
DEFAULT_OTLP_ENDPOINT = "http://localhost:4317"
DEFAULT_PROMETHEUS_GATEWAY = "http://localhost:9090"
DEFAULT_SERVICE_NAME = "mekong-cli"


@dataclass
class TracerConfig:
    """Configuration for distributed tracer."""

    jaeger_endpoint: str = DEFAULT_JAEGER_ENDPOINT
    otlp_endpoint: str = DEFAULT_OTLP_ENDPOINT
    prometheus_gateway: str = DEFAULT_PROMETHEUS_GATEWAY
    service_name: str = DEFAULT_SERVICE_NAME

    # Buffer settings
    trace_buffer_size: int = 10000
    export_queue_size: int = 1000
    batch_size: int = 100

    # Timing settings
    metrics_interval_seconds: int = 30
    export_interval_seconds: int = 60
    span_retention_seconds: int = 300  # 5 minutes for active spans
    completed_span_retention_seconds: int = 3600  # 1 hour for completed spans

    # Feature flags
    enable_background_processors: bool = True
    enable_auto_export: bool = True


@dataclass
class ExporterConfig:
    """Configuration for telemetry exporters."""

    endpoint: str
    timeout_seconds: int = 10
    headers: dict = field(default_factory=lambda: {"Content-Type": "application/json"})
    retry_count: int = 3
    retry_delay_seconds: float = 1.0


@dataclass
class SamplingConfig:
    """Configuration for trace sampling."""

    sample_rate: float = 1.0  # 1.0 = sample all, 0.5 = sample 50%
    always_sample_errors: bool = True
    always_sample_critical: bool = True


@dataclass
class AgentConfig:
    """Configuration for tracing agent registration."""

    name: str
    operations: list = field(default_factory=list)
    critical_operations: list = field(default_factory=list)
    enabled: bool = True


__all__ = [
    "DEFAULT_JAEGER_ENDPOINT",
    "DEFAULT_OTLP_ENDPOINT",
    "DEFAULT_PROMETHEUS_GATEWAY",
    "DEFAULT_SERVICE_NAME",
    "TracerConfig",
    "ExporterConfig",
    "SamplingConfig",
    "AgentConfig",
]
