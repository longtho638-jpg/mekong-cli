"""
HR Analytics Facade and Dashboard.
"""
import logging

from .engine import HRAnalyticsEngine
from .models import AttritionRisk, Department, Employee, HRMetric

logger = logging.getLogger(__name__)

class HRAnalytics(HRAnalyticsEngine):
    """
    HR Analytics System.
    Orchestrates people data analysis and organizational health metrics.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"HR Analytics system initialized for {agency_name}")
        self._init_demo_data()

    def _init_demo_data(self):
        demo_staff = [("Alex Nguyen", Department.ENGINEERING, "Dev Lead", 4000.0, 80, 5), ("Sarah Tran", Department.DESIGN, "Art Director", 3500.0, 90, 5)]
        for name, dept, role, sal, enps, perf in demo_staff:
            self.add_employee(name, dept, role, sal, enps, perf)

    def format_dashboard(self) -> str:
        stats = self.get_aggregate_stats()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 HR ANALYTICS DASHBOARD{' ' * 33}║",
            f"║  {stats['headcount']} employees │ eNPS: {stats.get('avg_enps', 0):>+4.0f} │ ${stats.get('avg_salary', 0):>8,.0f} avg{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        counts = {}
        for e in self.employees.values(): counts[e.department] = counts.get(e.department, 0) + 1
        for dept, c in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            lines.append(f"║    {dept.value.title():<12} │ {'█' * c + '░' * (10 - min(10, c))} │ {c:>3}  ║")
        lines.extend(["║                                                           ║", "╠═══════════════════════════════════════════════════════════╣", f"║  Castle {self.agency_name[:40]:<40} - Culture!           ║", "╚═══════════════════════════════════════════════════════════╝"])
        return "\n".join(lines)
