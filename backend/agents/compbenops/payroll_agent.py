"""
Payroll Agent - Payroll Processing & Management (Proxy)
==================================================
This file is now a proxy for the modularized version in ./payroll_logic/
Please import from backend.agents.compbenops.payroll_logic instead.
"""
import warnings

from .payroll_logic import PayrollAgent, PayrollStatus

# Issue a deprecation warning
warnings.warn(
    "backend.agents.compbenops.payroll_agent is deprecated. "
    "Use backend.agents.compbenops.payroll_logic instead.",
    DeprecationWarning,
    stacklevel=2
)
