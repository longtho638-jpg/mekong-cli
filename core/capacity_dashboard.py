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

import logging
from typing import Dict, List
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CapacityLevel(Enum):
    """Capacity levels."""
    UNDERLOADED = "underloaded"  # < 60%
    OPTIMAL = "optimal"          # 60-85%
    HIGH = "high"                # 85-95%
    OVERLOADED = "overloaded"    # > 95%


@dataclass
class DepartmentCapacity:
    """Capacity for a department entity."""
    name: str
    total_hours: float
    used_hours: float
    members_count: int
    projects_count: int = 0

    def __post_init__(self):
        if self.total_hours < 0 or self.used_hours < 0:
            raise ValueError("Hours cannot be negative")
        if self.members_count < 0:
            raise ValueError("Member count cannot be negative")

    @property
    def utilization(self) -> float:
        """Percentage of total hours utilized."""
        if self.total_hours <= 0:
            return 0.0
        return (self.used_hours / self.total_hours) * 100.0


class CapacityDashboard:
    """
    Capacity Dashboard System.
    
    Provides insights into agency workload and resource availability.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.departments: Dict[str, DepartmentCapacity] = {}
        logger.info(f"Capacity Dashboard initialized for {agency_name}")
        self._load_defaults()

    def _load_defaults(self):
        """Pre-populate with standard agency departments."""
        defaults = [
            ("SEO", 160.0, 140.0, 4, 8),
            ("Design", 120.0, 105.0, 3, 6),
            ("Development", 200.0, 180.0, 5, 4),
            ("Content", 80.0, 65.0, 2, 10),
            ("Strategy", 80.0, 72.0, 2, 5),
        ]

        for name, total, used, members, projects in defaults:
            try:
                self.departments[name] = DepartmentCapacity(
                    name=name,
                    total_hours=total,
                    used_hours=used,
                    members_count=members,
                    projects_count=projects
                )
            except ValueError as e:
                logger.error(f"Failed to load default department {name}: {e}")

    def get_level(self, dept: DepartmentCapacity) -> CapacityLevel:
        """Determine the capacity level based on utilization."""
        util = dept.utilization
        if util < 60:
            return CapacityLevel.UNDERLOADED
        elif util <= 85:
            return CapacityLevel.OPTIMAL
        elif util <= 95:
            return CapacityLevel.HIGH
        else:
            return CapacityLevel.OVERLOADED

    def get_bottlenecks(self) -> List[DepartmentCapacity]:
        """Identify departments at high or overloaded capacity."""
        return [d for d in self.departments.values()
                if self.get_level(d) in [CapacityLevel.HIGH, CapacityLevel.OVERLOADED]]

    def get_hiring_signals(self) -> List[str]:
        """Generate specific hiring recommendations."""
        signals = []
        for dept in self.departments.values():
            util = dept.utilization
            if util > 95:
                signals.append(f"🔴 URGENT: Hire for {dept.name} (at {util:.0f}%)")
            elif util > 85:
                signals.append(f"🟠 WARNING: Expand {dept.name} team (at {util:.0f}%)")
        return signals

    def format_dashboard(self) -> str:
        """Render Capacity Dashboard."""
        total_hours = sum(d.total_hours for d in self.departments.values())
        used_hours = sum(d.used_hours for d in self.departments.values())
        overall_util = (used_hours / total_hours * 100) if total_hours else 0.0

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 CAPACITY DASHBOARD{' ' * 41}║",
            f"║  Overall: {overall_util:>3.0f}% │ {used_hours:>4.0f}h / {total_hours:>4.0f}h{' ' * 25}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 DEPARTMENT CAPACITY                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        level_icons = {
            CapacityLevel.UNDERLOADED: "🟢",
            CapacityLevel.OPTIMAL: "💚",
            CapacityLevel.HIGH: "🟠",
            CapacityLevel.OVERLOADED: "🔴"
        }

        # Sort by utilization descending
        sorted_depts = sorted(self.departments.values(), key=lambda x: x.utilization, reverse=True)

        for dept in sorted_depts:
            level = self.get_level(dept)
            icon = level_icons.get(level, "⚪")
            util = dept.utilization
            bar = "█" * int(min(100, util) / 10) + "░" * (10 - int(min(100, util) / 10))

            lines.append(f"║  {icon} {dept.name:<12} │ {bar} │ {util:>3.0f}% │ {dept.members_count}👥  ║")

        lines.extend([
            "║                                                           ║",
            "║  ⚠️ SIGNALS                                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
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
            "║  ───────────────────────────────────────────────────────  ║",
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
            f"║  🏯 {self.agency_name[:40]:<40} - Optimized!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Capacity Dashboard...")
    print("=" * 60)

    try:
        dash = CapacityDashboard("Saigon Digital Hub")

        # Manually overload a department for demo
        if "Development" in dash.departments:
            dash.departments["Development"].used_hours = 198

        print("\n" + dash.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
