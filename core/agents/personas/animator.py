"""
🎬 Animator - Motion Design (Proxy)
==============================
This file is now a proxy for the modularized version in ./animator_logic/
Please import from core.agents.personas.animator_logic instead.
"""
import warnings

from .animator_logic import AnimationStatus, AnimationType, Animator

# Issue a deprecation warning
warnings.warn(
    "core.agents.personas.animator is deprecated. "
    "Use core.agents.personas.animator_logic package instead.",
    DeprecationWarning,
    stacklevel=2
)
