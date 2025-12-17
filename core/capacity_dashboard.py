"""
📊 Capacity Dashboard - Agency Capacity Overview
==================================================

Visual capacity overview.
Know when to hire or pause!

Features:
- Capacity visualization
- Bottleneck detection
- Hiring signals
- Workload balancing
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class CapacityLevel(Enum):
    """Capacity levels."""
    UNDERLOADED = "underloaded"  # < 60%
    OPTIMAL = "optimal"          # 60-85%
    HIGH = "high"                # 85-95%
    OVERLOADED = "overloaded"    # > 95%


@dataclass
class DepartmentCapacity:
    """Capacity for a department."""
    name: str
    total_hours: int
    used_hours: int
    members_count: int
    projects_count: int = 0


class CapacityDashboard:
    """
    Capacity Dashboard.
    
    Agency capacity overview.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.departments: Dict[str, DepartmentCapacity] = {}
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default departments."""
        defaults = [
            ("SEO", 160, 140, 4, 8),
            ("Design", 120, 105, 3, 6),
            ("Development", 200, 180, 5, 4),
            ("Content", 80, 65, 2, 10),
            ("Strategy", 80, 72, 2, 5),
        ]
        
        for name, total, used, members, projects in defaults:
            self.departments[name] = DepartmentCapacity(
                name=name,
                total_hours=total,
                used_hours=used,
                members_count=members,
                projects_count=projects
            )
    
    def get_utilization(self, dept: DepartmentCapacity) -> float:
        """Get department utilization."""
        return (dept.used_hours / dept.total_hours * 100) if dept.total_hours else 0
    
    def get_level(self, dept: DepartmentCapacity) -> CapacityLevel:
        """Get capacity level."""
        util = self.get_utilization(dept)
        if util < 60:
            return CapacityLevel.UNDERLOADED
        elif util <= 85:
            return CapacityLevel.OPTIMAL
        elif util <= 95:
            return CapacityLevel.HIGH
        else:
            return CapacityLevel.OVERLOADED
    
    def get_bottlenecks(self) -> List[DepartmentCapacity]:
        """Get overloaded departments."""
        return [d for d in self.departments.values() 
                if self.get_level(d) in [CapacityLevel.HIGH, CapacityLevel.OVERLOADED]]
    
    def get_hiring_signals(self) -> List[str]:
        """Get hiring recommendations."""
        signals = []
        for dept in self.departments.values():
            util = self.get_utilization(dept)
            if util > 90:
                signals.append(f"🔴 Hire for {dept.name} (at {util:.0f}%)")
            elif util > 85:
                signals.append(f"🟠 Consider {dept.name} hire soon")
        return signals
    
    def format_dashboard(self) -> str:
        """Format capacity dashboard."""
        total_hours = sum(d.total_hours for d in self.departments.values())
        used_hours = sum(d.used_hours for d in self.departments.values())
        overall = (used_hours / total_hours * 100) if total_hours else 0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 CAPACITY DASHBOARD                                    ║",
            f"║  Overall: {overall:.0f}% │ {used_hours}h / {total_hours}h                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 DEPARTMENT CAPACITY                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"underloaded": "🟢", "optimal": "💚", "high": "🟠", "overloaded": "🔴"}
        
        for dept in self.departments.values():
            level = self.get_level(dept)
            icon = level_icons[level.value]
            util = self.get_utilization(dept)
            bar = "█" * int(util / 10) + "░" * (10 - int(util / 10))
            
            lines.append(f"║  {icon} {dept.name:<12} │ {bar} │ {util:>3.0f}% │ {dept.members_count}👥  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ SIGNALS                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        signals = self.get_hiring_signals()
        if signals:
            for signal in signals[:3]:
                lines.append(f"║    {signal:<50}  ║")
        else:
            lines.append("║    ✅ All departments at healthy capacity              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 BOTTLENECKS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        bottlenecks = self.get_bottlenecks()
        if bottlenecks:
            for dept in bottlenecks[:2]:
                lines.append(f"║    🚨 {dept.name}: {dept.projects_count} projects, {dept.members_count} members         ║")
        else:
            lines.append("║    ✅ No bottlenecks detected                           ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Details]  [⚖️ Rebalance]  [👥 Hiring Plan]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Capacity optimized!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    dashboard = CapacityDashboard("Saigon Digital Hub")
    
    print("📊 Capacity Dashboard")
    print("=" * 60)
    print()
    
    print(dashboard.format_dashboard())
