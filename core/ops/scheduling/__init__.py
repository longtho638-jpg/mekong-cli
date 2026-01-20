"""
Scheduler Facade and Dashboard.
"""
from .engine import SchedulerEngine
from .models import Meeting, MeetingStatus, MeetingType


class Scheduler(SchedulerEngine):
    def __init__(self, owner: str = "Alex"):
        super().__init__(owner)

    def format_dashboard(self) -> str:
        return f"📅 Scheduler Dashboard - {self.owner}"

__all__ = ['Scheduler', 'MeetingType', 'MeetingStatus', 'Meeting']
