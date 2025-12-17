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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class GrowthMetric(Enum):
    """Growth metrics."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    TEAM = "team"
    PROJECTS = "projects"
    MRR = "mrr"


class MilestoneType(Enum):
    """Milestone types."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    TEAM = "team"
    ANNIVERSARY = "anniversary"


@dataclass
class GrowthData:
    """Growth data point."""
    metric: GrowthMetric
    current: float
    previous: float
    period: str = "MoM"
    
    @property
    def growth_rate(self) -> float:
        return ((self.current - self.previous) / self.previous * 100) if self.previous else 0
    
    @property
    def delta(self) -> float:
        return self.current - self.previous


@dataclass
class Milestone:
    """A growth milestone."""
    id: str
    type: MilestoneType
    name: str
    achieved_at: datetime
    value: float


class GrowthTracker:
    """
    Growth Tracker.
    
    Track agency growth.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.growth_data: List[GrowthData] = []
        self.milestones: List[Milestone] = []
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default data."""
        self.growth_data = [
            GrowthData(GrowthMetric.REVENUE, 45000, 40000),
            GrowthData(GrowthMetric.CLIENTS, 15, 13),
            GrowthData(GrowthMetric.TEAM, 12, 10),
            GrowthData(GrowthMetric.PROJECTS, 18, 15),
            GrowthData(GrowthMetric.MRR, 28000, 25000),
        ]
        
        self.milestones = [
            Milestone("MS-001", MilestoneType.REVENUE, "$100K Revenue", datetime.now() - timedelta(days=180), 100000),
            Milestone("MS-002", MilestoneType.CLIENTS, "10 Clients", datetime.now() - timedelta(days=120), 10),
            Milestone("MS-003", MilestoneType.TEAM, "10 Team Members", datetime.now() - timedelta(days=60), 10),
            Milestone("MS-004", MilestoneType.ANNIVERSARY, "1 Year Anniversary", datetime.now() - timedelta(days=30), 1),
        ]
    
    def add_milestone(
        self,
        milestone_type: MilestoneType,
        name: str,
        value: float
    ) -> Milestone:
        """Add a milestone."""
        milestone = Milestone(
            id=f"MS-{uuid.uuid4().hex[:6].upper()}",
            type=milestone_type,
            name=name,
            achieved_at=datetime.now(),
            value=value
        )
        self.milestones.append(milestone)
        return milestone
    
    def get_growth_streak(self) -> int:
        """Get consecutive months of growth."""
        # Simulated
        return 8
    
    def format_dashboard(self) -> str:
        """Format growth dashboard."""
        streak = self.get_growth_streak()
        total_growth = sum(g.growth_rate for g in self.growth_data) / len(self.growth_data)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 GROWTH TRACKER                                        ║",
            f"║  {total_growth:.1f}% avg growth │ {streak} month streak 🔥            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 GROWTH METRICS (MoM)                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        metric_icons = {"revenue": "💰", "clients": "👥", "team": "👨‍💼", "projects": "📁", "mrr": "🔄"}
        
        for data in self.growth_data:
            icon = metric_icons.get(data.metric.value, "📊")
            trend = "↑" if data.growth_rate > 0 else ("↓" if data.growth_rate < 0 else "→")
            color = "🟢" if data.growth_rate > 0 else ("🔴" if data.growth_rate < 0 else "⚪")
            
            current = f"{data.current:,.0f}"
            lines.append(f"║  {icon} {data.metric.value.upper():<10} │ {current:>10} │ {color} {trend}{abs(data.growth_rate):>5.1f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏆 MILESTONES ACHIEVED                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"revenue": "💰", "clients": "👥", "team": "👨‍💼", "anniversary": "🎂"}
        
        for milestone in self.milestones[-4:]:
            icon = type_icons.get(milestone.type.value, "🏆")
            date = milestone.achieved_at.strftime("%b %d")
            lines.append(f"║    {icon} {milestone.name:<30} │ {date:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 NEXT MILESTONES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🎯 $500K Revenue            (85% there)                ║",
            "║    🎯 20 Clients               (75% there)                ║",
            "║                                                           ║",
            "║  [📊 History]  [🎯 Set Goals]  [🎉 Celebrate]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Growing strong!                  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    tracker = GrowthTracker("Saigon Digital Hub")
    
    print("📈 Growth Tracker")
    print("=" * 60)
    print()
    
    print(tracker.format_dashboard())
