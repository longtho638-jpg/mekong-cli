"""
Press Release Agent - Tạo Thông cáo Báo chí (Proxy)
==============================================
This file is now a proxy for the modularized version in ./press_release/
Please import from backend.agents.props.press_release instead.
"""

import warnings

from .press_release import PressRelease, PressReleaseAgent, ReleaseStatus, ReleaseType

# Issue a deprecation warning
warnings.warn(
    "backend.agents.props.press_release_agent is deprecated. "
    "Use backend.agents.props.press_release instead.",
    DeprecationWarning,
    stacklevel=2,
)
