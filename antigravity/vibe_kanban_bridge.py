"""
Vibe Kanban Bridge - AgencyOS Integration (Proxy)
=========================================
This file is now a proxy for the modularized version in ./bridge/
Please import from antigravity.bridge instead.
"""
import warnings

from .bridge import AgentOrchestrator, TaskModel, VibeBoardClient

# Issue a deprecation warning
warnings.warn(
    "antigravity.vibe_kanban_bridge is deprecated. "
    "Use antigravity.bridge package instead.",
    DeprecationWarning,
    stacklevel=2
)

__all__ = ['VibeBoardClient', 'TaskModel', 'AgentOrchestrator']
