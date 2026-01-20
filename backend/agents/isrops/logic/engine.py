"""
Activity Tracker core engine logic.
"""
import random
from datetime import date, datetime
from typing import Dict, List
from .models import Activity, ActivityType, ActivityOutcome, DailyStats

class ActivityEngine:
    DAILY_GOALS = {"calls": 50, "emails": 30, "meetings": 3, "talk_time_mins": 120}

    def __init__(self):
        self.activities: List[Activity] = []

    def log_activity(self, a_type: ActivityType, prospect_id: str, name: str, outcome: ActivityOutcome, duration: int = 0, notes: str = "") -> Activity:
        activity = Activity(id=f"act_{int(datetime.now().timestamp())}_{random.randint(100, 999)}", activity_type=a_type, prospect_id=prospect_id, prospect_name=name, outcome=outcome, duration_mins=duration, notes=notes)
        self.activities.append(activity)
        return activity

    def get_today_stats(self) -> DailyStats:
        today = date.today()
        today_acts = [a for a in self.activities if a.created_at.date() == today]
        return DailyStats(
            date=today,
            calls=len([a for a in today_acts if a.activity_type == ActivityType.CALL]),
            emails=len([a for a in today_acts if a.activity_type == ActivityType.EMAIL]),
            meetings=len([a for a in today_acts if a.activity_type == ActivityType.MEETING]),
            talk_time_mins=sum(a.duration_mins for a in today_acts),
            connects=len([a for a in today_acts if a.outcome == ActivityOutcome.CONNECTED])
        )
