"""
🔧 Technical Support Specialist (Proxy)
====================================
This file is now a proxy for the modularized version in ./tech_support/
Please import from core.agents.personas.tech_support instead.
"""
import warnings

from .tech_support import IssueCategory, IssuePriority, IssueStatus, TechSupportSpecialist

# Issue a deprecation warning
warnings.warn(
    "core.agents.personas.tech_support is deprecated. "
    "Use core.agents.personas.tech_support package instead.",
    DeprecationWarning,
    stacklevel=2
)
