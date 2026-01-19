"""
🎯 Agency Scorecard - Key Performance Indicators
==================================================

Track agency-wide KPIs at a glance.
One dashboard to rule them all!

Features:
- Key metrics tracking
- Trend indicators
- Goal progress
- Performance grades
"""

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class MetricCategory(Enum):
    """Metric categories."""

    FINANCIAL = "financial"
    CLIENTS = "clients"
    OPERATIONS = "operations"
    TEAM = "team"
    GROWTH = "growth"


class Grade(Enum):
    """Performance grades."""

    A = "A"  # Excellent (90%+)
    B = "B"  # Good (75-89%)
    C = "C"  # Needs work (60-74%)
    D = "D"  # Poor (<60%)


@dataclass
class KPI:
    """A key performance indicator entity."""

    name: str
    category: MetricCategory
    current: float
    target: float
    unit: str = ""
    trend: float = 0.0  # % change since last period

    def __post_init__(self):
        if self.target < 0:
            logger.warning(f"KPI {self.name} has negative target: {self.target}")


class AgencyScorecard:
    """
    Agency Scorecard System.

    Manages and visualizes Key Performance Indicators.
    """

    def __init__(self, agency_name: str, initial_kpis: Optional[List[KPI]] = None):
        self.agency_name = agency_name
        self.kpis: List[KPI] = initial_kpis if initial_kpis is not None else []

        if not self.kpis:
            logger.info("No KPIs provided, loading defaults for demo.")
            self._load_defaults()

    def add_kpi(self, kpi: KPI) -> None:
        """Add a new KPI to the scorecard."""
        self.kpis.append(kpi)
        logger.debug(f"Added KPI: {kpi.name}")

    def update_kpi(self, name: str, current: float, trend: Optional[float] = None) -> bool:
        """Update an existing KPI's current value and trend."""
        for kpi in self.kpis:
            if kpi.name == name:
                kpi.current = current
                if trend is not None:
                    kpi.trend = trend
                logger.info(f"Updated KPI: {name} -> {current}")
                return True
        logger.warning(f"KPI not found for update: {name}")
        return False

    def _load_defaults(self):
        """Load default KPIs for demonstration."""
        defaults = [
            # Financial
            ("Monthly Revenue", MetricCategory.FINANCIAL, 45000, 50000, "$", 12.0),
            ("Profit Margin", MetricCategory.FINANCIAL, 42, 40, "%", 5.0),
            ("Cash Flow", MetricCategory.FINANCIAL, 28000, 25000, "$", 8.0),
            # Clients
            ("Client Count", MetricCategory.CLIENTS, 15, 18, "", 2.0),
            ("NPS Score", MetricCategory.CLIENTS, 72, 70, "", 5.0),
            ("Retention Rate", MetricCategory.CLIENTS, 92, 90, "%", 3.0),
            # Operations
            ("Utilization", MetricCategory.OPERATIONS, 82, 80, "%", 4.0),
            ("On-Time Delivery", MetricCategory.OPERATIONS, 88, 90, "%", -2.0),
            # Team
            ("Team Size", MetricCategory.TEAM, 12, 12, "", 0.0),
            ("Revenue/Employee", MetricCategory.TEAM, 3750, 3500, "$", 7.0),
            # Growth
            ("Lead Conversion", MetricCategory.GROWTH, 28, 30, "%", 3.0),
            ("MRR Growth", MetricCategory.GROWTH, 8, 10, "%", 2.0),
        ]

        for name, category, current, target, unit, trend in defaults:
            self.kpis.append(KPI(name, category, float(current), float(target), unit, trend))

    def get_achievement(self, kpi: KPI) -> float:
        """Get KPI achievement percentage. Handles zero targets."""
        if kpi.target == 0:
            return 100.0 if kpi.current >= 0 else 0.0
        return kpi.current / kpi.target * 100.0

    def get_grade(self, kpi: KPI) -> Grade:
        """Get KPI grade based on achievement."""
        achievement = self.get_achievement(kpi)
        if achievement >= 90:
            return Grade.A
        elif achievement >= 75:
            return Grade.B
        elif achievement >= 60:
            return Grade.C
        else:
            return Grade.D

    def get_overall_grade(self) -> Grade:
        """Get overall agency grade."""
        if not self.kpis:
            return Grade.C  # Default neutral

        avg_achievement = sum(self.get_achievement(k) for k in self.kpis) / len(self.kpis)
        if avg_achievement >= 90:
            return Grade.A
        elif avg_achievement >= 75:
            return Grade.B
        elif avg_achievement >= 60:
            return Grade.C
        else:
            return Grade.D

    def format_scorecard(self) -> str:
        """Format agency scorecard dashboard."""
        overall = self.get_overall_grade()

        grade_colors = {Grade.A: "🟢", Grade.B: "💚", Grade.C: "🟡", Grade.D: "🔴"}

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 AGENCY SCORECARD{' ' * 40}║",
            f"║  Overall Grade: {grade_colors.get(overall, '⚪')} {overall.value:<4} {' ' * 38}║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        # Group by category
        categories: Dict[MetricCategory, List[KPI]] = {}
        for kpi in self.kpis:
            if kpi.category not in categories:
                categories[kpi.category] = []
            categories[kpi.category].append(kpi)

        cat_icons = {
            MetricCategory.FINANCIAL: "💰",
            MetricCategory.CLIENTS: "👥",
            MetricCategory.OPERATIONS: "⚙️",
            MetricCategory.TEAM: "👨‍💼",
            MetricCategory.GROWTH: "📈",
        }

        for category, kpis in categories.items():
            icon = cat_icons.get(category, "📊")
            cat_name = category.value.upper()
            lines.append(f"║  {icon} {cat_name:<50}  ║")
            lines.append("║  ───────────────────────────────────────────────────────  ║")

            for kpi in kpis[:3]:  # Limit to 3 per category for UI balance
                grade = self.get_grade(kpi)
                trend_icon = "↑" if kpi.trend > 0 else ("↓" if kpi.trend < 0 else "→")

                value_str = f"{kpi.current:,.0f}{kpi.unit}"
                target_str = f"{kpi.target:,.0f}{kpi.unit}"

                # Format: [Grade] [Name] | [Value]/[Target] | [Trend]
                lines.append(
                    f"║    {grade_colors.get(grade, '⚪')} {kpi.name[:18]:<18} │ {value_str:>9} / {target_str:<9} │ {trend_icon}{abs(kpi.trend):>2.0f}%   ║"
                )

            lines.append("║                                                           ║")

        lines.extend(
            [
                "║  [📊 Details]  [📈 Trends]  [🎯 Set Goals]                ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Performance!          ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing Agency Scorecard...")
    print("=" * 60)

    try:
        scorecard = AgencyScorecard("Saigon Digital Hub")

        # Test update functionality
        scorecard.update_kpi("Monthly Revenue", 48000, 15.0)

        # Test add functionality
        new_kpi = KPI("New Service Launch", MetricCategory.GROWTH, 5, 10, "", 50.0)
        scorecard.add_kpi(new_kpi)

        print("\n" + scorecard.format_scorecard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
