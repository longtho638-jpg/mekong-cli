"""
OpenTelemetry Tracing Agent Module (Proxy)
==================================
This file is now a proxy for the modularized version in ./agent_logic/
Please import from antigravity.infrastructure.opentelemetry.agent_logic instead.
"""
import warnings

from .agent_logic.stats import TracingAgent

# Issue a deprecation warning
warnings.warn(
    "antigravity.infrastructure.opentelemetry.tracing_agent is deprecated. "
    "Use antigravity.infrastructure.opentelemetry.agent_logic instead.",
    DeprecationWarning,
    stacklevel=2
)
