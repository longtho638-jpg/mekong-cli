"""
Gamification Engine core logic.
"""
import logging
from typing import Dict, Optional

from .models import Achievement, AchievementCategory, AgencyLevel, AgencyProgress, LevelConfig

logger = logging.getLogger(__name__)

class GamificationEngineBase:
    """
    Gamification System Base.
    Incentivizes agency growth through XP, levels, and milestone rewards.
    """

    # Level configurations
    LEVELS: Dict[AgencyLevel, LevelConfig] = {
        AgencyLevel.BRONZE: LevelConfig(
            level=AgencyLevel.BRONZE,
            min_revenue=0,
            xp_required=0,
            unlocks=["SEOAgent", "ContentAgent"],
            badge_color="#CD7F32",
            perks=["Basic agents"],
        ),
        AgencyLevel.SILVER: LevelConfig(
            level=AgencyLevel.SILVER,
            min_revenue=1000,
            xp_required=1000,
            unlocks=["DirectorAgent", "VideoAgent"],
            badge_color="#C0C0C0",
            perks=["Video production"],
        ),
        AgencyLevel.GOLD: LevelConfig(
            level=AgencyLevel.GOLD,
            min_revenue=5000,
            xp_required=5000,
            unlocks=["CFOAgent", "LegalAgent"],
            badge_color="#FFD700",
            perks=["Financial coaching"],
        ),
    }

    def __init__(self):
        self.agency_progress: Dict[str, AgencyProgress] = {}

    def create_progress(self, agency_id: str, name: str) -> AgencyProgress:
        """Initialize progress tracking for a new agency."""
        if not agency_id or not name:
            raise ValueError("Agency ID and name are required")

        progress = AgencyProgress(
            agency_id=agency_id,
            agency_name=name,
            current_level=AgencyLevel.BRONZE,
            xp_total=0,
            xp_to_next_level=1000,
            achievements=[],
        )
        self.agency_progress[agency_id] = progress
        logger.info(f"Progress tracking created for {name}")
        return progress

    def add_xp(self, agency_id: str, xp: int, reason: str) -> Optional[AgencyLevel]:
        """Add XP and check for level-up transitions."""
        if agency_id not in self.agency_progress:
            return None
        if xp < 0:
            raise ValueError("XP cannot be negative")

        p = self.agency_progress[agency_id]
        p.xp_total += xp
        logger.info(f"XP Added to {p.agency_name}: +{xp} ({reason})")

        # Calculate new level
        new_level = self._calculate_level(p.xp_total)
        if new_level != p.current_level:
            old = p.current_level
            p.current_level = new_level
            logger.info(f"🎉 LEVEL UP: {p.agency_name} moved {old.value} -> {new_level.value}")
            return new_level

        return None

    def _calculate_level(self, xp: int) -> AgencyLevel:
        for level in reversed(list(AgencyLevel)):
            if level in self.LEVELS and xp >= self.LEVELS[level].xp_required:
                return level
        return AgencyLevel.BRONZE
