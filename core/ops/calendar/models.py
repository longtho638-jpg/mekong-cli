"""
Data models and Enums for Calendar Sync.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class CalendarProvider(Enum):
    """Calendar providers."""
    GOOGLE = "google"
    OUTLOOK = "outlook"
    APPLE = "apple"
    INTERNAL = "internal"

class SyncStatus(Enum):
    """Sync status."""
    SYNCED = "synced"
    PENDING = "pending"
    FAILED = "failed"
    CONFLICT = "conflict"

@dataclass
class CalendarEvent:
    """A calendar event entity."""
    id: str
    title: str
    start: datetime
    end: datetime
    provider: CalendarProvider
    external_id: str = ""
    sync_status: SyncStatus = SyncStatus.PENDING

    def __post_init__(self):
        if self.end <= self.start:
            raise ValueError(f"Event '{self.title}' end time must be after start time")

@dataclass
class CalendarConnection:
    """A connected external calendar account."""
    id: str
    provider: CalendarProvider
    email: str
    connected: bool = True
    last_sync: Optional[datetime] = None
    events_synced: int = 0
