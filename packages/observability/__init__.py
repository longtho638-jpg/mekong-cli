"""
mekong-observability — Langfuse observability layer for Mekong CLI.

Provides dual-write telemetry: Langfuse (remote UI) + JSON on disk (local).
Gracefully degrades to JSON-only when Langfuse is unavailable.
"""

from .langfuse_provider import LangfuseProvider
from .observability_facade import ObservabilityFacade
from .trace_decorator import get_active_trace, set_active_trace, traced

__all__ = [
    "ObservabilityFacade",
    "LangfuseProvider",
    "traced",
    "get_active_trace",
    "set_active_trace",
]
