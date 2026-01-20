"""
🎮 Gamification System - Level-Up & Achievements (Proxy)
==================================================
This file is now a proxy for the modularized version in ./gamification_logic/
Please import from core.hr.gamification_logic instead.
"""
import warnings

from .gamification_logic import (
    Achievement,
    AchievementCategory,
    AgencyLevel,
    AgencyProgress,
    GamificationEngine,
    LevelConfig,
)

# Issue a deprecation warning
warnings.warn(
    "core.hr.gamification is deprecated. "
    "Use core.hr.gamification_logic instead.",
    DeprecationWarning,
    stacklevel=2
)
