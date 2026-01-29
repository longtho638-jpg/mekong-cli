"""
Budget Manager Agent (Proxy).
===========================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.finops.logic instead.
"""

import warnings

from .logic import Alert, AlertLevel, Budget, BudgetManagerAgent

# Issue a deprecation warning
warnings.warn(
    "backend.agents.finops.budget_manager is deprecated. Use backend.agents.finops.logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
