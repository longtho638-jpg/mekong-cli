"""
Activity Tracker Agent - Sales Activity Logging (Refactored)
"""

import random
from datetime import date
from typing import Dict, List

from .models import Activity, ActivityOutcome, ActivityType, DailyStats


class ActivityTrackerAgent:
    """
    Activity Tracker Agent - Theo dõi Hoạt động
    """

    # Daily goals
    DAILY_GOALS = {"calls": 50, "emails": 30, "meetings": 3, "talk_time_mins": 120}

    def __init__(self):
        self.name = "Activity Tracker"
        self.status = "ready"
        self.activities: List[Activity] = []

    def log_call(self, prospect_id: str, prospect_name: str, outcome: ActivityOutcome,
                 duration_mins: int = 0, notes: str = "") -> Activity:
        """Log a call activity"""
        from datetime import datetime
        activity = Activity(
            id=f"act_{int(datetime.now().timestamp())}_{random.randint(100, 999)}",
            activity_type=ActivityType.CALL,
            prospect_id=prospect_id,
            prospect_name=prospect_name,
            outcome=outcome,
            duration_mins=duration_mins,
            notes=notes,
        )
        self.activities.append(activity)
        return activity

    def log_email(self, prospect_id: str, prospect_name: str, notes: str = "") -> Activity:
        """Log an email activity"""
        from datetime import datetime
        activity = Activity(
            id=f"act_{int(datetime.now().timestamp())}_{random.randint(100, 999)}",
            activity_type=ActivityType.EMAIL,
            prospect_id=prospect_id,
            prospect_name=prospect_name,
            outcome=ActivityOutcome.COMPLETED,
            notes=notes,
        )
        self.activities.append(activity)
        return activity

    def log_meeting(self, prospect_id: str, prospect_name: str, duration_mins: int, notes: str = "") -> Activity:
        """Log a meeting activity"""
        from datetime import datetime
        activity = Activity(
            id=f"act_{int(datetime.now().timestamp())}_{random.randint(100, 999)}",
            activity_type=ActivityType.MEETING,
            prospect_id=prospect_id,
            prospect_name=prospect_name,
            outcome=ActivityOutcome.COMPLETED,
            duration_mins=duration_mins,
            notes=notes,
        )
        self.activities.append(activity)
        return activity

    def get_today_stats(self) -> DailyStats:
        """Get today's activity stats"""
        today = date.today()
        today_activities = [a for a in self.activities if a.created_at.date() == today]

        calls = [a for a in today_activities if a.activity_type == ActivityType.CALL]
        emails = [a for a in today_activities if a.activity_type == ActivityType.EMAIL]
        meetings = [a for a in today_activities if a.activity_type == ActivityType.MEETING]

        return DailyStats(
            date=today,
            calls=len(calls),
            emails=len(emails),
            meetings=len(meetings),
            talk_time_mins=sum(a.duration_mins for a in calls + meetings),
            connects=len([a for a in calls if a.outcome == ActivityOutcome.CONNECTED]),
        )

    def get_goal_progress(self) -> Dict:
        """Get progress towards daily goals"""
        stats = self.get_today_stats()
        return {
            "calls": {"current": stats.calls, "goal": self.DAILY_GOALS["calls"],
                      "percent": min(100, stats.calls / self.DAILY_GOALS["calls"] * 100)},
            "emails": {"current": stats.emails, "goal": self.DAILY_GOALS["emails"],
                       "percent": min(100, stats.emails / self.DAILY_GOALS["emails"] * 100)},
            "meetings": {"current": stats.meetings, "goal": self.DAILY_GOALS["meetings"],
                         "percent": min(100, stats.meetings / self.DAILY_GOALS["meetings"] * 100)},
            "talk_time": {"current": stats.talk_time_mins, "goal": self.DAILY_GOALS["talk_time_mins"],
                          "percent": min(100, stats.talk_time_mins / self.DAILY_GOALS["talk_time_mins"] * 100)},
        }

    def get_recent_activities(self, count: int = 10) -> List[Activity]:
        """Get most recent activities"""
        return sorted(self.activities, key=lambda a: a.created_at, reverse=True)[:count]
