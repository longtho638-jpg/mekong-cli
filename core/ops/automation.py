"""
⚙️ Automation Workflows - Streamline Your Agency (Proxy)
==================================================
This file is now a proxy for the modularized version in ./automation_logic/
Please import from core.ops.automation_logic instead.
"""
import warnings

from .automation_logic import Action, ActionType, AutomationEngine, TriggerType, Workflow

# Issue a deprecation warning
warnings.warn(
    "core.ops.automation is deprecated. "
    "Use core.ops.automation_logic instead.",
    DeprecationWarning,
    stacklevel=2
)
