"""
Calendar synchronization and conflict detection logic.
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Dict, List, Tuple

from .models import CalendarConnection, CalendarEvent, CalendarProvider, SyncStatus

logger = logging.getLogger(__name__)

class SyncEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.connections: Dict[str, CalendarConnection] = {}
        self.events: List[CalendarEvent] = []

    def _validate_email(self, email: str) -> bool:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def connect(self, provider: CalendarProvider, email: str) -> CalendarConnection:
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")
        conn = CalendarConnection(id=f"CAL-{uuid.uuid4().hex[:6].upper()}", provider=provider, email=email)
        self.connections[conn.id] = conn
        logger.info(f"Connected {provider.value} calendar for {email}")
        return conn

    def add_event(self, title: str, start: datetime, end: datetime, provider: CalendarProvider = CalendarProvider.INTERNAL) -> CalendarEvent:
        if not title: raise ValueError("Event title cannot be empty")
        event = CalendarEvent(id=f"EVT-{uuid.uuid4().hex[:6].upper()}", title=title, start=start, end=end, provider=provider)
        self.events.append(event)
        logger.info(f"Added event: {title}")
        return event

    def detect_conflicts(self) -> List[Tuple[CalendarEvent, CalendarEvent]]:
        conflicts = []
        sorted_events = sorted(self.events, key=lambda x: x.start)
        for i, e1 in enumerate(sorted_events):
            for e2 in sorted_events[i + 1 :]:
                if e2.start < e1.end: conflicts.append((e1, e2))
                else: break
        return conflicts

    def sync_all(self) -> Dict[str, int]:
        results = {"synced": 0, "conflicts": 0, "failed": 0}
        conflicts = self.detect_conflicts()
        conflict_ids = {e.id for pair in conflicts for e in pair}
        for event in self.events:
            if event.id in conflict_ids:
                event.sync_status = SyncStatus.CONFLICT
                results["conflicts"] += 1
            elif event.sync_status == SyncStatus.PENDING:
                event.sync_status = SyncStatus.SYNCED
                results["synced"] += 1
        sync_time = datetime.now()
        for conn in self.connections.values():
            if conn.connected:
                conn.last_sync = sync_time
                conn.events_synced = results["synced"]
        return results
