"""
Health Score Agent - User Health & Churn Prediction (Proxy)
======================================================
This file is now a proxy for the modularized version in ./logic/
Please import from backend.agents.csops.logic instead.
"""

import warnings

from .logic import HealthScoreAgent, RiskLevel, UserHealth

# Issue a deprecation warning
warnings.warn(
    "backend.agents.csops.health_score_agent is deprecated. "
    "Use backend.agents.csops.logic instead.",
    DeprecationWarning,
    stacklevel=2,
)
