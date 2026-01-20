"""
Network Operations (Proxy)
==================

This file is now a proxy for the modularized version in ./network_opt/
Please import from antigravity.core.ops.network_opt instead.
"""
import warnings

from .network_opt import NetworkOptimizer

# Issue a deprecation warning
warnings.warn(
    "core.ops.network is deprecated. "
    "Use core.ops.network_opt instead.",
    DeprecationWarning,
    stacklevel=2
)
