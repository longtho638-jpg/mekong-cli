"""
OpenTelemetry Processors Package
================================

Background processor implementations for distributed tracing.

Processors:
- BaseProcessor: Abstract base class for processors
- SpanProcessor: Buffers and processes spans for export
- MetricsProcessor: Aggregates and calculates performance metrics
- ExportLoopProcessor: Handles batch export to telemetry backends
- PerformanceAnalyzer: Real-time performance analytics
"""

from .base import BaseProcessor
from .span_processor import SpanProcessor, create_span_processor_loop
from .metrics_processor import MetricsProcessor, create_metrics_processor_loop
from .export_processor import (
    ExportLoopProcessor,
    PerformanceAnalyzer,
    create_export_processor_loop,
)

__all__ = [
    "BaseProcessor",
    "SpanProcessor",
    "MetricsProcessor",
    "ExportLoopProcessor",
    "PerformanceAnalyzer",
    "create_span_processor_loop",
    "create_metrics_processor_loop",
    "create_export_processor_loop",
]
