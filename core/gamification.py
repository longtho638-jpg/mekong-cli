"""
Gamification System - Level-Up & Achievements
Agency CLI - Phase 3: The WOW Experience

Keep agencies motivated with progression, badges, and leaderboards.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional


class AgencyLevel(Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    DIAMOND = "diamond"
    PLATINUM = "platinum"


class AchievementCategory(Enum):
    REVENUE = "revenue"
    CONTENT = "content"
    CLIENTS = "clients"
    STREAK = "streak"
    SPECIAL = "special"


@dataclass
class Achievement:
    """Earned achievement/badge."""
    id: str
    name: str
    description: str
    category: AchievementCategory
    icon: str  # emoji
    earned_at: datetime
    xp_reward: int


@dataclass
class LevelConfig:
    """Configuration for an agency level."""
    level: AgencyLevel
    min_revenue: float
    xp_required: int
    unlocks: List[str]
    badge_color: str
    perks: List[str]


@dataclass
class AgencyProgress:
    """Agency's gamification progress."""
    agency_id: str
    agency_name: str
    current_level: AgencyLevel
    xp_total: int
    xp_to_next_level: int
    achievements: List[Achievement]
    monthly_revenue: float
    streak_days: int
    rank_global: int


class GamificationEngine:
    """
    Gamification System - Motivation through progression.
    
    WOW Factor: Level-Up System keeps agencies engaged.
    """
    
    # Level configurations
    LEVELS: Dict[AgencyLevel, LevelConfig] = {
        AgencyLevel.BRONZE: LevelConfig(
            level=AgencyLevel.BRONZE,
            min_revenue=0,
            xp_required=0,
            unlocks=["SEOAgent", "ContentAgent", "EmailAgent", "SocialAgent", "AnalyticsAgent"],
            badge_color="#CD7F32",
            perks=["5 basic agents", "Community support"]
        ),
        AgencyLevel.SILVER: LevelConfig(
            level=AgencyLevel.SILVER,
            min_revenue=1000,
            xp_required=1000,
            unlocks=["DirectorAgent", "VideoAgent", "PodcastAgent"],
            badge_color="#C0C0C0",
            perks=["Video production agents", "Priority support", "Advanced analytics"]
        ),
        AgencyLevel.GOLD: LevelConfig(
            level=AgencyLevel.GOLD,
            min_revenue=5000,
            xp_required=5000,
            unlocks=["CFOAgent", "TaxAgent", "LegalAgent"],
            badge_color="#FFD700",
            perks=["Financial agents", "Tax optimization", "1-on-1 coaching"]
        ),
        AgencyLevel.DIAMOND: LevelConfig(
            level=AgencyLevel.DIAMOND,
            min_revenue=10000,
            xp_required=15000,
            unlocks=["WhiteLabelRights", "CustomBranding", "APIAccess"],
            badge_color="#B9F2FF",
            perks=["White-label rights", "Custom branding", "API access"]
        ),
        AgencyLevel.PLATINUM: LevelConfig(
            level=AgencyLevel.PLATINUM,
            min_revenue=25000,
            xp_required=50000,
            unlocks=["FranchiseRights", "SubAgencies", "RevenueShare"],
            badge_color="#E5E4E2",
            perks=["Franchise rights", "Sub-agency creation", "Revenue sharing"]
        ),
    }
    
    # Achievement definitions
    ACHIEVEMENTS = [
        # Revenue
        {"id": "first_dollar", "name": "First Dollar", "desc": "Earn your first $1", "cat": AchievementCategory.REVENUE, "icon": "💵", "xp": 50},
        {"id": "hundred_club", "name": "Hundred Club", "desc": "Earn $100 in a month", "cat": AchievementCategory.REVENUE, "icon": "💰", "xp": 100},
        {"id": "thousand_maker", "name": "Thousand Maker", "desc": "Earn $1,000 in a month", "cat": AchievementCategory.REVENUE, "icon": "🤑", "xp": 500},
        {"id": "five_figure", "name": "Five Figure", "desc": "Earn $10,000 in a month", "cat": AchievementCategory.REVENUE, "icon": "💎", "xp": 2000},
        # Content
        {"id": "first_post", "name": "First Post", "desc": "Publish your first content", "cat": AchievementCategory.CONTENT, "icon": "📝", "xp": 25},
        {"id": "content_machine", "name": "Content Machine", "desc": "Publish 10 pieces", "cat": AchievementCategory.CONTENT, "icon": "⚡", "xp": 100},
        {"id": "viral_hit", "name": "Viral Hit", "desc": "Get 1,000+ views on content", "cat": AchievementCategory.CONTENT, "icon": "🔥", "xp": 300},
        # Clients
        {"id": "first_client", "name": "First Client", "desc": "Sign your first client", "cat": AchievementCategory.CLIENTS, "icon": "🤝", "xp": 100},
        {"id": "client_magnet", "name": "Client Magnet", "desc": "Sign 5 clients", "cat": AchievementCategory.CLIENTS, "icon": "🧲", "xp": 500},
        {"id": "agency_mogul", "name": "Agency Mogul", "desc": "Sign 10 clients", "cat": AchievementCategory.CLIENTS, "icon": "👑", "xp": 1000},
        # Streaks
        {"id": "week_warrior", "name": "Week Warrior", "desc": "7-day activity streak", "cat": AchievementCategory.STREAK, "icon": "🗓️", "xp": 75},
        {"id": "month_master", "name": "Month Master", "desc": "30-day activity streak", "cat": AchievementCategory.STREAK, "icon": "📅", "xp": 300},
        # Special
        {"id": "early_adopter", "name": "Early Adopter", "desc": "Joined in beta", "cat": AchievementCategory.SPECIAL, "icon": "🚀", "xp": 500},
        {"id": "helper", "name": "Helper", "desc": "Help another agency", "cat": AchievementCategory.SPECIAL, "icon": "🤗", "xp": 200},
    ]
    
    def __init__(self):
        self.agency_progress: Dict[str, AgencyProgress] = {}
    
    def create_progress(
        self,
        agency_id: str,
        agency_name: str
    ) -> AgencyProgress:
        """Create progress tracking for an agency."""
        # Start with early adopter achievement
        early_adopter = Achievement(
            id="early_adopter",
            name="Early Adopter",
            description="Joined in beta",
            category=AchievementCategory.SPECIAL,
            icon="🚀",
            earned_at=datetime.now(),
            xp_reward=500
        )
        
        progress = AgencyProgress(
            agency_id=agency_id,
            agency_name=agency_name,
            current_level=AgencyLevel.BRONZE,
            xp_total=500,  # From early adopter
            xp_to_next_level=500,  # 1000 - 500
            achievements=[early_adopter],
            monthly_revenue=0,
            streak_days=0,
            rank_global=0
        )
        
        self.agency_progress[agency_id] = progress
        return progress
    
    def add_xp(
        self,
        agency_id: str,
        xp: int,
        reason: str
    ) -> Optional[AgencyLevel]:
        """
        Add XP to an agency. Returns new level if leveled up.
        """
        progress = self.agency_progress.get(agency_id)
        if not progress:
            return None
        
        progress.xp_total += xp
        
        # Check for level up
        new_level = self._calculate_level(progress.xp_total)
        if new_level != progress.current_level:
            progress.current_level = new_level
            progress.xp_to_next_level = self._xp_to_next(new_level, progress.xp_total)
            return new_level
        
        progress.xp_to_next_level = self._xp_to_next(progress.current_level, progress.xp_total)
        return None
    
    def _calculate_level(self, xp: int) -> AgencyLevel:
        """Calculate level based on XP."""
        levels = [
            (AgencyLevel.PLATINUM, 50000),
            (AgencyLevel.DIAMOND, 15000),
            (AgencyLevel.GOLD, 5000),
            (AgencyLevel.SILVER, 1000),
            (AgencyLevel.BRONZE, 0),
        ]
        for level, required in levels:
            if xp >= required:
                return level
        return AgencyLevel.BRONZE
    
    def _xp_to_next(self, current: AgencyLevel, xp_total: int) -> int:
        """Calculate XP needed for next level."""
        order = [AgencyLevel.BRONZE, AgencyLevel.SILVER, AgencyLevel.GOLD, AgencyLevel.DIAMOND, AgencyLevel.PLATINUM]
        idx = order.index(current)
        if idx >= len(order) - 1:
            return 0  # Max level
        next_level = order[idx + 1]
        return self.LEVELS[next_level].xp_required - xp_total
    
    def award_achievement(
        self,
        agency_id: str,
        achievement_id: str
    ) -> Optional[Achievement]:
        """Award an achievement to an agency."""
        progress = self.agency_progress.get(agency_id)
        if not progress:
            return None
        
        # Check if already earned
        if any(a.id == achievement_id for a in progress.achievements):
            return None
        
        # Find achievement definition
        ach_def = next((a for a in self.ACHIEVEMENTS if a["id"] == achievement_id), None)
        if not ach_def:
            return None
        
        achievement = Achievement(
            id=ach_def["id"],
            name=ach_def["name"],
            description=ach_def["desc"],
            category=ach_def["cat"],
            icon=ach_def["icon"],
            earned_at=datetime.now(),
            xp_reward=ach_def["xp"]
        )
        
        progress.achievements.append(achievement)
        self.add_xp(agency_id, achievement.xp_reward, f"Achievement: {achievement.name}")
        
        return achievement
    
    def get_level_info(self, level: AgencyLevel) -> LevelConfig:
        """Get info about a level."""
        return self.LEVELS[level]
    
    def get_progress_summary(self, agency_id: str) -> Dict:
        """Get progress summary for an agency."""
        progress = self.agency_progress.get(agency_id)
        if not progress:
            return {}
        
        level_config = self.LEVELS[progress.current_level]
        
        return {
            "agency": progress.agency_name,
            "level": progress.current_level.value,
            "level_badge": level_config.badge_color,
            "xp_total": progress.xp_total,
            "xp_to_next": progress.xp_to_next_level,
            "achievements_count": len(progress.achievements),
            "recent_achievements": [
                {"name": a.name, "icon": a.icon}
                for a in progress.achievements[-3:]
            ],
            "unlocks": level_config.unlocks,
            "perks": level_config.perks,
        }
    
    def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get global leaderboard."""
        sorted_agencies = sorted(
            self.agency_progress.values(),
            key=lambda x: x.xp_total,
            reverse=True
        )[:limit]
        
        return [
            {
                "rank": i + 1,
                "name": a.agency_name,
                "level": a.current_level.value,
                "xp": a.xp_total,
            }
            for i, a in enumerate(sorted_agencies)
        ]


# Demo
if __name__ == "__main__":
    engine = GamificationEngine()
    
    print("🎮 Gamification Engine - Level-Up System")
    print("=" * 50)
    
    # Create agency progress
    progress = engine.create_progress("agency_123", "Nova Digital")
    
    print(f"\n🏆 Agency: {progress.agency_name}")
    print(f"   Level: {progress.current_level.value.upper()}")
    print(f"   XP: {progress.xp_total} (need {progress.xp_to_next_level} for next level)")
    
    # Show level info
    level_info = engine.get_level_info(AgencyLevel.BRONZE)
    print(f"\n🥉 Bronze Level:")
    print(f"   Unlocks: {', '.join(level_info.unlocks[:3])}...")
    print(f"   Perks: {', '.join(level_info.perks)}")
    
    # Award achievements
    print(f"\n🎖️ Awarding Achievements:")
    for ach_id in ["first_dollar", "first_post", "first_client"]:
        ach = engine.award_achievement("agency_123", ach_id)
        if ach:
            print(f"   {ach.icon} {ach.name}: +{ach.xp_reward} XP")
    
    # Check progress after achievements
    summary = engine.get_progress_summary("agency_123")
    print(f"\n📊 Updated Progress:")
    print(f"   Level: {summary['level'].upper()}")
    print(f"   XP: {summary['xp_total']} (need {summary['xp_to_next']} for Silver)")
    print(f"   Achievements: {summary['achievements_count']}")
    
    # Level up simulation
    print(f"\n⬆️ Simulating Level Up...")
    new_level = engine.add_xp("agency_123", 500, "Revenue bonus")
    if new_level:
        print(f"   🎉 LEVEL UP! Now {new_level.value.upper()}")
        silver_info = engine.get_level_info(AgencyLevel.SILVER)
        print(f"   New Unlocks: {', '.join(silver_info.unlocks)}")
    
    # All levels
    print(f"\n📈 All Levels:")
    for level in AgencyLevel:
        config = engine.LEVELS[level]
        print(f"   {level.value.upper()}: ${config.min_revenue}/mo → {len(config.unlocks)} unlocks")
