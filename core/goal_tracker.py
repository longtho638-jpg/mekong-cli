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

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GoalPeriod(Enum):
    """Timeframe for specific agency goals."""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class GoalStatus(Enum):
    """Lifecycle status of a goal."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ACHIEVED = "achieved"
    MISSED = "missed"


class GoalCategory(Enum):
    """Categorization for grouping goals."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    LEADS = "leads"
    CONTENT = "content"
    GROWTH = "growth"


@dataclass
class Goal:
    """A goal entity tracking target vs current performance."""
    name: str
    category: GoalCategory
    period: GoalPeriod
    target: float
    current: float
    unit: str
    deadline: datetime
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        if self.target <= 0:
            raise ValueError("Target must be greater than zero")

    @property
    def progress_pct(self) -> float:
        """Calculate progress percentage towards target."""
        return min((self.current / self.target) * 100.0, 100.0)
    
    @property
    def status(self) -> GoalStatus:
        """Determine status based on progress and deadline."""
        if self.progress_pct >= 100.0: return GoalStatus.ACHIEVED
        if datetime.now() > self.deadline: return GoalStatus.MISSED
        if self.current > 0: return GoalStatus.IN_PROGRESS
        return GoalStatus.NOT_STARTED


class GoalTracker:
    """
    Goal Tracker System.
    
    Orchestrates the setting and monitoring of strategic agency benchmarks.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.goals: List[Goal] = []
        logger.info(f"Goal Tracker initialized for {agency_name}")
    
    def add_goal(self, goal: Goal):
        """Register a new goal into the tracker."""
        self.goals.append(goal)
        logger.info(f"Goal added: {goal.name} ({goal.target} {goal.unit})")
    
    def update_progress(self, goal_name: str, current_value: float) -> bool:
        """Update the current value for an identified goal."""
        for g in self.goals:
            if g.name == goal_name:
                g.current = float(current_value)
                logger.info(f"Progress updated: {goal_name} -> {current_value}")
                return True
        logger.error(f"Goal '{goal_name}' not found for update.")
        return False
    
    def format_dashboard(self) -> str:
        """Render the Goal Tracking Dashboard."""
        if not self.goals: return "No active goals tracked."
        
        achieved = sum(1 for g in self.goals if g.status == GoalStatus.ACHIEVED)
        overall_rate = (achieved / len(self.goals)) * 100.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 GOAL TRACKER - {self.agency_name.upper()[:28]:<28} ║",
            f"║  {len(self.goals)} total goals │ {achieved} achieved │ {overall_rate:.0f}% success rate{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        # Group and display by category
        for cat in GoalCategory:
            cat_goals = [g for g in self.goals if g.category == cat]
            if not cat_goals: continue
            
            icon = {"revenue": "💰", "clients": "👥", "leads": "📊", "content": "📝", "growth": "📈"}.get(cat.value, "🎯")
            lines.append(f"║  {icon} {cat.value.upper():<50}   ║")
            lines.append("║  " + "─" * 57 + "  ║")
            
            for g in cat_goals:
                s_icon = "✅" if g.status == GoalStatus.ACHIEVED else "🔄" if g.status == GoalStatus.IN_PROGRESS else "⬜"
                # 10-segment bar
                bar = "█" * int(g.progress_pct / 10) + "░" * (10 - int(g.progress_pct / 10))
                name_disp = (g.name[:18] + '..') if len(g.name) > 20 else g.name
                lines.append(f"║    {s_icon} {name_disp:<20} │ {bar} │ {g.progress_pct:>3.0f}%  ║")
            lines.append("║                                                           ║")
            
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  [🎯 New Goal]  [📊 Statistics]  [📅 Calendar]  [⚙️ Setup] ║",
            f"║  🏯 {self.agency_name[:40]:<40} - Crush It!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing Goal System...")
    print("=" * 60)
    
    try:
        tracker = GoalTracker("Saigon Digital Hub")
        # Seed
        tracker.add_goal(Goal(
            "Revenue Target", GoalCategory.REVENUE, GoalPeriod.MONTHLY,
            10000.0, 8500.0, "USD", datetime.now() + timedelta(days=30)
        ))
        tracker.add_goal(Goal(
            "New Clients", GoalCategory.CLIENTS, GoalPeriod.MONTHLY,
            5.0, 5.0, "clients", datetime.now() + timedelta(days=15)
        ))
        
        print("\n" + tracker.format_dashboard())
        
    except Exception as e:
        logger.error(f"Goal Error: {e}")