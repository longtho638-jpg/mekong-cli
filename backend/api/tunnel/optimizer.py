"""
Tunnel Optimizer (Proxy).
======================
This file is now a proxy for the modularized version in ./opt_logic/
Please import from backend.api.tunnel.opt_logic instead.
"""

import warnings

from .opt_logic import TunnelOptimizer

# Issue a deprecation warning
warnings.warn(
    "backend.api.tunnel.optimizer is deprecated. Use backend.api.tunnel.opt_logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
