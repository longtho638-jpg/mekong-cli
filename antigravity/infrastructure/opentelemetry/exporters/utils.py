"""
OpenTelemetry Export Utilities Module
=====================================

Convenience functions for direct export.
"""

import logging
from typing import Any, Dict, List

from ..config import DEFAULT_OTLP_ENDPOINT
from ..models import Metric
from .jaeger import JaegerExporter
from .otlp import OTLPExporter

logger = logging.getLogger(__name__)


def export_spans(
    spans: List[Dict[str, Any]],
    endpoint: str = DEFAULT_OTLP_ENDPOINT,
    exporter_type: str = "otlp"
) -> bool:
    """Export spans to telemetry backend.

    Args:
        spans: List of span dictionaries
        endpoint: Backend endpoint URL
        exporter_type: Type of exporter ("otlp" or "jaeger")

    Returns:
        True if export successful
    """
    if exporter_type == "jaeger":
        exporter = JaegerExporter(endpoint=endpoint)
    else:
        exporter = OTLPExporter(endpoint=endpoint)

    return exporter.export_spans(spans)


def export_metrics(
    metrics: List[Metric],
    endpoint: str = DEFAULT_OTLP_ENDPOINT
) -> bool:
    """Export metrics to telemetry backend.

    Args:
        metrics: List of metrics
        endpoint: Backend endpoint URL

    Returns:
        True if export successful
    """
    exporter = OTLPExporter(endpoint=endpoint)
    return exporter.export_metrics(metrics)


__all__ = ["export_spans", "export_metrics"]
