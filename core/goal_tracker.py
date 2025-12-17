"""
🎯 Goal Tracker - Track Your Agency Goals
==========================================

Track monthly, quarterly, and yearly goals.
Stay motivated and on track!

Features:
- Goal setting (revenue, clients, metrics)
- Progress visualization
- Milestone tracking
- Achievement badges
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum


class GoalPeriod(Enum):
    """Goal time period."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class GoalStatus(Enum):
    """Goal status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ACHIEVED = "achieved"
    MISSED = "missed"


class GoalCategory(Enum):
    """Goal category."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    LEADS = "leads"
    CONTENT = "content"
    GROWTH = "growth"


@dataclass
class Goal:
    """A goal to track."""
    name: str
    category: GoalCategory
    period: GoalPeriod
    target: float
    current: float
    unit: str
    deadline: datetime
    created_at: datetime = field(default_factory=datetime.now)
    
    @property
    def progress(self) -> float:
        if self.target == 0:
            return 0
        return min((self.current / self.target) * 100, 100)
    
    @property
    def status(self) -> GoalStatus:
        if self.progress >= 100:
            return GoalStatus.ACHIEVED
        elif datetime.now() > self.deadline:
            return GoalStatus.MISSED
        elif self.progress > 0:
            return GoalStatus.IN_PROGRESS
        else:
            return GoalStatus.NOT_STARTED


class GoalTracker:
    """
    Goal Tracker.
    
    Track and visualize agency goals.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.goals: List[Goal] = []
    
    def add_goal(self, goal: Goal):
        """Add a goal."""
        self.goals.append(goal)
    
    def update_progress(self, goal_name: str, current: float):
        """Update goal progress."""
        for goal in self.goals:
            if goal.name == goal_name:
                goal.current = current
                break
    
    def get_summary(self) -> Dict[str, Any]:
        """Get goals summary."""
        total = len(self.goals)
        achieved = sum(1 for g in self.goals if g.status == GoalStatus.ACHIEVED)
        in_progress = sum(1 for g in self.goals if g.status == GoalStatus.IN_PROGRESS)
        
        return {
            "total": total,
            "achieved": achieved,
            "in_progress": in_progress,
            "achievement_rate": (achieved / total * 100) if total > 0 else 0
        }
    
    def format_goal(self, goal: Goal) -> str:
        """Format single goal progress."""
        # Progress bar
        filled = int(40 * goal.progress / 100)
        bar = "█" * filled + "░" * (40 - filled)
        
        # Status icon
        status_icons = {
            GoalStatus.NOT_STARTED: "⬜",
            GoalStatus.IN_PROGRESS: "🔄",
            GoalStatus.ACHIEVED: "✅",
            GoalStatus.MISSED: "❌"
        }
        icon = status_icons[goal.status]
        
        # Category emoji
        cat_icons = {
            GoalCategory.REVENUE: "💰",
            GoalCategory.CLIENTS: "👥",
            GoalCategory.LEADS: "📊",
            GoalCategory.CONTENT: "📝",
            GoalCategory.GROWTH: "📈"
        }
        cat_icon = cat_icons[goal.category]
        
        return f"""{icon} {cat_icon} {goal.name}
   [{bar}] {goal.progress:.0f}%
   Current: {goal.current:,.0f} / Target: {goal.target:,.0f} {goal.unit}
   Deadline: {goal.deadline.strftime('%Y-%m-%d')}"""
    
    def format_dashboard(self) -> str:
        """Format goals dashboard."""
        summary = self.get_summary()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 GOAL TRACKER: {self.agency_name.upper()[:33]:<33}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Summary: {summary['achieved']}/{summary['total']} goals achieved ({summary['achievement_rate']:.0f}%)       ║",
            "║                                                           ║",
        ]
        
        # Group by category
        for category in GoalCategory:
            cat_goals = [g for g in self.goals if g.category == category]
            if not cat_goals:
                continue
            
            cat_icon = {"revenue": "💰", "clients": "👥", "leads": "📊", "content": "📝", "growth": "📈"}[category.value]
            lines.append(f"║  {cat_icon} {category.value.upper():<50}   ║")
            lines.append("║  ─────────────────────────────────────────────────────── ║")
            
            for goal in cat_goals:
                # Status
                if goal.status == GoalStatus.ACHIEVED:
                    icon = "✅"
                elif goal.status == GoalStatus.IN_PROGRESS:
                    icon = "🔄"
                else:
                    icon = "⬜"
                
                # Mini progress bar
                filled = int(20 * goal.progress / 100)
                bar = "█" * filled + "░" * (20 - filled)
                
                lines.append(f"║    {icon} {goal.name[:20]:<20} [{bar}] {goal.progress:>3.0f}%  ║")
            
            lines.append("║                                                           ║")
        
        # Footer
        achievement_bar_fill = int(40 * summary['achievement_rate'] / 100)
        achievement_bar = "█" * achievement_bar_fill + "░" * (40 - achievement_bar_fill)
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏆 OVERALL ACHIEVEMENT                                   ║",
            f"║  [{achievement_bar}] {summary['achievement_rate']:.0f}%  ║",
            "║                                                           ║",
            f"║  🏯 Keep crushing it! - {self.agency_name}               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tracker = GoalTracker("Saigon Digital Hub")
    
    # Add sample goals
    tracker.add_goal(Goal(
        name="Monthly Revenue",
        category=GoalCategory.REVENUE,
        period=GoalPeriod.MONTHLY,
        target=10000,
        current=8500,
        unit="USD",
        deadline=datetime(2025, 12, 31)
    ))
    
    tracker.add_goal(Goal(
        name="New Clients",
        category=GoalCategory.CLIENTS,
        period=GoalPeriod.MONTHLY,
        target=5,
        current=4,
        unit="clients",
        deadline=datetime(2025, 12, 31)
    ))
    
    tracker.add_goal(Goal(
        name="Leads Generated",
        category=GoalCategory.LEADS,
        period=GoalPeriod.MONTHLY,
        target=100,
        current=120,
        unit="leads",
        deadline=datetime(2025, 12, 31)
    ))
    
    tracker.add_goal(Goal(
        name="Blog Posts",
        category=GoalCategory.CONTENT,
        period=GoalPeriod.MONTHLY,
        target=8,
        current=6,
        unit="posts",
        deadline=datetime(2025, 12, 31)
    ))
    
    tracker.add_goal(Goal(
        name="Social Followers",
        category=GoalCategory.GROWTH,
        period=GoalPeriod.QUARTERLY,
        target=5000,
        current=3200,
        unit="followers",
        deadline=datetime(2025, 12, 31)
    ))
    
    print("🎯 Goal Tracker")
    print("=" * 60)
    print()
    
    print(tracker.format_dashboard())
    print()
    
    print("📋 Individual Goals:")
    print("-" * 40)
    for goal in tracker.goals[:2]:
        print(tracker.format_goal(goal))
        print()
