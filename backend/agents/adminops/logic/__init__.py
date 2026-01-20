"""
Report Generator Agent Facade.
"""
from typing import Dict, List

from .engine import ReportEngine
from .models import Report, ReportFormat, ReportType


class ReportGeneratorAgent(ReportEngine):
    def __init__(self):
        super().__init__()
        self.name = "Report Generator"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {"total_reports": len(self.reports), "this_month": len([r for r in self.reports.values() if r.created_at.month == 1])}
