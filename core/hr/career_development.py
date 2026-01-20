"""
📈 Career Development - Team Growth (Proxy)
=====================================

This file is now a proxy for the modularized version in ./career/
Please import from antigravity.core.hr.career instead.
"""
import warnings

from .career import (
    CareerDevelopment,
    CareerLevel,
    CareerPath,
    Skill,
    SkillLevel,
    Training,
    TrainingType,
)

# Issue a deprecation warning
warnings.warn(
    "core.hr.career_development is deprecated. "
    "Use core.hr.career instead.",
    DeprecationWarning,
    stacklevel=2
)
