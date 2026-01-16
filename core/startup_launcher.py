"""
🚀 Startup Launcher - New Ventures
====================================

Launch new products, services, and ventures within the agency network.
Ship fast, learn faster!

Roles:
- Idea validation
- MVP tracking
- Launch planning
- Growth metrics
"""

import uuid
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VentureStage(Enum):
    """Phases of venture development."""
    IDEA = "idea"
    VALIDATION = "validation"
    MVP = "mvp"
    BETA = "beta"
    LAUNCH = "launch"
    GROWTH = "growth"
    SCALE = "scale"


class VentureType(Enum):
    """Categorization of agency-spawned entities."""
    PRODUCT = "product"
    SERVICE = "service"
    SAAS = "saas"
    MARKETPLACE = "marketplace"
    AGENCY_SPINOFF = "agency_spinoff"


class MilestoneStatus(Enum):
    """Lifecycle status of a venture milestone."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


@dataclass
class Venture:
    """A new venture or product entity record."""
    id: str
    name: str
    tagline: str
    venture_type: VentureType
    stage: VentureStage = VentureStage.IDEA
    leads: List[str] = field(default_factory=list)
    investment: float = 0.0
    revenue: float = 0.0
    users: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.name or not self.tagline:
            raise ValueError("Venture name and tagline are required")


@dataclass
class VentureMilestone:
    """A critical objective record for a venture."""
    id: str
    venture_id: str
    title: str
    status: MilestoneStatus = MilestoneStatus.NOT_STARTED
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class StartupLauncher:
    """
    Startup Launcher System.
    
    Orchestrates the incubation of new agency products, from validation to high-scale launch.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.ventures: Dict[str, Venture] = {}
        self.milestones: List[VentureMilestone] = []
        logger.info(f"Startup Launcher initialized for {agency_name}")
    
    def launch_venture(
        self,
        name: str,
        tagline: str,
        v_type: VentureType,
        leads: Optional[List[str]] = None
    ) -> Venture:
        """Initialize a new venture project in the incubator."""
        v = Venture(
            id=f"VNT-{uuid.uuid4().hex[:6].upper()}",
            name=name, tagline=tagline,
            venture_type=v_type, leads=leads or []
        )
        self.ventures[v.id] = v
        logger.info(f"Venture Launched: {name} ({v_type.value})")
        return v
    
    def update_metrics(self, v_id: str, users: int, revenue: float) -> bool:
        """Log real-world usage and performance data for a venture."""
        if v_id not in self.ventures: return False
        
        v = self.ventures[v_id]
        v.users = int(users)
        v.revenue = float(revenue)
        logger.debug(f"Metrics updated for {v.name}: {users} users, ${revenue:,.0f} rev")
        return True
    
    def format_dashboard(self) -> str:
        """Render the Startup Launcher Dashboard."""
        total_inv = sum(v.investment for v in self.ventures.values())
        total_rev = sum(v.revenue for v in self.ventures.values())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🚀 STARTUP LAUNCHER DASHBOARD{' ' * 31}║",
            f"║  {len(self.ventures)} ventures │ ${total_inv:,.0f} invested │ ${total_rev:,.0f} total revenue{' ' * 8}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🎯 INCUBATION PIPELINE                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        icons = {VentureStage.IDEA: "💡", VentureStage.MVP: "🛠️", VentureStage.LAUNCH: "🚀", VentureStage.GROWTH: "📈"}
        
        for v in list(self.ventures.values())[:5]:
            icon = icons.get(v.stage, "⚪")
            lines.append(f"║  {icon} {v.name[:18]:<18} │ {v.users:>8,} users │ {v.stage.value:<12} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [🚀 Launch New]  [🧪 Experiment]  [📊 Growth Audit] [⚙️] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Ship Fast!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🚀 Initializing Launcher System...")
    print("=" * 60)
    
    try:
        launcher = StartupLauncher("Saigon Digital Hub")
        # Seed
        v = launcher.launch_venture("AgencyOS", "AI Hub", VentureType.SAAS)
        launcher.update_metrics(v.id, 1500, 25000.0)
        v.stage = VentureStage.GROWTH
        
        print("\n" + launcher.format_dashboard())
        
    except Exception as e:
        logger.error(f"Launcher Error: {e}")
