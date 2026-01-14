"""
👑 Executive Hub - CEO Command Center
=======================================

Agency-wide executive dashboard.
See everything, decide fast!

Aggregates all Department Hubs:
- Sales, Marketing, Finance
- IT, HR, Customer Success
- Operations, Strategy
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DepartmentStatus(Enum):
    """Department health status categories."""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class DepartmentSummary:
    """Snapshot data for a single department."""
    name: str
    icon: str
    status: DepartmentStatus
    key_metric: str
    metric_value: str
    trend: str = "stable"


@dataclass
class ExecutiveKPI:
    """An executive-level performance indicator."""
    name: str
    current: float
    target: float
    unit: str = ""
    trend: str = "stable"

    def __post_init__(self):
        if self.target == 0:
            logger.warning(f"KPI {self.name} has zero target.")


@dataclass
class StrategicPriority:
    """A top-level business objective."""
    title: str
    owner: str
    progress: int  # 0-100
    status: str

    def __post_init__(self):
        if not 0 <= self.progress <= 100:
            raise ValueError("Progress must be between 0 and 100")


class ExecutiveHub:
    """
    Executive Hub System.
    
    The ultimate CEO command center for high-level visibility across all agency departments.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.departments: List[DepartmentSummary] = []
        self.kpis: List[ExecutiveKPI] = []
        self.priorities: List[StrategicPriority] = []
        
        logger.info(f"Executive Hub initialized for {agency_name}")
        self._init_defaults()
    
    def _init_defaults(self):
        """Pre-populate with sample agency-wide metrics."""
        self.departments = [
            DepartmentSummary("Sales", "💰", DepartmentStatus.HEALTHY, "Pipeline", "$125K", "up"),
            DepartmentSummary("Marketing", "📢", DepartmentStatus.HEALTHY, "ROI", "+254%", "up"),
            DepartmentSummary("Finance", "💵", DepartmentStatus.HEALTHY, "Cash", "$85K", "stable"),
            DepartmentSummary("Ops", "⚙️", DepartmentStatus.WARNING, "Efficiency", "85%", "down"),
        ]
        
        self.kpis = [
            ExecutiveKPI("Revenue (MRR)", 85000.0, 100000.0, "$", "up"),
            ExecutiveKPI("Profit Margin", 32.0, 35.0, "%", "stable"),
        ]
        
        self.priorities = [
            StrategicPriority("Scale to $100K MRR", "CEO", 85, "on_track"),
            StrategicPriority("AgencyOS Platform", "CTO", 60, "in_progress"),
        ]
    
    def calculate_health_score(self) -> int:
        """Weighted health calculation across all departments."""
        if not self.departments: return 100
        healthy_count = sum(1 for d in self.departments if d.status == DepartmentStatus.HEALTHY)
        return int((healthy_count / len(self.departments)) * 100)
    
    def format_dashboard(self) -> str:
        """Render the complete Executive Dashboard."""
        health = self.calculate_health_score()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👑 EXECUTIVE HUB - CEO COMMAND CENTER{' ' * 20}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏢 OVERALL AGENCY HEALTH                                 ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        h_icon = "🟢" if health >= 80 else "🟡"
        bar = "█" * (health // 10) + "░" * (10 - health // 10)
        lines.append(f"║    {h_icon} Health Score: {bar} {health:>3}%{' ' * 22}║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏢 DEPARTMENT STATUS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for d in self.departments:
            s_icon = "🟢" if d.status == DepartmentStatus.HEALTHY else "🟡"
            t_icon = "📈" if d.trend == "up" else "➡️ "
            lines.append(f"║  {s_icon} {d.icon} {d.name:<12} │ {d.key_metric}: {d.metric_value:<10} {t_icon}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🎯 STRATEGIC PRIORITIES                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for p in self.priorities:
            p_bar = "█" * (p.progress // 20) + "░" * (5 - p.progress // 20)
            lines.append(f"║  🟢 {p.title[:22]:<22} │ {p_bar} {p.progress:>3}% │ {p.owner:<8} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📊 Reports]  [🏢 Depts]  [🎯 Strategy]  [👥 Team]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Clarity!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👑 Initializing Executive Hub...")
    print("=" * 60)
    
    try:
        hub = ExecutiveHub("Saigon Digital Hub")
        print("\n" + hub.format_dashboard())
        
    except Exception as e:
        logger.error(f"Hub Error: {e}")
