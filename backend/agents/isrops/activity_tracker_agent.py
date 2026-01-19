"""
Activity Tracker Agent - Sales Activity Logging
Tracks calls, emails, meetings, and daily activities.
"""

import random
from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Dict, List


class ActivityType(Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    LINKEDIN = "linkedin"
    NOTE = "note"


class ActivityOutcome(Enum):
    COMPLETED = "completed"
    NO_ANSWER = "no_answer"
    LEFT_VOICEMAIL = "left_voicemail"
    CONNECTED = "connected"
    SCHEDULED = "scheduled"


@dataclass
class Activity:
    """Sales activity"""

    id: str
    activity_type: ActivityType
    prospect_id: str
    prospect_name: str
    outcome: ActivityOutcome
    duration_mins: int = 0
    notes: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


@dataclass
class DailyStats:
    """Daily activity statistics"""

    date: date
    calls: int = 0
    emails: int = 0
    meetings: int = 0
    talk_time_mins: int = 0
    connects: int = 0


class ActivityTrackerAgent:
    """
    Activity Tracker Agent - Theo dõi Hoạt động

    Responsibilities:
    - Log sales activities
    - Track daily metrics
    - Call analytics
    - Activity summaries
    """

    # Daily goals
    DAILY_GOALS = {"calls": 50, "emails": 30, "meetings": 3, "talk_time_mins": 120}

    def __init__(self):
        self.name = "Activity Tracker"
        self.status = "ready"
        self.activities: List[Activity] = []

    def log_call(
        self,
        prospect_id: str,
        prospect_name: str,
        outcome: ActivityOutcome,
        duration_mins: int = 0,
        notes: str = "",
    ) -> Activity:
        """Log a call activity"""
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

    def log_meeting(
        self, prospect_id: str, prospect_name: str, duration_mins: int, notes: str = ""
    ) -> Activity:
        """Log a meeting activity"""
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
            "calls": {
                "current": stats.calls,
                "goal": self.DAILY_GOALS["calls"],
                "percent": min(100, stats.calls / self.DAILY_GOALS["calls"] * 100),
            },
            "emails": {
                "current": stats.emails,
                "goal": self.DAILY_GOALS["emails"],
                "percent": min(100, stats.emails / self.DAILY_GOALS["emails"] * 100),
            },
            "meetings": {
                "current": stats.meetings,
                "goal": self.DAILY_GOALS["meetings"],
                "percent": min(100, stats.meetings / self.DAILY_GOALS["meetings"] * 100),
            },
            "talk_time": {
                "current": stats.talk_time_mins,
                "goal": self.DAILY_GOALS["talk_time_mins"],
                "percent": min(
                    100, stats.talk_time_mins / self.DAILY_GOALS["talk_time_mins"] * 100
                ),
            },
        }

    def get_recent_activities(self, count: int = 10) -> List[Activity]:
        """Get most recent activities"""
        return sorted(self.activities, key=lambda a: a.created_at, reverse=True)[:count]


# Demo
if __name__ == "__main__":
    agent = ActivityTrackerAgent()

    print("📊 Activity Tracker Agent Demo\n")

    # Log activities
    agent.log_call("p1", "Nguyễn A", ActivityOutcome.CONNECTED, 12, "Great call")
    agent.log_call("p2", "Trần B", ActivityOutcome.NO_ANSWER, 0)
    agent.log_email("p1", "Nguyễn A", "Sent intro email")
    agent.log_meeting("p3", "Lê C", 30, "Discovery call")

    print("✅ Logged 4 activities")

    # Today stats
    stats = agent.get_today_stats()
    print("\n📈 Today's Stats:")
    print(f"   Calls: {stats.calls}")
    print(f"   Emails: {stats.emails}")
    print(f"   Meetings: {stats.meetings}")
    print(f"   Talk Time: {stats.talk_time_mins} mins")

    # Goal progress
    print("\n🎯 Goal Progress:")
    progress = agent.get_goal_progress()
    for key, val in progress.items():
        print(f"   {key}: {val['current']}/{val['goal']} ({val['percent']:.0f}%)")
