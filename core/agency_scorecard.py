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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


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
    """A key performance indicator."""
    name: str
    category: MetricCategory
    current: float
    target: float
    unit: str = ""
    trend: float = 0  # % change


class AgencyScorecard:
    """
    Agency Scorecard.
    
    KPI dashboard.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.kpis: List[KPI] = []
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default KPIs."""
        defaults = [
            # Financial
            ("Monthly Revenue", MetricCategory.FINANCIAL, 45000, 50000, "$", 12),
            ("Profit Margin", MetricCategory.FINANCIAL, 42, 40, "%", 5),
            ("Cash Flow", MetricCategory.FINANCIAL, 28000, 25000, "$", 8),
            
            # Clients
            ("Client Count", MetricCategory.CLIENTS, 15, 18, "", 2),
            ("NPS Score", MetricCategory.CLIENTS, 72, 70, "", 5),
            ("Retention Rate", MetricCategory.CLIENTS, 92, 90, "%", 3),
            
            # Operations
            ("Utilization", MetricCategory.OPERATIONS, 82, 80, "%", 4),
            ("On-Time Delivery", MetricCategory.OPERATIONS, 88, 90, "%", -2),
            
            # Team
            ("Team Size", MetricCategory.TEAM, 12, 12, "", 0),
            ("Revenue/Employee", MetricCategory.TEAM, 3750, 3500, "$", 7),
            
            # Growth
            ("Lead Conversion", MetricCategory.GROWTH, 28, 30, "%", 3),
            ("MRR Growth", MetricCategory.GROWTH, 8, 10, "%", 2),
        ]
        
        for name, category, current, target, unit, trend in defaults:
            self.kpis.append(KPI(name, category, current, target, unit, trend))
    
    def get_achievement(self, kpi: KPI) -> float:
        """Get KPI achievement percentage."""
        return (kpi.current / kpi.target * 100) if kpi.target else 0
    
    def get_grade(self, kpi: KPI) -> Grade:
        """Get KPI grade."""
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
        """Format agency scorecard."""
        overall = self.get_overall_grade()
        
        grade_colors = {"A": "🟢", "B": "💚", "C": "🟡", "D": "🔴"}
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 AGENCY SCORECARD                                      ║",
            f"║  Overall Grade: {grade_colors[overall.value]} {overall.value}                                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        # Group by category
        categories = {}
        for kpi in self.kpis:
            if kpi.category not in categories:
                categories[kpi.category] = []
            categories[kpi.category].append(kpi)
        
        cat_icons = {"financial": "💰", "clients": "👥", "operations": "⚙️", "team": "👨‍💼", "growth": "📈"}
        
        for category, kpis in categories.items():
            icon = cat_icons.get(category.value, "📊")
            lines.append(f"║  {icon} {category.value.upper():<50}  ║")
            lines.append("║  ─────────────────────────────────────────────────────── ║")
            
            for kpi in kpis[:3]:
                grade = self.get_grade(kpi)
                achievement = self.get_achievement(kpi)
                trend_icon = "↑" if kpi.trend > 0 else ("↓" if kpi.trend < 0 else "→")
                
                value_str = f"{kpi.current:,.0f}{kpi.unit}"
                target_str = f"{kpi.target:,.0f}{kpi.unit}"
                
                lines.append(f"║    {grade_colors[grade.value]} {kpi.name[:15]:<15} │ {value_str:>10} / {target_str:<10} │ {trend_icon}{abs(kpi.trend):>2.0f}%  ║")
            
            lines.append("║                                                           ║")
        
        lines.extend([
            "║  [📊 Details]  [📈 Trends]  [🎯 Set Goals]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Performance at a glance!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    scorecard = AgencyScorecard("Saigon Digital Hub")
    
    print("🎯 Agency Scorecard")
    print("=" * 60)
    print()
    
    print(scorecard.format_scorecard())
