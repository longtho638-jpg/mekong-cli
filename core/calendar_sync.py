"""
📅 Calendar Sync - Sync with External Calendars
=================================================

Sync meetings with Google Calendar, Outlook.
Never double-book again!

Features:
- Google Calendar sync
- Outlook sync
- Two-way sync
- Conflict detection
"""

import uuid
import logging
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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


class CalendarSync:
    """
    Calendar Sync Manager System.
    
    Orchestrates events across multiple calendar providers.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.connections: Dict[str, CalendarConnection] = {}
        self.events: List[CalendarEvent] = []
        logger.info(f"Calendar Sync initialized for {agency_name}")

    def _validate_email(self, email: str) -> bool:
        """Basic email format validation."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def connect(self, provider: CalendarProvider, email: str) -> CalendarConnection:
        """Connect a new calendar provider."""
        if not self._validate_email(email):
            logger.error(f"Invalid email for calendar connection: {email}")
            raise ValueError(f"Invalid email: {email}")

        conn = CalendarConnection(
            id=f"CAL-{uuid.uuid4().hex[:6].upper()}",
            provider=provider,
            email=email
        )
        self.connections[conn.id] = conn
        logger.info(f"Connected {provider.value} calendar for {email}")
        return conn

    def add_event(
        self,
        title: str,
        start: datetime,
        end: datetime,
        provider: CalendarProvider = CalendarProvider.INTERNAL
    ) -> CalendarEvent:
        """Add a new event to the calendar."""
        if not title:
            raise ValueError("Event title cannot be empty")

        event = CalendarEvent(
            id=f"EVT-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            start=start,
            end=end,
            provider=provider
        )
        self.events.append(event)
        logger.info(f"Added event: {title} ({start.strftime('%Y-%m-%d %H:%M')})")
        return event

    def sync_all(self) -> Dict[str, int]:
        """Synchronize all pending events with connected providers."""
        results = {"synced": 0, "conflicts": 0, "failed": 0}

        # Detect conflicts before syncing
        conflicts = self.detect_conflicts()
        conflict_event_ids = {e.id for pair in conflicts for e in pair}

        for event in self.events:
            if event.id in conflict_event_ids:
                event.sync_status = SyncStatus.CONFLICT
                results["conflicts"] += 1
                continue

            if event.sync_status == SyncStatus.PENDING:
                # Simulate API call to provider
                event.sync_status = SyncStatus.SYNCED
                results["synced"] += 1

        sync_time = datetime.now()
        for conn in self.connections.values():
            if conn.connected:
                conn.last_sync = sync_time
                conn.events_synced = results["synced"]

        logger.info(f"Sync complete: {results['synced']} synced, {results['conflicts']} conflicts")
        return results

    def detect_conflicts(self) -> List[Tuple[CalendarEvent, CalendarEvent]]:
        """Identify overlapping events."""
        conflicts = []
        # Sort by start time for efficient detection
        sorted_events = sorted(self.events, key=lambda x: x.start)

        for i, e1 in enumerate(sorted_events):
            for e2 in sorted_events[i+1:]:
                # If next event starts before current one ends, it's a conflict
                if e2.start < e1.end:
                    conflicts.append((e1, e2))
                else:
                    # Since it's sorted, no more overlaps for e1 are possible
                    break

        return conflicts

    def format_dashboard(self) -> str:
        """Render Calendar Sync Dashboard."""
        connected_count = sum(1 for c in self.connections.values() if c.connected)
        total_events = len(self.events)
        conflict_count = len(self.detect_conflicts())

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 CALENDAR SYNC{' ' * 42}║",
            f"║  {connected_count} calendars │ {total_events} events │ {conflict_count} conflicts {' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔗 CONNECTED CALENDARS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        provider_icons = {
            CalendarProvider.GOOGLE: "📆 Google",
            CalendarProvider.OUTLOOK: "📧 Outlook",
            CalendarProvider.APPLE: "🍎 Apple",
            CalendarProvider.INTERNAL: "🏢 Internal"
        }

        for conn in self.connections.values():
            icon = provider_icons.get(conn.provider, "📅")
            status = "🟢" if conn.connected else "🔴"
            sync_time = conn.last_sync.strftime("%H:%M") if conn.last_sync else "Never"
            email_display = (conn.email[:23] + '..') if len(conn.email) > 25 else conn.email

            lines.append(f"║  {status} {icon:<12} │ {email_display:<25} │ {sync_time:<5}  ║")

        lines.extend([
            "║                                                           ║",
            "║  📋 UPCOMING EVENTS                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        # Show top 4 upcoming events
        sorted_events = sorted(self.events, key=lambda x: x.start)[:4]
        for event in sorted_events:
            time_str = event.start.strftime("%m/%d %H:%M")
            status_map = {
                SyncStatus.SYNCED: "✅",
                SyncStatus.PENDING: "⏳",
                SyncStatus.CONFLICT: "⚠️",
                SyncStatus.FAILED: "❌"
            }
            s_icon = status_map.get(event.sync_status, "❓")
            title_display = (event.title[:32] + '..') if len(event.title) > 34 else event.title

            lines.append(f"║    {s_icon} {time_str} - {title_display:<35}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [🔄 Sync Now]  [➕ Add Event]  [⚙️ Settings]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Scheduling!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📅 Initializing Calendar Sync...")
    print("=" * 60)

    try:
        sync = CalendarSync("Saigon Digital Hub")

        # Connect calendars
        sync.connect(CalendarProvider.GOOGLE, "team@agency.com")
        sync.connect(CalendarProvider.OUTLOOK, "sales@agency.com")

        # Add events
        now = datetime.now()
        sync.add_event("Client Kickoff", now + timedelta(hours=2), now + timedelta(hours=3))
        sync.add_event("Strategy Review", now + timedelta(hours=4), now + timedelta(hours=5))

        # Add a conflict
        sync.add_event("Overlapping Meet", now + timedelta(hours=2, minutes=30), now + timedelta(hours=3, minutes=30))

        sync.add_event("Team Standup", now + timedelta(days=1), now + timedelta(days=1, hours=1))

        # Sync
        sync.sync_all()

        print("\n" + sync.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
