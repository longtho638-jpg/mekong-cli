"""
Agency Scorecard Facade and Dashboard.
"""
from typing import Dict, List, Optional

from .engine import ScorecardEngine
from .models import KPI, Grade, MetricCategory


class AgencyScorecard(ScorecardEngine):
    """Agency Scorecard System."""

    def __init__(self, agency_name: str, initial_kpis: Optional[List[KPI]] = None):
        super().__init__()
        self.agency_name = agency_name
        self.kpis = initial_kpis if initial_kpis is not None else []
        if not self.kpis: self._load_defaults()

    def _load_defaults(self):
        defaults = [
            ("Monthly Revenue", MetricCategory.FINANCIAL, 45000, 50000, "$", 12.0),
            ("Profit Margin", MetricCategory.FINANCIAL, 42, 40, "%", 5.0),
            ("Client Count", MetricCategory.CLIENTS, 15, 18, "", 2.0),
            ("NPS Score", MetricCategory.CLIENTS, 72, 70, "", 5.0),
            ("Utilization", MetricCategory.OPERATIONS, 82, 80, "%", 4.0),
            ("Team Size", MetricCategory.TEAM, 12, 12, "", 0.0),
            ("Lead Conversion", MetricCategory.GROWTH, 28, 30, "%", 3.0),
        ]
        for name, cat, curr, targ, unit, trend in defaults:
            self.add_kpi(KPI(name, cat, float(curr), float(targ), unit, trend))

    def format_scorecard(self) -> str:
        overall = self.get_overall_grade()
        grade_colors = {Grade.A: "🟢", Grade.B: "💚", Grade.C: "🟡", Grade.D: "🔴"}
        lines = ["╔═══════════════════════════════════════════════════════════╗", f"║  🎯 AGENCY SCORECARD - {self.agency_name.upper()[:25]:<25} ║", f"║  Overall Grade: {grade_colors.get(overall, '⚪')} {overall.value:<4} {' ' * 38}║", "╠═══════════════════════════════════════════════════════════╣"]

        # Group by category
        cats = {}
        for k in self.kpis:
            if k.category not in cats: cats[k.category] = []
            cats[k.category].append(k)

        for category, kpis in cats.items():
            lines.append(f"║  {category.value.upper():<57}  ║")
            for k in kpis[:2]:
                grade = self.get_grade(k)
                lines.append(f"║    {grade_colors.get(grade, '⚪')} {k.name[:18]:<18} │ {k.current:,.0f}{k.unit} / {k.target:,.0f}{k.unit} ║")

        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)
