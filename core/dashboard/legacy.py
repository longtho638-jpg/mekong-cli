"""
📈 Client Dashboard - Monthly Performance Reports
===================================================

Generate beautiful monthly reports for agency clients.
Show metrics, progress, and wins!

Features:
- Monthly metrics summary
- Progress visualization
- Key wins highlight
- Recommendations
"""

import logging
from typing import List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MetricTrend(Enum):
    """Trend direction based on period comparison."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


@dataclass
class Metric:
    """A performance indicator record."""
    name: str
    value: float
    previous: float
    unit: str = ""

    @property
    def change_percent(self) -> float:
        """Calculate percentage change."""
        if self.previous == 0:
            return 0.0
        return ((self.value - self.previous) / self.previous) * 100.0

    @property
    def trend(self) -> MetricTrend:
        """Determine trend category."""
        if self.change_percent > 5.0: return MetricTrend.UP
        if self.change_percent < -5.0: return MetricTrend.DOWN
        return MetricTrend.STABLE


@dataclass
class DashboardReport:
    """A complete dashboard report entity."""
    client_name: str
    client_company: str
    period: str
    metrics: List[Metric]
    wins: List[str]
    recommendations: List[str]
    generated_at: datetime = field(default_factory=datetime.now)


class ClientDashboard:
    """
    Client Dashboard System.
    
    Creates professional performance summaries for agency clients.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        logger.info(f"Client Dashboard system initialized for {agency_name}")

    def generate_report(
        self,
        client_name: str,
        client_company: str,
        period: Optional[str] = None
    ) -> DashboardReport:
        """Execute logic to compile a performance report."""
        if not client_name or not client_company:
            raise ValueError("Client details required")

        p = period if period else datetime.now().strftime("%B %Y")
        logger.info(f"Generating report for {client_company} - {p}")

        # Sample data injection (In production, query DB/Analytics)
        metrics = [
            Metric("Website Traffic", 12500.0, 10850.0, "visitors"),
            Metric("Leads Generated", 156.0, 128.0, "leads"),
            Metric("Revenue", 45000.0, 38500.0, "$")
        ]

        return DashboardReport(
            client_name=client_name,
            client_company=client_company,
            period=p,
            metrics=metrics,
            wins=["Increased organic leads by 22%!", "Revenue exceeded target by $5k"],
            recommendations=["Launch social ads", "Optimize mobile landing page"]
        )

    def format_dashboard(self, report: DashboardReport) -> str:
        """Render the report as an ASCII dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 MONTHLY DASHBOARD - {report.client_company.upper()[:28]:<28} ║",
            f"║  Period: {report.period:<45}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 KEY PERFORMANCE METRICS                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        for m in report.metrics:
            trend_map = {MetricTrend.UP: ("↑", "🟢"), MetricTrend.DOWN: ("↓", "🔴"), MetricTrend.STABLE: ("→", "🟡")}
            arr, icon = trend_map.get(m.trend, ("?", "⚪"))

            val_str = f"${m.value:,.0f}" if m.unit == "$" else f"{m.value:,.0f}"
            change_str = f"{m.change_percent:+.1f}%"

            lines.append(f"║  {icon} {m.name:<18} {val_str:>10}  ({arr} {change_str:<7}) {' ' * 5}║")

        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏆 THIS MONTH'S WINS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])

        for win in report.wins[:3]:
            lines.append(f"║    ✅ {win[:50]:<50}  ║")

        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Generated by {self.agency_name[:20]:<20}  │ {report.generated_at.strftime('%Y-%m-%d'):<10} ║",
            "║  🏯 \"Không đánh mà thắng\" - Agency OS                     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📈 Initializing Dashboard Generator...")
    print("=" * 60)

    try:
        gen = ClientDashboard("Saigon Digital Hub")
        rpt = gen.generate_report("Mr. Hoang", "Sunrise Realty")
        print("\n" + gen.format_dashboard(rpt))

    except Exception as e:
        logger.error(f"Dashboard Error: {e}")
