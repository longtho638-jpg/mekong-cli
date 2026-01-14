"""
🤝 Community Hub - Social Impact
==================================

Central hub connecting all Community roles.

Integrates:
- Nonprofit Marketing (nonprofit_marketing.py)
- Community Manager (community_manager.py)
- Event Coordinator (event_coordinator.py)
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import role modules
try:
    from core.nonprofit_marketing import NonprofitMarketing
    from core.community_manager import CommunityManager
    from core.event_coordinator import EventCoordinator
except ImportError:
    # Fallback for direct testing
    from nonprofit_marketing import NonprofitMarketing
    from community_manager import CommunityManager
    from event_coordinator import EventCoordinator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CommunityMetrics:
    """Department-wide metrics container."""
    nonprofit_clients: int = 0
    total_raised: float = 0.0
    community_members: int = 0
    community_health: float = 0.0
    total_events: int = 0
    event_registrations: int = 0


class CommunityHub:
    """
    Community Hub System.
    
    Orchestrates social impact initiatives, community growth, and events.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Community Hub for {agency_name}")
        try:
            self.nonprofit = NonprofitMarketing(agency_name)
            self.community = CommunityManager(agency_name)
            self.events = EventCoordinator(agency_name)
        except Exception as e:
            logger.error(f"Failed to initialize Community sub-modules: {e}")
            raise
    
    def get_department_metrics(self) -> CommunityMetrics:
        """Aggregate metrics from all community sub-modules."""
        metrics = CommunityMetrics()
        
        # 1. Nonprofit Metrics
        try:
            np_stats = self.nonprofit.get_stats()
            metrics.nonprofit_clients = np_stats.get("clients", 0)
            metrics.total_raised = float(np_stats.get("total_raised", 0.0))
        except Exception as e:
            logger.warning(f"Failed to fetch Nonprofit metrics: {e}")

        # 2. Community Metrics
        try:
            cm_stats = self.community.get_stats()
            metrics.community_members = cm_stats.get("members", 0)
            metrics.community_health = float(cm_stats.get("health_score", 0.0))
        except Exception as e:
            logger.warning(f"Failed to fetch Community metrics: {e}")

        # 3. Event Metrics
        try:
            ev_stats = self.events.get_stats()
            metrics.total_events = ev_stats.get("events", 0)
            metrics.event_registrations = ev_stats.get("total_registered", 0)
        except Exception as e:
            logger.warning(f"Failed to fetch Event metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render Community Hub Dashboard."""
        metrics = self.get_department_metrics()
        
        h_icon = "🟢" if metrics.community_health >= 70 else "🟡" if metrics.community_health >= 50 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🤝 COMMUNITY HUB{' ' * 42}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🙏 Nonprofit Clients:  {metrics.nonprofit_clients:>5}                          ║",
            f"║    💰 Total Raised:       ${metrics.total_raised:>10,.0f}                ║",
            f"║    👥 Community Members:  {metrics.community_members:>5}                          ║",
            f"║    {h_icon} Community Health:  {metrics.community_health:>5.0f}%                         ║",
            f"║    📅 Total Events:       {metrics.total_events:>5}                          ║",
            f"║    🎫 Registrations:      {metrics.event_registrations:>5}                          ║",
            "║                                                           ║",
            "║  🔗 COMMUNITY ROLES                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    🙏 Nonprofit Mktg    → Charity clients, fundraising    ║",
            "║    👥 Community Mgr     → Members, volunteers, programs   ║",
            "║    📅 Event Coord       → Virtual/hybrid events           ║",
            "║                                                           ║",
            "║  📋 TEAM SNAPSHOT                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    🙏 Nonprofit         │ {metrics.nonprofit_clients} clients, ${metrics.total_raised:,.0f}    ║",
            f"║    👥 Community         │ {metrics.community_members} members, {metrics.community_health:.0f}% health  ║",
            f"║    📅 Events            │ {metrics.total_events} events, {metrics.event_registrations} reg.  ║",
            "║                                                           ║",
            "║  [🙏 Nonprofit]  [👥 Community]  [📅 Events]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Social Impact!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🤝 Initializing Community Hub...")
    print("=" * 60)
    
    try:
        hub = CommunityHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")
