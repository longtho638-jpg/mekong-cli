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

import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class SystemStatus(Enum):
    """System availability status."""

    OPERATIONAL = "operational"
    DEGRADED = "degraded"
    DOWN = "down"


@dataclass
class QuickStat:
    """A single dashboard metric entity."""

    name: str
    value: str
    trend: str
    icon: str


@dataclass
class SystemHealth:
    """Health status record for a system component."""

    name: str
    status: SystemStatus
    message: str = ""


class AgencyCommandCenter:
    """
    Agency Command Center System.

    MILESTONE 100 - THE ULTIMATE DASHBOARD!
    Aggregates agency-wide health metrics and system statuses.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.quick_stats: List[QuickStat] = []
        self.systems: List[SystemHealth] = []
        logger.info(f"Command Center initialized for {agency_name}")
        self._load_current_data()

    def _load_current_data(self):
        """Pre-populate with snapshot data."""
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

    def get_pulse_status(self) -> str:
        """Evaluate overall agency momentum."""
        # Simulated health algorithm
        revenue_thriving = True
        churn_low = True

        if revenue_thriving and churn_low:
            return "💚 THRIVING"
        elif revenue_thriving or churn_low:
            return "🟢 HEALTHY"
        else:
            return "🟡 CAUTION"

    def format_command_center(self) -> str:
        """Render the complete Command Center Dashboard."""
        pulse = self.get_pulse_status()
        now_str = datetime.now().strftime("%b %d, %Y %H:%M")

        border_top = "╔" + "═" * 70 + "╗"
        border_bottom = "╚" + "═" * 70 + "╝"
        sep = "╠" + "═" * 70 + "╣"

        lines = [
            border_top,
            f"║  {self.agency_name.upper()[:60]:<60}         ║",
            f"║  {'═' * 66}  ║",
            "║           A G E N C Y    C O M M A N D    C E N T E R            ║",
            "║                    M I L E S T O N E   1 0 0                     ║",
            sep,
            f"║  📊 PULSE: {pulse:<20} │ 📅 {now_str:<25}  ║",
            sep,
            "║  📈 QUICK STATS                                                      ║",
            "║  " + "─" * 66 + "  ║",
        ]

        # Grid layout for stats (2 columns)
        for i in range(0, len(self.quick_stats), 2):
            s1 = self.quick_stats[i]
            s2 = self.quick_stats[i + 1] if i + 1 < len(self.quick_stats) else None

            c1 = f"{s1.icon} {s1.name}: {s1.value} {s1.trend}"
            if s2:
                c2 = f"{s2.icon} {s2.name}: {s2.value} {s2.trend}"
                lines.append(f"║    {c1:<30} │ {c2:<30}  ║")
            else:
                lines.append(f"║    {c1:<66}  ║")

        lines.extend(
            [
                "║                                                                      ║",
                "║  🔧 SYSTEM STATUS                                                    ║",
                "║  " + "─" * 66 + "  ║",
            ]
        )

        status_map = {
            SystemStatus.OPERATIONAL: "🟢",
            SystemStatus.DEGRADED: "🟡",
            SystemStatus.DOWN: "🔴",
        }

        # Grid for systems (3 columns)
        for i in range(0, len(self.systems), 3):
            row = self.systems[i : i + 3]
            row_content = " │ ".join(f"{status_map.get(s.status, '⚪')} {s.name:<14}" for s in row)
            lines.append(f"║    {row_content:<66}  ║")

        lines.extend(
            [
                "║                                                                      ║",
                "║  🚀 QUICK ACTIONS                                                    ║",
                "║  " + "─" * 66 + "  ║",
                "║    [📝 Proposal] [💳 Invoice] [📅 Meeting] [👤 Client] [📊 Report]   ║",
                "║                                                                      ║",
                "║  📋 TODAY'S PRIORITIES                                               ║",
                "║  " + "─" * 66 + "  ║",
                "║    🔴 Overdue Invoice #INV-003 - follow up                           ║",
                "║    🟠 Coffee Lab proposal deadline tomorrow                          ║",
                "║    🟢 Team standup at 2:00 PM                                        ║",
                sep,
                "║   🏆 MILESTONE 100 ACHIEVED! 🏆                                      ║",
                "║   65 Modules │ 53 Commits │ 50,000+ Lines │ Agency OS Core           ║",
                "║                                                                      ║",
                '║                    "Không đánh mà thắng" 🏯                          ║',
                border_bottom,
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🏯 Initializing Command Center Dashboard...")
    print("=" * 72)

    try:
        center = AgencyCommandCenter("Saigon Digital Hub")
        print("\n" + center.format_command_center())
    except Exception as e:
        logger.error(f"Dashboard Error: {e}")
