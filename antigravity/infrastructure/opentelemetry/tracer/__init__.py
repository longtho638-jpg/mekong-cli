"""
OpenTelemetry Tracer Package
============================

Modular distributed tracer implementation.
Re-exports DistributedTracer for backward compatibility.
"""

from .core import DistributedTracer
from .agent_manager import AgentManagerMixin
from .span_operations import SpanOperationsMixin
from .export_handler import ExportHandlerMixin

__all__ = [
    "DistributedTracer",
    "AgentManagerMixin",
    "SpanOperationsMixin",
    "ExportHandlerMixin",
]
