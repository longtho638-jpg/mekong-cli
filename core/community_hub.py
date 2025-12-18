"""
🤝 Community Hub - Social Impact
==================================

Central hub connecting all Community roles.

Integrates:
- Nonprofit Marketing (nonprofit_marketing.py)
- Community Manager (community_manager.py)
- Event Coordinator (event_coordinator.py)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.nonprofit_marketing import NonprofitMarketing
from core.community_manager import CommunityManager
from core.event_coordinator import EventCoordinator


@dataclass
class CommunityMetrics:
    """Department-wide metrics."""
    nonprofit_clients: int
    total_raised: float
    community_members: int
    community_health: float
    total_events: int
    event_registrations: int


class CommunityHub:
    """
    Community Hub.
    
    Social impact and community building.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.nonprofit = NonprofitMarketing(agency_name)
        self.community = CommunityManager(agency_name)
        self.events = EventCoordinator(agency_name)
    
    def get_department_metrics(self) -> CommunityMetrics:
        """Get department-wide metrics."""
        np_stats = self.nonprofit.get_stats()
        cm_stats = self.community.get_stats()
        ev_stats = self.events.get_stats()
        
        return CommunityMetrics(
            nonprofit_clients=np_stats.get("clients", 0),
            total_raised=np_stats.get("total_raised", 0),
            community_members=cm_stats.get("members", 0),
            community_health=cm_stats.get("health_score", 0),
            total_events=ev_stats.get("events", 0),
            event_registrations=ev_stats.get("total_registered", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        health_icon = "🟢" if metrics.community_health >= 70 else "🟡" if metrics.community_health >= 50 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🤝 COMMUNITY HUB                                         ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🙏 Nonprofit Clients:  {metrics.nonprofit_clients:>5}                          ║",
            f"║    💰 Total Raised:       ${metrics.total_raised:>10,.0f}                ║",
            f"║    👥 Community Members:  {metrics.community_members:>5}                          ║",
            f"║    {health_icon} Community Health:  {metrics.community_health:>5.0f}%                         ║",
            f"║    📅 Total Events:       {metrics.total_events:>5}                          ║",
            f"║    🎫 Registrations:      {metrics.event_registrations:>5}                          ║",
            "║                                                           ║",
            "║  🔗 COMMUNITY ROLES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🙏 Nonprofit Mktg    → Charity clients, fundraising   ║",
            "║    👥 Community Mgr     → Members, volunteers, programs  ║",
            "║    📅 Event Coord       → Virtual/hybrid events          ║",
            "║                                                           ║",
            "║  📋 COMMUNITY TEAM                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    🙏 Nonprofit         │ {metrics.nonprofit_clients} clients, ${metrics.total_raised:,.0f}    ║",
            f"║    👥 Community         │ {metrics.community_members} members, {metrics.community_health:.0f}% health  ║",
            f"║    📅 Events            │ {metrics.total_events} events, {metrics.event_registrations} registered  ║",
            "║                                                           ║",
            "║  [🙏 Nonprofit]  [👥 Community]  [📅 Events]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Make an impact!                 ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = CommunityHub("Saigon Digital Hub")
    
    print("🤝 Community Hub")
    print("=" * 60)
    print()
    
    print(hub.format_hub_dashboard())
