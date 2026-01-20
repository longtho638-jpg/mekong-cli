"""
Activity Tracker Agent Facade.
"""
from typing import Dict, List
from .models import ActivityType, ActivityOutcome, Activity, DailyStats
from .engine import ActivityEngine

class ActivityTrackerAgent(ActivityEngine):
    """Refactored Activity Tracker Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Activity Tracker"
        self.status = "ready"

    def get_goal_progress(self) -> Dict:
        stats = self.get_today_stats()
        return {k: {"current": getattr(stats, k if k != 'talk_time' else 'talk_time_mins'), "goal": g, "percent": (getattr(stats, k if k != 'talk_time' else 'talk_time_mins') / g * 100) if g else 0} for k, g in self.DAILY_GOALS.items()}

__all__ = ['ActivityTrackerAgent', 'ActivityType', 'ActivityOutcome', 'Activity', 'DailyStats']
