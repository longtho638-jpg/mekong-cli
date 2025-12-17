"""
📊 Report Builder - Custom Reports
=====================================

Build custom reports with drag-and-drop.
Data visualization made easy!

Features:
- Multiple report types
- Custom metrics
- Date range filtering
- Export options
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ReportType(Enum):
    """Report types."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    PROJECTS = "projects"
    TEAM = "team"
    MARKETING = "marketing"
    CUSTOM = "custom"


class MetricType(Enum):
    """Metric types."""
    SUM = "sum"
    AVERAGE = "average"
    COUNT = "count"
    PERCENTAGE = "percentage"


@dataclass
class ReportMetric:
    """A report metric."""
    name: str
    value: float
    type: MetricType
    change: float = 0  # % change from previous period
    icon: str = "📊"


@dataclass
class Report:
    """A generated report."""
    id: str
    name: str
    type: ReportType
    metrics: List[ReportMetric]
    start_date: datetime
    end_date: datetime
    generated_at: datetime = field(default_factory=datetime.now)


class ReportBuilder:
    """
    Report Builder.
    
    Build and generate custom reports.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.reports: List[Report] = []
    
    def build_revenue_report(
        self,
        start_date: datetime,
        end_date: datetime,
        revenue: float,
        expenses: float,
        invoices: int
    ) -> Report:
        """Build a revenue report."""
        profit = revenue - expenses
        margin = (profit / revenue * 100) if revenue > 0 else 0
        
        report = Report(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            name="Revenue Report",
            type=ReportType.REVENUE,
            start_date=start_date,
            end_date=end_date,
            metrics=[
                ReportMetric("Total Revenue", revenue, MetricType.SUM, 18.5, "💰"),
                ReportMetric("Expenses", expenses, MetricType.SUM, 5.2, "💸"),
                ReportMetric("Net Profit", profit, MetricType.SUM, 25.3, "✅"),
                ReportMetric("Profit Margin", margin, MetricType.PERCENTAGE, 4.1, "📈"),
                ReportMetric("Invoices", invoices, MetricType.COUNT, 12.0, "📄"),
            ]
        )
        
        self.reports.append(report)
        return report
    
    def build_clients_report(
        self,
        start_date: datetime,
        end_date: datetime,
        total: int,
        new: int,
        churned: int,
        avg_value: float
    ) -> Report:
        """Build a clients report."""
        report = Report(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            name="Clients Report",
            type=ReportType.CLIENTS,
            start_date=start_date,
            end_date=end_date,
            metrics=[
                ReportMetric("Total Clients", total, MetricType.COUNT, 8.0, "👥"),
                ReportMetric("New Clients", new, MetricType.COUNT, 25.0, "🆕"),
                ReportMetric("Churned", churned, MetricType.COUNT, -50.0, "📉"),
                ReportMetric("Avg Client Value", avg_value, MetricType.AVERAGE, 12.0, "💎"),
            ]
        )
        
        self.reports.append(report)
        return report
    
    def format_report(self, report: Report) -> str:
        """Format a report for display."""
        period = f"{report.start_date.strftime('%b %d')} - {report.end_date.strftime('%b %d, %Y')}"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 {report.name.upper():<48}  ║",
            f"║  📅 {period:<48}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for metric in report.metrics:
            change_icon = "↑" if metric.change >= 0 else "↓"
            change_color = "🟢" if metric.change >= 0 else "🔴"
            
            if metric.type == MetricType.PERCENTAGE:
                value_str = f"{metric.value:.1f}%"
            elif metric.value >= 1000:
                value_str = f"${metric.value:,.0f}"
            else:
                value_str = f"{metric.value:,.0f}"
            
            lines.append(
                f"║  {metric.icon} {metric.name:<18} │ {value_str:>12} │ {change_color} {change_icon}{abs(metric.change):>5.1f}%  ║"
            )
        
        lines.extend([
            "║                                                           ║",
            "║  [📥 Export PDF]  [📧 Email]  [📊 Visualize]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Data-driven decisions!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_library(self) -> str:
        """Format report library."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 REPORT LIBRARY                                        ║",
            f"║  Total: {len(self.reports)} reports                                  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ID       │ Name           │ Type     │ Generated        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for report in self.reports[-5:]:
            date = report.generated_at.strftime("%m/%d %H:%M")
            lines.append(
                f"║  {report.id:<7} │ {report.name[:14]:<14} │ {report.type.value[:8]:<8} │ {date:<16} ║"
            )
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    builder = ReportBuilder("Saigon Digital Hub")
    
    print("📊 Report Builder")
    print("=" * 60)
    print()
    
    # Build reports
    now = datetime.now()
    month_start = now.replace(day=1)
    
    revenue_report = builder.build_revenue_report(
        month_start, now,
        revenue=45000,
        expenses=28000,
        invoices=12
    )
    
    clients_report = builder.build_clients_report(
        month_start, now,
        total=15,
        new=4,
        churned=1,
        avg_value=3500
    )
    
    print(builder.format_report(revenue_report))
    print()
    print(builder.format_library())
