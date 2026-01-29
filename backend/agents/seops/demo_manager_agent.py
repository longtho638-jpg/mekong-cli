"""
Demo Manager Agent - Product Demo Scheduling (Proxy)
==============================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.seops.logic instead.
"""

import warnings

from .logic import Demo, DemoManagerAgent, DemoOutcome, DemoType

# Issue a deprecation warning
warnings.warn(
    "backend.agents.seops.demo_manager_agent is deprecated. "
    "Use backend.agents.seops.logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
