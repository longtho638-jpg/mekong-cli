"""
🧠 Productivity Coach - Peak Performance
==========================================

Maximize team productivity.
Work smarter, not harder!

Roles:
- Productivity assessment
- Habit tracking
- Focus sessions
- Work-life balance
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProductivityArea(Enum):
    """Domains of peak professional performance."""
    TIME_MANAGEMENT = "time_management"
    FOCUS = "focus"
    ENERGY = "energy"
    PLANNING = "planning"
    DELEGATION = "delegation"
    WORK_LIFE_BALANCE = "work_life_balance"


class HabitFrequency(Enum):
    """Cadence for tracking professional habits."""
    DAILY = "daily"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"


class SessionStatus(Enum):
    """Lifecycle status of a deep work focus session."""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


@dataclass
class ProductivityProfile:
    """A team member's performance profile entity."""
    id: str
    name: str
    scores: Dict[str, int] = field(default_factory=dict)
    weekly_hours: float = 40.0
    focus_hours: float = 0.0
    streak_days: int = 0

    def __post_init__(self):
        if not self.name:
            raise ValueError("Name is mandatory")


@dataclass
class Habit:
    """A recurring professional habit entity."""
    id: str
    name: str
    area: ProductivityArea
    frequency: HabitFrequency
    streak: int = 0
    completions: int = 0
    target_completions: int = 0


@dataclass
class FocusSession:
    """A deep work session record."""
    id: str
    profile_id: str
    task: str
    planned_mins: int
    actual_mins: int = 0
    status: SessionStatus = SessionStatus.PLANNED
    distractions: int = 0
    scheduled_at: datetime = field(default_factory=datetime.now)


class ProductivityCoach:
    """
    Productivity Coach System.
    
    Orchestrates assessments, habit forming workflows, and deep-work focus sessions.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.profiles: Dict[str, ProductivityProfile] = {}
        self.habits: Dict[str, List[Habit]] = {}
        self.focus_sessions: List[FocusSession] = []
        logger.info(f"Productivity Coach initialized for {agency_name}")
    
    def create_profile(self, name: str, hours: float = 40.0) -> ProductivityProfile:
        """Register a new team member for productivity tracking."""
        p = ProductivityProfile(id=f"PRD-{uuid.uuid4().hex[:6].upper()}", name=name, weekly_hours=hours)
        self.profiles[p.id] = p
        self.habits[p.id] = []
        logger.info(f"Performance profile created: {name}")
        return p
    
    def schedule_deep_work(self, profile_id: str, task: str, mins: int = 90) -> Optional[FocusSession]:
        """Book a deep work session for a specific profile."""
        if profile_id not in self.profiles: return None
        
        s = FocusSession(
            id=f"FCS-{uuid.uuid4().hex[:6].upper()}",
            profile_id=profile_id, task=task, planned_mins=mins
        )
        self.focus_sessions.append(s)
        logger.info(f"Focus session scheduled: {task} ({mins}m)")
        return s
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate high-level performance metrics."""
        done_s = [s for s in self.focus_sessions if s.status == SessionStatus.COMPLETED]
        total_f = sum(s.actual_mins for s in done_s)
        all_h = [h for hs in self.habits.values() for h in hs]
        
        return {
            "profiles": len(self.profiles),
            "total_focus_hours": total_f / 60.0,
            "active_streaks": sum(1 for h in all_h if h.streak > 0)
        }
    
    def format_dashboard(self) -> str:
        """Render the Productivity Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🧠 PRODUCTIVITY COACH DASHBOARD{' ' * 30}║",
            f"║  {s['profiles']} profiles │ {s['total_focus_hours']:.1f}h total deep work │ {s['active_streaks']} active streaks{' ' * 6}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 TEAM PERFORMANCE SNAPSHOT                             ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for p in list(self.profiles.values())[:4]:
            avg_score = sum(p.scores.values()) / len(p.scores) if p.scores else 0.0
            bar = "█" * int(avg_score) + "░" * (10 - int(avg_score))
            lines.append(f"║  👤 {p.name[:15]:<15} │ {bar} │ {avg_score:>4.1f} score {' ' * 13} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🔥 TRENDING HABITS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        # Display top 3 streaks
        all_h = sorted([h for hs in self.habits.values() for h in hs], key=lambda x: x.streak, reverse=True)
        if not all_h:
            lines.append("║    Start tracking habits to build momentum!               ║")
        else:
            for h in all_h[:3]:
                lines.append(f"║    🔥 {h.name[:25]:<25} │ {h.streak:>3} day streak {' ' * 14} ║")
                
        lines.extend([
            "║                                                           ║",
            "║  [🎯 Start Focus]  [📊 Full Report]  [🔥 Habit Log]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Work Smarter!     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🧠 Initializing Productivity Coach...")
    print("=" * 60)
    
    try:
        coach = ProductivityCoach("Saigon Digital Hub")
        # Seed
        p = coach.create_profile("Alex Nguyen")
        coach.schedule_deep_work(p.id, "Core Logic Refactor", 120)
        
        print("\n" + coach.format_dashboard())
        
    except Exception as e:
        logger.error(f"Coach Error: {e}")
