"""
Reporting Agent - Reports & Insights
Manages automated report generation and insight extraction.
"""

import random
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional


class ReportType(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    CUSTOM = "custom"


class ReportStatus(Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    SENT = "sent"


@dataclass
class Insight:
    """Marketing insight"""

    id: str
    title: str
    description: str
    impact: str  # low, medium, high
    action: str
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Report:
    """Marketing report"""

    id: str
    title: str
    report_type: ReportType
    period_start: date
    period_end: date
    status: ReportStatus = ReportStatus.DRAFT
    insights: List[Insight] = field(default_factory=list)
    metrics_summary: Dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    sent_at: Optional[datetime] = None


class ReportingAgent:
    """
    Reporting Agent - Báo cáo Marketing

    Responsibilities:
    - Automated report generation
    - Executive summaries
    - Insight extraction
    - Scheduled delivery
    """

    def __init__(self):
        self.name = "Reporting"
        self.status = "ready"
        self.reports: Dict[str, Report] = {}

    def create_report(
        self, title: str, report_type: ReportType, period_start: date, period_end: date
    ) -> Report:
        """Create new report"""
        report_id = f"rpt_{random.randint(1000, 9999)}"

        report = Report(
            id=report_id,
            title=title,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
        )

        self.reports[report_id] = report
        return report

    def generate_report(self, report_id: str) -> Report:
        """Generate report content"""
        if report_id not in self.reports:
            raise ValueError(f"Report not found: {report_id}")

        report = self.reports[report_id]
        report.status = ReportStatus.GENERATING

        # Simulate metrics summary
        report.metrics_summary = {
            "revenue": random.randint(80000, 150000),
            "leads": random.randint(1000, 2000),
            "conversion_rate": random.uniform(2.5, 4.5),
            "roas": random.uniform(3.0, 5.0),
            "top_channel": random.choice(["Email", "Search", "Social"]),
            "top_campaign": "Q4 Holiday Sale",
        }

        # Generate insights
        insight_templates = [
            (
                "Revenue Surge",
                "Revenue increased by 27% compared to previous period",
                "high",
                "Scale top campaigns",
            ),
            (
                "Email Performance",
                "Email channel shows highest ROAS at 8.5x",
                "high",
                "Increase email budget",
            ),
            (
                "Mobile Traffic",
                "Mobile traffic now accounts for 65% of sessions",
                "medium",
                "Optimize mobile UX",
            ),
            (
                "Lead Quality",
                "MQL to SQL conversion improved by 15%",
                "medium",
                "Document best practices",
            ),
        ]

        num_insights = random.randint(2, 4)
        for i, (title, desc, impact, action) in enumerate(
            random.sample(insight_templates, num_insights)
        ):
            insight = Insight(
                id=f"ins_{random.randint(100, 999)}",
                title=title,
                description=desc,
                impact=impact,
                action=action,
            )
            report.insights.append(insight)

        report.status = ReportStatus.READY
        return report

    def send_report(self, report_id: str, recipients: List[str]) -> Report:
        """Send report to recipients"""
        if report_id not in self.reports:
            raise ValueError(f"Report not found: {report_id}")

        report = self.reports[report_id]
        report.status = ReportStatus.SENT
        report.sent_at = datetime.now()

        return report

    def get_stats(self) -> Dict:
        """Get reporting statistics"""
        reports = list(self.reports.values())

        return {
            "total_reports": len(reports),
            "sent": len([r for r in reports if r.status == ReportStatus.SENT]),
            "total_insights": sum(len(r.insights) for r in reports),
        }


# Demo
if __name__ == "__main__":
    from datetime import timedelta

    agent = ReportingAgent()

    print("📋 Reporting Agent Demo\n")

    # Create report
    today = date.today()
    r1 = agent.create_report(
        "Weekly Marketing Report", ReportType.WEEKLY, today - timedelta(days=7), today
    )

    print(f"📋 Report: {r1.title}")
    print(f"   Type: {r1.report_type.value}")
    print(f"   Period: {r1.period_start} to {r1.period_end}")

    # Generate
    agent.generate_report(r1.id)
    print(f"   Status: {r1.status.value}")

    # Show summary
    print("\n📊 Summary:")
    print(f"   Revenue: ${r1.metrics_summary['revenue']:,}")
    print(f"   Leads: {r1.metrics_summary['leads']}")
    print(f"   ROAS: {r1.metrics_summary['roas']:.1f}x")

    # Show insights
    print(f"\n💡 Insights ({len(r1.insights)}):")
    for ins in r1.insights:
        print(f"   [{ins.impact}] {ins.title}")
        print(f"      → {ins.action}")

    # Send
    agent.send_report(r1.id, ["cmo@company.com"])
    print(f"\n📧 Sent at: {r1.sent_at.strftime('%Y-%m-%d %H:%M')}")
