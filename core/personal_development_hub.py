"""
🌱 Personal Development Hub - Growth Integration
==================================================

Central hub connecting all Personal Development roles.

Integrates:
- Career Development
- Leadership Coach
- Productivity Coach
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.career_development import CareerDevelopment, CareerLevel, TrainingType
from core.leadership_coach import LeadershipCoach, LeadershipCompetency, SessionType
from core.productivity_coach import ProductivityCoach, ProductivityArea, HabitFrequency


@dataclass
class DevelopmentMetrics:
    """Department-wide metrics."""
    career_paths: int
    skills_tracked: int
    avg_skill_progress: float
    leaders_coached: int
    coaching_sessions: int
    avg_leadership_score: float
    productivity_profiles: int
    total_focus_hours: float
    active_habits: int


class PersonalDevelopmentHub:
    """
    Personal Development Hub.
    
    Connects all growth roles.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.career = CareerDevelopment(agency_name)
        self.leadership = LeadershipCoach(agency_name)
        self.productivity = ProductivityCoach(agency_name)
    
    def get_department_metrics(self) -> DevelopmentMetrics:
        """Get department-wide metrics."""
        career_stats = self.career.get_stats()
        leadership_stats = self.leadership.get_stats()
        productivity_stats = self.productivity.get_stats()
        
        return DevelopmentMetrics(
            career_paths=career_stats.get("career_paths", 0),
            skills_tracked=career_stats.get("total_skills", 0),
            avg_skill_progress=career_stats.get("avg_progress", 0),
            leaders_coached=leadership_stats.get("leaders", 0),
            coaching_sessions=leadership_stats.get("sessions", 0),
            avg_leadership_score=leadership_stats.get("avg_score", 0),
            productivity_profiles=productivity_stats.get("profiles", 0),
            total_focus_hours=productivity_stats.get("total_focus_hours", 0),
            active_habits=productivity_stats.get("active_streaks", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🌱 PERSONAL DEVELOPMENT HUB                              ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📈 Career Paths:       {metrics.career_paths:>5}                          ║",
            f"║    💡 Skills Tracked:     {metrics.skills_tracked:>5}                          ║",
            f"║    📊 Skill Progress:     {metrics.avg_skill_progress:>5.0f}%                         ║",
            f"║    🎯 Leaders Coached:    {metrics.leaders_coached:>5}                          ║",
            f"║    📅 Coaching Sessions:  {metrics.coaching_sessions:>5}                          ║",
            f"║    ⭐ Leadership Score:   {metrics.avg_leadership_score:>5.1f}                          ║",
            f"║    🧠 Productivity Prof:  {metrics.productivity_profiles:>5}                          ║",
            f"║    🎯 Focus Hours:        {metrics.total_focus_hours:>5.0f}                          ║",
            f"║    🔥 Active Habits:      {metrics.active_habits:>5}                          ║",
            "║                                                           ║",
            "║  🔗 DEVELOPMENT ROLES                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📈 Career Development → Paths, skills, training       ║",
            "║    🎯 Leadership Coach   → Competencies, coaching        ║",
            "║    🧠 Productivity Coach → Habits, focus, performance    ║",
            "║                                                           ║",
            "║  📋 TEAM GROWTH                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📈 Career            │ {metrics.career_paths} paths, {metrics.skills_tracked} skills      ║",
            f"║    🎯 Leadership        │ {metrics.leaders_coached} leaders, {metrics.avg_leadership_score:.1f} score    ║",
            f"║    🧠 Productivity      │ {metrics.total_focus_hours:.0f}h focus, {metrics.active_habits} habits   ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📅 Sessions]  [🎯 Goals]                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Grow together!                   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = PersonalDevelopmentHub("Saigon Digital Hub")
    
    print("🌱 Personal Development Hub")
    print("=" * 60)
    print()
    
    # Simulate data
    hub.career.create_career_path("Alex", "Dev", CareerLevel.MID, "Lead", CareerLevel.LEAD)
    hub.leadership.create_profile("Khoa", "CEO")
    hub.productivity.create_profile("Sarah")
    
    print(hub.format_hub_dashboard())
