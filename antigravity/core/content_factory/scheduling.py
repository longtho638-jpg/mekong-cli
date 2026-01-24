"""
Content Scheduling Logic.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List, TypedDict

from .models import ContentIdea


class ScheduledPostDict(TypedDict):
    """Data for a scheduled content post"""
    id: int
    date: str
    time: str
    title: str
    type: str
    virality: str


class ContentScheduler:
    """Generates posting schedules."""

    def create_schedule(self, ideas: List[ContentIdea], days: int = 7) -> List[ScheduledPostDict]:
        """Generates a scheduled posting timeline from a list of ideas."""
        calendar: List[ScheduledPostDict] = []
        start_date = datetime.now()

        # We assume the caller ensures enough ideas exist, or we just schedule what we have
        count = min(len(ideas), days)

        for i in range(count):
            idea = ideas[i]
            post_date = start_date + timedelta(days=i)
            calendar.append(
                {
                    "id": i + 1,
                    "date": post_date.strftime("%Y-%m-%d"),
                    "time": "09:00 AM",
                    "title": idea.title,
                    "type": idea.content_type.value,
                    "virality": f"{idea.virality_score}%",
                }
            )

        return calendar
