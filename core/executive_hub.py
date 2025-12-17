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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class DepartmentStatus(Enum):
    """Department health status."""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class DepartmentSummary:
    """Summary of a department."""
    name: str
    icon: str
    status: DepartmentStatus
    key_metric: str
    metric_value: str
    trend: str = "stable"


@dataclass
class ExecutiveKPI:
    """An executive-level KPI."""
    name: str
    current: float
    target: float
    unit: str = ""
    trend: str = "stable"


@dataclass
class StrategicPriority:
    """A strategic priority item."""
    title: str
    owner: str
    progress: int  # 0-100
    status: str


class ExecutiveHub:
    """
    Executive Hub - CEO Command Center.
    
    See the entire agency at a glance.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.departments: List[DepartmentSummary] = []
        self.kpis: List[ExecutiveKPI] = []
        self.priorities: List[StrategicPriority] = []
        
        # Initialize with department summaries
        self._init_departments()
        self._init_kpis()
        self._init_priorities()
    
    def _init_departments(self):
        """Initialize department summaries."""
        self.departments = [
            DepartmentSummary("Sales", "💰", DepartmentStatus.HEALTHY, "Pipeline", "$125K", "up"),
            DepartmentSummary("Marketing", "📢", DepartmentStatus.HEALTHY, "ROI", "+254%", "up"),
            DepartmentSummary("Finance", "💵", DepartmentStatus.HEALTHY, "Cash Flow", "$85K", "stable"),
            DepartmentSummary("IT", "💻", DepartmentStatus.HEALTHY, "Uptime", "99.9%", "stable"),
            DepartmentSummary("HR", "👥", DepartmentStatus.HEALTHY, "Headcount", "25", "up"),
            DepartmentSummary("Customer Success", "🎯", DepartmentStatus.HEALTHY, "NPS", "72", "up"),
            DepartmentSummary("Operations", "⚙️", DepartmentStatus.WARNING, "Efficiency", "85%", "down"),
            DepartmentSummary("Strategy", "🎯", DepartmentStatus.HEALTHY, "OKR Progress", "78%", "up"),
        ]
    
    def _init_kpis(self):
        """Initialize executive KPIs."""
        self.kpis = [
            ExecutiveKPI("Revenue (MRR)", 85000, 100000, "$", "up"),
            ExecutiveKPI("Profit Margin", 32, 35, "%", "stable"),
            ExecutiveKPI("Client Count", 42, 50, "", "up"),
            ExecutiveKPI("Team Size", 25, 30, "", "up"),
            ExecutiveKPI("Client Retention", 94, 95, "%", "stable"),
            ExecutiveKPI("Employee NPS", 68, 75, "", "up"),
        ]
    
    def _init_priorities(self):
        """Initialize strategic priorities."""
        self.priorities = [
            StrategicPriority("Scale to $100K MRR", "CEO", 85, "on_track"),
            StrategicPriority("Launch AgencyOS Platform", "CTO", 60, "in_progress"),
            StrategicPriority("Expand Team to 30", "CHRO", 83, "on_track"),
            StrategicPriority("Enter SEA Markets", "CSO", 25, "planning"),
        ]
    
    def update_department(self, name: str, status: DepartmentStatus, metric_value: str, trend: str = "stable"):
        """Update department status."""
        for dept in self.departments:
            if dept.name == name:
                dept.status = status
                dept.metric_value = metric_value
                dept.trend = trend
                break
    
    def update_kpi(self, name: str, current: float, trend: str = "stable"):
        """Update a KPI value."""
        for kpi in self.kpis:
            if kpi.name == name:
                kpi.current = current
                kpi.trend = trend
                break
    
    def update_priority(self, title: str, progress: int, status: str):
        """Update priority progress."""
        for priority in self.priorities:
            if priority.title == title:
                priority.progress = progress
                priority.status = status
                break
    
    def get_health_score(self) -> int:
        """Calculate overall agency health score."""
        healthy = sum(1 for d in self.departments if d.status == DepartmentStatus.HEALTHY)
        return int((healthy / len(self.departments)) * 100)
    
    def get_kpi_achievement(self) -> float:
        """Calculate KPI achievement percentage."""
        total = sum(min(100, (kpi.current / kpi.target) * 100) for kpi in self.kpis)
        return total / len(self.kpis)
    
    def format_dashboard(self) -> str:
        """Format executive dashboard."""
        health = self.get_health_score()
        achievement = self.get_kpi_achievement()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👑 EXECUTIVE HUB - CEO COMMAND CENTER                    ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏢 AGENCY HEALTH                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        health_bar = "█" * (health // 10) + "░" * (10 - health // 10)
        health_icon = "🟢" if health >= 80 else "🟡" if health >= 60 else "🔴"
        
        lines.append(f"║    {health_icon} Overall Health: {health_bar} {health:>3}%          ║")
        lines.append(f"║    📊 KPI Achievement: {achievement:.0f}%                              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏢 DEPARTMENTS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"healthy": "🟢", "warning": "🟡", "critical": "🔴"}
        trend_icons = {"up": "📈", "down": "📉", "stable": "➡️"}
        
        for dept in self.departments[:4]:
            s_icon = status_icons.get(dept.status.value, "⚪")
            t_icon = trend_icons.get(dept.trend, "➡️")
            lines.append(f"║  {s_icon} {dept.icon} {dept.name:<12} │ {dept.key_metric}: {dept.metric_value:<8} {t_icon}  ║")
        
        for dept in self.departments[4:]:
            s_icon = status_icons.get(dept.status.value, "⚪")
            t_icon = trend_icons.get(dept.trend, "➡️")
            lines.append(f"║  {s_icon} {dept.icon} {dept.name:<12} │ {dept.key_metric}: {dept.metric_value:<8} {t_icon}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 EXECUTIVE KPIs                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for kpi in self.kpis[:4]:
            pct = min(100, (kpi.current / kpi.target) * 100)
            bar = "█" * int(pct / 20) + "░" * (5 - int(pct / 20))
            t_icon = trend_icons.get(kpi.trend, "➡️")
            lines.append(f"║    {kpi.name:<18} │ {bar} │ {kpi.current:>6,.0f}/{kpi.target:,.0f}{kpi.unit} {t_icon}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🎯 STRATEGIC PRIORITIES                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        priority_icons = {"on_track": "🟢", "in_progress": "🔄", "at_risk": "🟡", "planning": "📋"}
        
        for priority in self.priorities:
            p_icon = priority_icons.get(priority.status, "⚪")
            bar = "█" * (priority.progress // 20) + "░" * (5 - priority.progress // 20)
            lines.append(f"║  {p_icon} {priority.title[:22]:<22} │ {bar} {priority.progress:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Reports]  [🏢 Depts]  [🎯 Strategy]  [👥 Team]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Lead with clarity!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = ExecutiveHub("Saigon Digital Hub")
    
    print("👑 Executive Hub")
    print("=" * 60)
    print()
    
    print(hub.format_dashboard())
