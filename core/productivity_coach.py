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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ProductivityArea(Enum):
    """Productivity areas."""
    TIME_MANAGEMENT = "time_management"
    FOCUS = "focus"
    ENERGY = "energy"
    PLANNING = "planning"
    DELEGATION = "delegation"
    WORK_LIFE_BALANCE = "work_life_balance"


class HabitFrequency(Enum):
    """Habit frequencies."""
    DAILY = "daily"
    WEEKLY = "weekly"
    BI_WEEKLY = "bi_weekly"
    MONTHLY = "monthly"


class SessionStatus(Enum):
    """Focus session status."""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


@dataclass
class ProductivityProfile:
    """A team member's productivity profile."""
    id: str
    name: str
    scores: Dict[str, int] = field(default_factory=dict)  # area: score 1-10
    weekly_hours: float = 40
    focus_hours: float = 0
    streak_days: int = 0


@dataclass
class Habit:
    """A habit to track."""
    id: str
    name: str
    area: ProductivityArea
    frequency: HabitFrequency
    streak: int = 0
    completions: int = 0
    target_completions: int = 0


@dataclass
class FocusSession:
    """A focus/deep work session."""
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
    Productivity Coach.
    
    Maximize performance.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.profiles: Dict[str, ProductivityProfile] = {}
        self.habits: Dict[str, List[Habit]] = {}  # profile_id: habits
        self.focus_sessions: List[FocusSession] = []
    
    def create_profile(self, name: str, weekly_hours: float = 40) -> ProductivityProfile:
        """Create a productivity profile."""
        profile = ProductivityProfile(
            id=f"PRD-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            weekly_hours=weekly_hours
        )
        self.profiles[profile.id] = profile
        self.habits[profile.id] = []
        return profile
    
    def assess_area(self, profile: ProductivityProfile, area: ProductivityArea, score: int):
        """Assess a productivity area."""
        profile.scores[area.value] = min(10, max(1, score))
    
    def add_habit(
        self,
        profile: ProductivityProfile,
        name: str,
        area: ProductivityArea,
        frequency: HabitFrequency,
        target: int = 1
    ) -> Habit:
        """Add a habit to track."""
        habit = Habit(
            id=f"HBT-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            area=area,
            frequency=frequency,
            target_completions=target
        )
        self.habits[profile.id].append(habit)
        return habit
    
    def complete_habit(self, habit: Habit):
        """Mark habit as completed."""
        habit.completions += 1
        habit.streak += 1
    
    def break_streak(self, habit: Habit):
        """Break a habit streak."""
        habit.streak = 0
    
    def schedule_focus(
        self,
        profile: ProductivityProfile,
        task: str,
        mins: int = 90
    ) -> FocusSession:
        """Schedule a focus session."""
        session = FocusSession(
            id=f"FCS-{uuid.uuid4().hex[:6].upper()}",
            profile_id=profile.id,
            task=task,
            planned_mins=mins
        )
        self.focus_sessions.append(session)
        return session
    
    def complete_focus(self, session: FocusSession, actual_mins: int, distractions: int = 0):
        """Complete a focus session."""
        session.status = SessionStatus.COMPLETED
        session.actual_mins = actual_mins
        session.distractions = distractions
        
        profile = self.profiles.get(session.profile_id)
        if profile:
            profile.focus_hours += actual_mins / 60
    
    def get_productivity_score(self, profile: ProductivityProfile) -> float:
        """Get overall productivity score."""
        if not profile.scores:
            return 0
        return sum(profile.scores.values()) / len(profile.scores)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get productivity statistics."""
        total_focus = sum(s.actual_mins for s in self.focus_sessions if s.status == SessionStatus.COMPLETED)
        avg_distractions = sum(s.distractions for s in self.focus_sessions) / len(self.focus_sessions) if self.focus_sessions else 0
        all_habits = [h for habits in self.habits.values() for h in habits]
        active_streaks = sum(1 for h in all_habits if h.streak > 0)
        
        avg_score = sum(self.get_productivity_score(p) for p in self.profiles.values()) / len(self.profiles) if self.profiles else 0
        
        return {
            "profiles": len(self.profiles),
            "total_focus_hours": total_focus / 60,
            "avg_distractions": avg_distractions,
            "total_habits": len(all_habits),
            "active_streaks": active_streaks,
            "avg_score": avg_score
        }
    
    def format_dashboard(self) -> str:
        """Format productivity coach dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🧠 PRODUCTIVITY COACH                                    ║",
            f"║  {stats['profiles']} profiles │ {stats['total_focus_hours']:.0f}h focus │ {stats['avg_score']:.1f} avg  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 TEAM PRODUCTIVITY                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for profile in list(self.profiles.values())[:4]:
            score = self.get_productivity_score(profile)
            bar = "█" * int(score) + "░" * (10 - int(score))
            habits = len(self.habits.get(profile.id, []))
            
            lines.append(f"║  👤 {profile.name[:12]:<12} │ {bar} {score:.1f} │ {habits:>2} habits  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 FOCUS SESSIONS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"planned": "⏰", "in_progress": "🔥", "completed": "✅", "skipped": "⏭️"}
        
        for session in self.focus_sessions[-4:]:
            icon = status_icons.get(session.status.value, "⚪")
            profile = self.profiles.get(session.profile_id)
            name = profile.name if profile else "Unknown"
            
            lines.append(f"║  {icon} {name[:10]:<10} │ {session.task[:18]:<18} │ {session.planned_mins:>3}min  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🔥 HABIT STREAKS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        all_habits = [h for habits in self.habits.values() for h in habits]
        for habit in sorted(all_habits, key=lambda x: x.streak, reverse=True)[:4]:
            streak_icon = "🔥" if habit.streak >= 7 else "✨" if habit.streak >= 3 else "🌱"
            lines.append(f"║  {streak_icon} {habit.name[:20]:<20} │ {habit.streak:>3} days │ {habit.completions:>4}x  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 PRODUCTIVITY AREAS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        area_icons = {"time_management": "⏰", "focus": "🎯", "energy": "⚡",
                     "planning": "📋", "delegation": "🤝", "work_life_balance": "⚖️"}
        
        for area in list(ProductivityArea)[:4]:
            scores = [p.scores.get(area.value, 0) for p in self.profiles.values() if area.value in p.scores]
            avg = sum(scores) / len(scores) if scores else 0
            icon = area_icons.get(area.value, "📊")
            
            bar = "█" * int(avg) + "░" * (10 - int(avg))
            lines.append(f"║  {icon} {area.value.replace('_', ' ').title()[:15]:<15} │ {bar} │ {avg:.1f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [👥 Team]  [🎯 Focus]  [🔥 Habits]                       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Work smarter!                    ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    pc = ProductivityCoach("Saigon Digital Hub")
    
    print("🧠 Productivity Coach")
    print("=" * 60)
    print()
    
    p1 = pc.create_profile("Alex Nguyen", 45)
    p2 = pc.create_profile("Sarah Tran", 40)
    
    pc.assess_area(p1, ProductivityArea.FOCUS, 8)
    pc.assess_area(p1, ProductivityArea.TIME_MANAGEMENT, 7)
    pc.assess_area(p1, ProductivityArea.ENERGY, 6)
    pc.assess_area(p2, ProductivityArea.PLANNING, 9)
    pc.assess_area(p2, ProductivityArea.WORK_LIFE_BALANCE, 8)
    
    h1 = pc.add_habit(p1, "Morning Planning", ProductivityArea.PLANNING, HabitFrequency.DAILY)
    h2 = pc.add_habit(p1, "90-min Focus Block", ProductivityArea.FOCUS, HabitFrequency.DAILY)
    h3 = pc.add_habit(p2, "Weekly Review", ProductivityArea.PLANNING, HabitFrequency.WEEKLY)
    
    for _ in range(7):
        pc.complete_habit(h1)
    for _ in range(5):
        pc.complete_habit(h2)
    for _ in range(3):
        pc.complete_habit(h3)
    
    f1 = pc.schedule_focus(p1, "Feature Development", 90)
    f2 = pc.schedule_focus(p2, "Design Review", 60)
    
    pc.complete_focus(f1, 85, 2)
    pc.complete_focus(f2, 55, 1)
    
    print(pc.format_dashboard())
