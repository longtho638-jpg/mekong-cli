"""
OpenTelemetry Tracer Package
============================

Modular distributed tracer implementation.
Re-exports DistributedTracer for backward compatibility.
"""

from .agent_manager import AgentManagerMixin
from .core import DistributedTracer
from .export_handler import ExportHandlerMixin
from .span_operations import SpanOperationsMixin

__all__ = [
    "DistributedTracer",
    "AgentManagerMixin",
    "SpanOperationsMixin",
    "ExportHandlerMixin",
]
