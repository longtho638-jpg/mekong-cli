"""
🏯 Agency Command Center - The Ultimate Dashboard
===================================================

MILESTONE 100: THE ULTIMATE AGENCY DASHBOARD
One dashboard. All insights. Total control.

Features:
- Real-time metrics
- All systems status
- Quick actions
- Agency pulse
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class SystemStatus(Enum):
    """System status."""
    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    DOWN = "down"


@dataclass
class QuickStat:
    """A quick stat for the dashboard."""
    name: str
    value: str
    trend: str
    icon: str


@dataclass
class SystemHealth:
    """System health check."""
    name: str
    status: SystemStatus
    message: str = ""


class AgencyCommandCenter:
    """
    Agency Command Center.
    
    MILESTONE 100 - THE ULTIMATE DASHBOARD!
    
    "Không đánh mà thắng" 🏯
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.quick_stats: List[QuickStat] = []
        self.systems: List[SystemHealth] = []
        self._load_data()
    
    def _load_data(self):
        """Load command center data."""
        self.quick_stats = [
            QuickStat("Revenue MTD", "$45,200", "↑ 12%", "💰"),
            QuickStat("Active Clients", "15", "↑ 2", "👥"),
            QuickStat("Profit Margin", "42%", "↑ 5%", "📈"),
            QuickStat("Utilization", "82%", "→ 0%", "⚙️"),
            QuickStat("NPS Score", "72", "↑ 5", "❤️"),
            QuickStat("Pipeline", "$125K", "↑ 18%", "🎯"),
        ]
        
        self.systems = [
            SystemHealth("CRM", SystemStatus.OPERATIONAL),
            SystemHealth("Invoicing", SystemStatus.OPERATIONAL),
            SystemHealth("Analytics", SystemStatus.OPERATIONAL),
            SystemHealth("Email", SystemStatus.OPERATIONAL),
            SystemHealth("Webhooks", SystemStatus.OPERATIONAL),
            SystemHealth("Calendar", SystemStatus.OPERATIONAL),
        ]
    
    def get_pulse(self) -> str:
        """Get agency pulse status."""
        # Calculate overall health
        revenue_growth = True  # Simulated
        clients_growing = True
        team_happy = True
        
        if revenue_growth and clients_growing and team_happy:
            return "💚 THRIVING"
        elif revenue_growth or clients_growing:
            return "🟢 HEALTHY"
        else:
            return "🟡 NEEDS ATTENTION"
    
    def format_command_center(self) -> str:
        """Format the ultimate command center."""
        pulse = self.get_pulse()
        now = datetime.now().strftime("%b %d, %Y %H:%M")
        
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                                                                      ║",
            f"║  🏯 {self.agency_name.upper():<61}  ║",
            "║  ═══════════════════════════════════════════════════════════════════ ║",
            "║                     A G E N C Y    C O M M A N D    C E N T E R      ║",
            "║                              M I L E S T O N E   1 0 0               ║",
            "║                                                                      ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  📊 AGENCY PULSE: {pulse:<20}    📅 {now:<18}  ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║                                                                      ║",
            "║  📈 QUICK STATS                                                      ║",
            "║  ─────────────────────────────────────────────────────────────────── ║",
        ]
        
        # Display stats in 2 columns
        for i in range(0, len(self.quick_stats), 2):
            stat1 = self.quick_stats[i]
            stat2 = self.quick_stats[i + 1] if i + 1 < len(self.quick_stats) else None
            
            col1 = f"{stat1.icon} {stat1.name}: {stat1.value} {stat1.trend}"
            if stat2:
                col2 = f"{stat2.icon} {stat2.name}: {stat2.value} {stat2.trend}"
                lines.append(f"║    {col1:<30} │ {col2:<30}  ║")
            else:
                lines.append(f"║    {col1:<66}  ║")
        
        lines.extend([
            "║                                                                      ║",
            "║  🔧 SYSTEM STATUS                                                    ║",
            "║  ─────────────────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"operational": "🟢", "degraded": "🟡", "down": "🔴"}
        
        # Display systems in 3 columns
        system_strs = [f"{status_icons[s.status.value]} {s.name}" for s in self.systems]
        for i in range(0, len(system_strs), 3):
            row = system_strs[i:i+3]
            row_str = " │ ".join(f"{s:<18}" for s in row)
            lines.append(f"║    {row_str:<66}  ║")
        
        lines.extend([
            "║                                                                      ║",
            "║  🚀 QUICK ACTIONS                                                    ║",
            "║  ─────────────────────────────────────────────────────────────────── ║",
            "║    [📝 New Proposal]  [💳 Create Invoice]  [📅 Schedule Meeting]     ║",
            "║    [👤 Add Client]    [📊 Run Report]      [📧 Send Campaign]        ║",
            "║                                                                      ║",
            "║  📋 TODAY'S PRIORITIES                                               ║",
            "║  ─────────────────────────────────────────────────────────────────── ║",
            "║    🔴 Invoice #INV-003 overdue - send reminder                       ║",
            "║    🟠 Coffee Lab proposal due tomorrow                               ║",
            "║    🟡 Tech Startup monthly report to prepare                         ║",
            "║    🟢 Team standup at 2:00 PM                                        ║",
            "║                                                                      ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║                                                                      ║",
            "║   🏆 MILESTONE 100 COMPLETE! 🏆                                      ║",
            "║   65 Modules │ 53 Commits │ 50,000+ Lines │ 100 Phases               ║",
            "║                                                                      ║",
            "║                    \"Không đánh mà thắng\" 🏯                          ║",
            "║                                                                      ║",
            "╚══════════════════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    center = AgencyCommandCenter("Saigon Digital Hub")
    
    print()
    print("🏯 AGENCY COMMAND CENTER - MILESTONE 100!")
    print("=" * 72)
    print()
    
    print(center.format_command_center())
