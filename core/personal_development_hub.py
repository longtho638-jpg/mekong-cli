"""
🌱 Personal Development Hub - Growth Integration
==================================================

Central hub connecting all Personal Development roles with their operational tools.

Integrates:
- Career Development
- Leadership Coach
- Productivity Coach
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules with fallback for direct testing
try:
    from core.career_development import CareerDevelopment, CareerLevel, TrainingType
    from core.leadership_coach import LeadershipCoach, LeadershipCompetency, SessionType
    from core.productivity_coach import ProductivityCoach, ProductivityArea, HabitFrequency
except ImportError:
    from career_development import CareerDevelopment, CareerLevel, TrainingType
    from leadership_coach import LeadershipCoach, LeadershipCompetency, SessionType
    from productivity_coach import ProductivityCoach, ProductivityArea, HabitFrequency

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class DevelopmentMetrics:
    """Department-wide development metrics container."""
    career_paths: int = 0
    skills_tracked: int = 0
    avg_skill_progress: float = 0.0
    leaders_coached: int = 0
    coaching_sessions: int = 0
    avg_leadership_score: float = 0.0
    productivity_profiles: int = 0
    total_focus_hours: float = 0.0
    active_habits: int = 0


class PersonalDevelopmentHub:
    """
    Personal Development Hub System.
    
    Orchestrates employee growth, leadership excellence, and peak performance coaching.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Personal Development Hub for {agency_name}")
        try:
            self.career = CareerDevelopment(agency_name)
            self.leadership = LeadershipCoach(agency_name)
            self.productivity = ProductivityCoach(agency_name)
        except Exception as e:
            logger.error(f"Development Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> DevelopmentMetrics:
        """Aggregate data from all growth-focused sub-modules."""
        metrics = DevelopmentMetrics()
        
        try:
            # 1. Career Metrics
            c_stats = self.career.get_stats()
            metrics.career_paths = c_stats.get("career_paths", 0)
            metrics.skills_tracked = c_stats.get("total_skills", 0)
            metrics.avg_skill_progress = float(c_stats.get("avg_progress", 0.0))
            
            # 2. Leadership Metrics
            l_stats = self.leadership.format_dashboard() # Checking counts
            metrics.leaders_coached = len(self.leadership.profiles)
            metrics.coaching_sessions = len(self.leadership.sessions)
            
            # 3. Productivity Metrics
            p_stats = self.productivity.get_stats()
            metrics.productivity_profiles = p_stats.get("profiles", 0)
            metrics.total_focus_hours = float(p_stats.get("total_focus_hours", 0.0))
            metrics.active_habits = p_stats.get("active_streaks", 0)
            
        except Exception as e:
            logger.warning(f"Error aggregating Development metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Personal Development Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🌱 PERSONAL DEVELOPMENT HUB{' ' * 33}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 GROWTH & PERFORMANCE METRICS                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📈 Career Paths:       {m.career_paths:>5}                          ║",
            f"║    💡 Skills Tracked:     {m.skills_tracked:>5}                          ║",
            f"║    📊 Skill Progress:     {m.avg_skill_progress:>5.0f}%                         ║",
            f"║    🎯 Leaders Coached:    {m.leaders_coached:>5}                          ║",
            f"║    📅 Coaching Sessions:  {m.coaching_sessions:>5}                          ║",
            f"║    🧠 Productivity Prof:  {m.productivity_profiles:>5}                          ║",
            f"║    🎯 Total Focus Hours:  {m.total_focus_hours:>5.0f}                          ║",
            f"║    🔥 Active Habits:      {m.active_habits:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    📈 Career (Paths) │ 🎯 Leadership (Coach) │ 🧠 Productiv ║",
            "║                                                           ║",
            "║  [📊 Reports]  [📅 Sessions]  [🎯 Goals]  [⚙️ Setup]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Growth!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🌱 Initializing Development Hub...")
    print("=" * 60)
    
    try:
        hub = PersonalDevelopmentHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")
