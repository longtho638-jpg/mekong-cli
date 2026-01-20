"""
Command Registry - Data Definitions (Proxy)
===========================================

This file now serves as a proxy for the modularized registry store.
Please import from .store instead.
"""
import warnings

from .store import COMMAND_REGISTRY, SHORTCUTS

# Issue a deprecation warning
warnings.warn(
    "antigravity.core.registry.commands is deprecated. "
    "Use antigravity.core.registry.store instead.",
    DeprecationWarning,
    stacklevel=2
)
