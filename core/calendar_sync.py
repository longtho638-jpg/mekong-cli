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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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
    """A calendar event."""
    id: str
    title: str
    start: datetime
    end: datetime
    provider: CalendarProvider
    external_id: str = ""
    sync_status: SyncStatus = SyncStatus.PENDING


@dataclass
class CalendarConnection:
    """A connected calendar."""
    id: str
    provider: CalendarProvider
    email: str
    connected: bool = True
    last_sync: Optional[datetime] = None
    events_synced: int = 0


class CalendarSync:
    """
    Calendar Sync Manager.
    
    Sync meetings across calendars.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.connections: Dict[str, CalendarConnection] = {}
        self.events: List[CalendarEvent] = []
    
    def connect(self, provider: CalendarProvider, email: str) -> CalendarConnection:
        """Connect a calendar."""
        conn = CalendarConnection(
            id=f"CAL-{uuid.uuid4().hex[:6].upper()}",
            provider=provider,
            email=email
        )
        self.connections[conn.id] = conn
        return conn
    
    def add_event(
        self,
        title: str,
        start: datetime,
        end: datetime,
        provider: CalendarProvider = CalendarProvider.INTERNAL
    ) -> CalendarEvent:
        """Add a calendar event."""
        event = CalendarEvent(
            id=f"EVT-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            start=start,
            end=end,
            provider=provider
        )
        self.events.append(event)
        return event
    
    def sync_all(self) -> Dict[str, int]:
        """Sync all connected calendars."""
        results = {"synced": 0, "conflicts": 0, "failed": 0}
        
        for event in self.events:
            if event.sync_status == SyncStatus.PENDING:
                # Simulate sync (in real app, would call calendar API)
                event.sync_status = SyncStatus.SYNCED
                results["synced"] += 1
        
        for conn in self.connections.values():
            conn.last_sync = datetime.now()
            conn.events_synced = results["synced"]
        
        return results
    
    def detect_conflicts(self) -> List[tuple]:
        """Detect scheduling conflicts."""
        conflicts = []
        
        for i, event1 in enumerate(self.events):
            for event2 in self.events[i+1:]:
                if (event1.start < event2.end and event1.end > event2.start):
                    conflicts.append((event1, event2))
        
        return conflicts
    
    def format_dashboard(self) -> str:
        """Format sync dashboard."""
        connected = sum(1 for c in self.connections.values() if c.connected)
        total_events = len(self.events)
        conflicts = len(self.detect_conflicts())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📅 CALENDAR SYNC                                         ║",
            f"║  {connected} calendars │ {total_events} events │ {conflicts} conflicts             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔗 CONNECTED CALENDARS                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        provider_icons = {
            CalendarProvider.GOOGLE: "📆 Google",
            CalendarProvider.OUTLOOK: "📧 Outlook",
            CalendarProvider.APPLE: "🍎 Apple",
            CalendarProvider.INTERNAL: "🏢 Internal"
        }
        
        for conn in self.connections.values():
            icon = provider_icons[conn.provider]
            status = "🟢" if conn.connected else "🔴"
            sync_time = conn.last_sync.strftime("%H:%M") if conn.last_sync else "Never"
            
            lines.append(f"║  {status} {icon:<12} │ {conn.email[:25]:<25} │ {sync_time:<5}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 UPCOMING EVENTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for event in self.events[:4]:
            time = event.start.strftime("%m/%d %H:%M")
            status_icon = {"synced": "✅", "pending": "⏳", "conflict": "⚠️"}.get(event.sync_status.value, "❓")
            
            lines.append(f"║    {status_icon} {time} - {event.title[:35]:<35}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔄 Sync Now]  [➕ Add Event]  [⚙️ Settings]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Never double-book!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    sync = CalendarSync("Saigon Digital Hub")
    
    print("📅 Calendar Sync")
    print("=" * 60)
    print()
    
    # Connect calendars
    sync.connect(CalendarProvider.GOOGLE, "team@agency.com")
    sync.connect(CalendarProvider.OUTLOOK, "sales@agency.com")
    
    # Add events
    now = datetime.now()
    sync.add_event("Client Kickoff", now + timedelta(hours=2), now + timedelta(hours=3))
    sync.add_event("Strategy Review", now + timedelta(hours=4), now + timedelta(hours=5))
    sync.add_event("Team Standup", now + timedelta(days=1), now + timedelta(days=1, hours=1))
    
    # Sync
    sync.sync_all()
    
    print(sync.format_dashboard())
