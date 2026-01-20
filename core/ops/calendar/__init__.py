"""
Calendar Sync Facade and Dashboard rendering.
"""
from .engine import SyncEngine
from .models import CalendarConnection, CalendarEvent, CalendarProvider, SyncStatus


class CalendarSync(SyncEngine):
    """
    Calendar Sync Manager System.
    Orchestrates events across multiple calendar providers.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

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
        provider_icons = {CalendarProvider.GOOGLE: "📆 Google", CalendarProvider.OUTLOOK: "📧 Outlook", CalendarProvider.APPLE: "🍎 Apple", CalendarProvider.INTERNAL: "🏢 Internal"}
        for conn in self.connections.values():
            icon = provider_icons.get(conn.provider, "📅")
            status = "🟢" if conn.connected else "🔴"
            sync_time = conn.last_sync.strftime("%H:%M") if conn.last_sync else "Never"
            lines.append(f"║  {status} {icon:<12} │ {conn.email[:25]:<25} │ {sync_time:<5}  ║")

        lines.extend(["║                                                           ║", "║  📋 UPCOMING EVENTS                                       ║", "║  ───────────────────────────────────────────────────────  ║"])
        sorted_events = sorted(self.events, key=lambda x: x.start)[:4]
        for event in sorted_events:
            time_str = event.start.strftime("%m/%d %H:%M")
            s_icon = {SyncStatus.SYNCED: "✅", SyncStatus.PENDING: "⏳", SyncStatus.CONFLICT: "⚠️", SyncStatus.FAILED: "❌"}.get(event.sync_status, "❓")
            lines.append(f"║    {s_icon} {time_str} - {event.title[:35]:<35}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [🔄 Sync Now]  [➕ Add Event]  [⚙️ Settings]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Scheduling!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
