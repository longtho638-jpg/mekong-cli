"""
Data models and Enums for Gamification.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List


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
