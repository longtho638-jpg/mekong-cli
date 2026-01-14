"""
📊 Report Builder - Custom Reports
=====================================

Build custom reports with automated metric aggregation.
Data visualization made easy!

Features:
- Multiple report types (Revenue, Clients, etc.)
- Automated change calculation
- Date range filtering
- ASCII dashboard output
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ReportType(Enum):
    """Categories of generated reports."""
    REVENUE = "revenue"
    CLIENTS = "clients"
    PROJECTS = "projects"
    TEAM = "team"
    MARKETING = "marketing"
    CUSTOM = "custom"


class MetricType(Enum):
    """Mathematical nature of a report metric."""
    SUM = "sum"
    AVERAGE = "average"
    COUNT = "count"
    PERCENTAGE = "percentage"


@dataclass
class ReportMetric:
    """A specific data point record entity."""
    name: str
    value: float
    m_type: MetricType
    change: float = 0.0
    icon: str = "📊"


@dataclass
class Report:
    """A generated report document entity."""
    id: str
    name: str
    r_type: ReportType
    metrics: List[ReportMetric]
    start_date: datetime
    end_date: datetime
    generated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if not self.name or not self.metrics:
            raise ValueError("Report name and metrics are mandatory")


class ReportBuilder:
    """
    Report Building System.
    
    Orchestrates the aggregation of business metrics into formatted reports for stakeholder analysis.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.archive: List[Report] = []
        logger.info(f"Report Builder initialized for {agency_name}")
    
    def generate_report(
        self,
        name: str,
        r_type: ReportType,
        metrics: List[ReportMetric],
        days: int = 30
    ) -> Report:
        """Execute report generation logic."""
        end = datetime.now()
        start = end - timedelta(days=days)
        
        report = Report(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            name=name, r_type=r_type,
            metrics=metrics, start_date=start, end_date=end
        )
        self.archive.append(report)
        logger.info(f"Report Generated: {name} ({r_type.value})")
        return report
    
    def format_report(self, r: Report) -> str:
        """Render ASCII Report Dashboard."""
        period = f"{r.start_date.strftime('%b %d')} - {r.end_date.strftime('%b %d, %Y')}"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 {r.name.upper()[:48]:<48}  ║",
            f"║  📅 {period:<48}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for m in r.metrics:
            trend = "↑" if m.change >= 0 else "↓"
            status = "🟢" if m.change >= 0 else "🔴"
            val_str = f"{m.value:>12,.1f}" if m.m_type != MetricType.PERCENTAGE else f"{m.value:>11.1f}%"
            
            lines.append(f"║  {m.icon} {m.name:<18} │ {val_str} │ {status} {trend}{abs(m.change):>5.1f}%  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📥 Export PDF]  [📧 Email Team]  [📊 Visualize]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Insights!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Report System...")
    print("=" * 60)
    
    try:
        builder = ReportBuilder("Saigon Digital Hub")
        # Sample Metrics
        m_list = [
            ReportMetric("Total Revenue", 45000.0, MetricType.SUM, 12.5, "💰"),
            ReportMetric("Conversion Rate", 3.2, MetricType.PERCENTAGE, -1.5, "🎯")
        ]
        rpt = builder.generate_report("Monthly KPI", ReportType.REVENUE, m_list)
        
        print("\n" + builder.format_report(rpt))
        
    except Exception as e:
        logger.error(f"Report Error: {e}")
