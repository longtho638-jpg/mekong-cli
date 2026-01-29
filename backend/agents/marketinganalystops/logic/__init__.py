"""
Reporting Agent Facade.
"""

from typing import Dict

from .engine import ReportingEngine
from .models import Insight, Report, ReportStatus, ReportType


class ReportingAgent(ReportingEngine):
    """Refactored Reporting Agent."""

    def __init__(self):
        super().__init__()
        self.name = "Reporting"
        self.status = "ready"

    def get_stats(self) -> Dict:
        return {
            "total_reports": len(self.reports),
            "sent": len([r for r in self.reports.values() if r.status == ReportStatus.SENT]),
        }


__all__ = ["ReportingAgent", "ReportType", "ReportStatus", "Report", "Insight"]
