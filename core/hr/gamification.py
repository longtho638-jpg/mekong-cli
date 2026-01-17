"""
🎮 Gamification System - Level-Up & Achievements
Agency CLI - Phase 3: The WOW Experience

Keep agencies motivated with progression, badges, and leaderboards.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgencyLevel(Enum):
    """Agency growth tiers."""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    DIAMOND = "diamond"
    PLATINUM = "platinum"


class AchievementCategory(Enum):
    """Categories for rewarding milestones."""
    REVENUE = "revenue"
    CONTENT = "content"
    CLIENTS = "clients"
    STREAK = "streak"
    SPECIAL = "special"


@dataclass
class Achievement:
    """An earned achievement badge entity."""
    id: str
    name: str
    description: str
    category: AchievementCategory
    icon: str  # emoji
    earned_at: datetime = field(default_factory=datetime.now)
    xp_reward: int = 0


@dataclass
class LevelConfig:
    """Configuration for a specific agency level."""
    level: AgencyLevel
    min_revenue: float
    xp_required: int
    unlocks: List[str]
    badge_color: str
    perks: List[str]


@dataclass
class AgencyProgress:
    """Agency's current gamification state."""
    agency_id: str
    agency_name: str
    current_level: AgencyLevel
    xp_total: int
    xp_to_next_level: int
    achievements: List[Achievement]
    monthly_revenue: float = 0.0
    streak_days: int = 0
    rank_global: int = 0


class GamificationEngine:
    """
    Gamification System.
    
    Incentivizes agency growth through XP, levels, and milestone rewards.
    """

    # Level configurations
    LEVELS: Dict[AgencyLevel, LevelConfig] = {
        AgencyLevel.BRONZE: LevelConfig(
            level=AgencyLevel.BRONZE, min_revenue=0, xp_required=0,
            unlocks=["SEOAgent", "ContentAgent"], badge_color="#CD7F32",
            perks=["Basic agents"]
        ),
        AgencyLevel.SILVER: LevelConfig(
            level=AgencyLevel.SILVER, min_revenue=1000, xp_required=1000,
            unlocks=["DirectorAgent", "VideoAgent"], badge_color="#C0C0C0",
            perks=["Video production"]
        ),
        AgencyLevel.GOLD: LevelConfig(
            level=AgencyLevel.GOLD, min_revenue=5000, xp_required=5000,
            unlocks=["CFOAgent", "LegalAgent"], badge_color="#FFD700",
            perks=["Financial coaching"]
        ),
    }

    def __init__(self):
        self.agency_progress: Dict[str, AgencyProgress] = {}
        logger.info("Gamification Engine initialized.")

    def create_progress(self, agency_id: str, name: str) -> AgencyProgress:
        """Initialize progress tracking for a new agency."""
        if not agency_id or not name:
            raise ValueError("Agency ID and name are required")

        progress = AgencyProgress(
            agency_id=agency_id, agency_name=name,
            current_level=AgencyLevel.BRONZE,
            xp_total=0, xp_to_next_level=1000,
            achievements=[]
        )
        self.agency_progress[agency_id] = progress
        logger.info(f"Progress tracking created for {name}")
        return progress

    def add_xp(self, agency_id: str, xp: int, reason: str) -> Optional[AgencyLevel]:
        """Add XP and check for level-up transitions."""
        if agency_id not in self.agency_progress: return None
        if xp < 0: raise ValueError("XP cannot be negative")

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

    def format_dashboard(self, agency_id: str) -> str:
        """Render the Gamification Dashboard."""
        p = self.agency_progress.get(agency_id)
        if not p: return "No progress data found."

        conf = self.LEVELS.get(p.current_level)
        bar_len = int((p.xp_total % 1000) / 100) # Simple 10-step progress
        bar = "█" * bar_len + "░" * (10 - bar_len)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏆 AGENCY RANKING: {p.agency_name.upper()[:30]:<30}  ║",
            f"║  Level: {p.current_level.value.upper():<10} │ Total XP: {p.xp_total:>10} {' ' * 13} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📈 Next Level: {bar} {p.xp_total % 1000}/1000 XP {' ' * 14} ║",
            "║                                                           ║",
            "║  🎖️ RECENT ACHIEVEMENTS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        if not p.achievements:
            lines.append("║    Start working to earn your first badge!                ║")
        else:
            for a in p.achievements[-3:]:
                lines.append(f"║    {a.icon} {a.name:<25} │ {a.earned_at.strftime('%Y-%m-%d')}  ║")

        lines.extend([
            "║                                                           ║",
            "║  🎁 LEVEL UNLOCKS                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        if conf:
            for u in conf.unlocks:
                lines.append(f"║    ✅ {u:<53}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [🏆 Leaderboard]  [🎖️ Badges]  [🎁 Rewards]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {p.agency_name[:40]:<40} - Level Up!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎮 Initializing Gamification Engine...")
    print("=" * 60)

    try:
        engine = GamificationEngine()
        prog = engine.create_progress("A1", "Saigon Digital")

        # Earn XP
        engine.add_xp("A1", 500, "First Client")
        # Add Achievement
        prog.achievements.append(Achievement("first_client", "First Client", "Signed #1", AchievementCategory.CLIENTS, "🤝"))

        print("\n" + engine.format_dashboard("A1"))

    except Exception as e:
        logger.error(f"Engine Error: {e}")
