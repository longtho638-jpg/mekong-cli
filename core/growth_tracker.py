"""
📈 Growth Tracker - Agency Growth Metrics
===========================================

Track agency growth over time.
Celebrate the wins!

Features:
- Growth milestones
- YoY comparison
- Growth streaks
- Celebration triggers
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GrowthMetric(Enum):
    """Growth performance metrics."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    TEAM = "team"
    PROJECTS = "projects"
    MRR = "mrr"


class MilestoneType(Enum):
    """Types of significant business milestones."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    TEAM = "team"
    ANNIVERSARY = "anniversary"


@dataclass
class GrowthData:
    """Growth performance record entity."""
    metric: GrowthMetric
    current: float
    previous: float
    period: str = "MoM"
    
    @property
    def growth_rate(self) -> float:
        """Percentage growth from previous period."""
        return ((self.current - self.previous) / self.previous * 100) if self.previous else 0.0
    
    @property
    def delta(self) -> float:
        """Numerical difference between periods."""
        return self.current - self.previous


@dataclass
class Milestone:
    """A historical business milestone entity."""
    id: str
    type: MilestoneType
    name: str
    achieved_at: datetime = field(default_factory=datetime.now)
    value: float = 0.0


class GrowthTracker:
    """
    Growth Tracker System.
    
    Monitors high-level agency growth metrics, streaks, and milestone achievements.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.growth_data: List[GrowthData] = []
        self.milestones: List[Milestone] = []
        
        logger.info(f"Growth Tracker initialized for {agency_name}")
        self._load_defaults()
    
    def _load_defaults(self):
        """Seed the system with sample growth data."""
        logger.info("Loading demo growth history...")
        self.growth_data = [
            GrowthData(GrowthMetric.REVENUE, 45000.0, 40000.0),
            GrowthData(GrowthMetric.CLIENTS, 15.0, 13.0),
            GrowthData(GrowthMetric.MRR, 28000.0, 25000.0),
        ]
        
        self.milestones = [
            Milestone(f"MS-{uuid.uuid4().hex[:4].upper()}", MilestoneType.REVENUE, "$100K ARR", datetime.now() - timedelta(days=180), 100000.0),
            Milestone(f"MS-{uuid.uuid4().hex[:4].upper()}", MilestoneType.CLIENTS, "First 10 Clients", datetime.now() - timedelta(days=120), 10.0),
        ]
    
    def record_milestone(
        self,
        m_type: MilestoneType,
        name: str,
        value: float
    ) -> Milestone:
        """Register a new major accomplishment."""
        if not name:
            raise ValueError("Milestone name required")

        m = Milestone(
            id=f"MS-{uuid.uuid4().hex[:6].upper()}",
            type=m_type, name=name, value=value
        )
        self.milestones.append(m)
        logger.info(f"🎉 MILESTONE ACHIEVED: {name}")
        return m
    
    def format_dashboard(self) -> str:
        """Render the Growth Dashboard."""
        avg_growth = sum(g.growth_rate for g in self.growth_data) / len(self.growth_data) if self.growth_data else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 GROWTH TRACKER - {self.agency_name.upper()[:28]:<28} ║",
            f"║  {avg_growth:.1f}% avg growth │ 8 month streak 🔥 {' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 GROWTH METRICS (MoM)                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        icons = {GrowthMetric.REVENUE: "💰", GrowthMetric.CLIENTS: "👥", GrowthMetric.MRR: "🔄"}
        
        for d in self.growth_data:
            icon = icons.get(d.metric, "📊")
            trend = "↑" if d.growth_rate > 0 else "↓"
            status = "🟢" if d.growth_rate > 0 else "🔴"
            
            lines.append(f"║  {icon} {d.metric.value.upper():<10} │ {d.current:>10,.0f} │ {status} {trend}{abs(d.growth_rate):>5.1f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏆 HISTORICAL MILESTONES                                 ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for m in self.milestones[-3:]:
            icon = "🏆" if m.type != MilestoneType.ANNIVERSARY else "🎂"
            lines.append(f"║    {icon} {m.name:<30} │ {m.achieved_at.strftime('%b %d')}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 History]  [🎯 Set Goals]  [🎉 Celebrate]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Momentum!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📈 Initializing Growth System...")
    print("=" * 60)
    
    try:
        tracker = GrowthTracker("Saigon Digital Hub")
        print("\n" + tracker.format_dashboard())
        
    except Exception as e:
        logger.error(f"Growth Error: {e}")
