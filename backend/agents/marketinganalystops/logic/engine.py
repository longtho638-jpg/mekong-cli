"""
Reporting Agent engine logic.
"""
import random
from datetime import date, datetime
from typing import Dict, List

from .models import Insight, Report, ReportStatus, ReportType


class ReportingEngine:
    def __init__(self):
        self.reports: Dict[str, Report] = {}

    def create_report(self, title: str, report_type: ReportType, period_start: date, period_end: date) -> Report:
        rid = f"rpt_{random.randint(1000, 9999)}"
        report = Report(id=rid, title=title, report_type=report_type, period_start=period_start, period_end=period_end)
        self.reports[rid] = report
        return report

    def generate_report(self, report_id: str) -> Report:
        if report_id not in self.reports: raise ValueError("Report not found")
        report = self.reports[report_id]
        report.status = ReportStatus.READY
        report.metrics_summary = {"revenue": random.randint(80000, 150000), "leads": random.randint(1000, 2000)}
        return report
