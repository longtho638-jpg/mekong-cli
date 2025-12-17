"""
📈 Client Dashboard - Monthly Performance Reports
===================================================

Generate beautiful monthly reports for agency clients.
Show metrics, progress, and wins!

Features:
- Monthly metrics summary
- Progress visualization
- Key wins highlight
- Recommendations
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import random


class MetricTrend(Enum):
    """Metric trend direction."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


@dataclass
class Metric:
    """A performance metric."""
    name: str
    value: float
    previous: float
    unit: str = ""
    
    @property
    def change(self) -> float:
        if self.previous == 0:
            return 0
        return ((self.value - self.previous) / self.previous) * 100
    
    @property
    def trend(self) -> MetricTrend:
        if self.change > 5:
            return MetricTrend.UP
        elif self.change < -5:
            return MetricTrend.DOWN
        else:
            return MetricTrend.STABLE


@dataclass
class DashboardReport:
    """A client dashboard report."""
    client_name: str
    client_company: str
    period: str
    metrics: List[Metric]
    wins: List[str]
    recommendations: List[str]
    generated_at: datetime = field(default_factory=datetime.now)


class ClientDashboard:
    """
    Client Dashboard Generator.
    
    Create beautiful monthly reports for clients.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
    
    def generate_report(
        self,
        client_name: str,
        client_company: str,
        period: str = None
    ) -> DashboardReport:
        """Generate a sample dashboard report."""
        if period is None:
            period = datetime.now().strftime("%B %Y")
        
        # Sample metrics (would come from real data)
        metrics = [
            Metric("Website Traffic", 12500, 10850, "visitors"),
            Metric("Conversion Rate", 3.2, 2.8, "%"),
            Metric("Leads Generated", 156, 128, "leads"),
            Metric("Revenue", 45000, 38500, "$"),
            Metric("Email Open Rate", 32.5, 28.2, "%"),
            Metric("Social Followers", 2450, 2100, "followers"),
        ]
        
        wins = [
            "🎉 Traffic increased by 15% month-over-month!",
            "🏆 Conversion rate at all-time high of 3.2%!",
            "💰 Revenue exceeded target by $5,000!",
            "📧 Email list grew by 500 new subscribers!",
        ]
        
        recommendations = [
            "💡 Launch retargeting campaigns for abandoned carts",
            "📊 A/B test new landing page headlines",
            "🎯 Increase ad spend on top-performing channels",
            "📱 Optimize mobile checkout experience",
        ]
        
        return DashboardReport(
            client_name=client_name,
            client_company=client_company,
            period=period,
            metrics=metrics,
            wins=wins,
            recommendations=recommendations
        )
    
    def format_dashboard(self, report: DashboardReport) -> str:
        """Format dashboard as ASCII report."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📈 MONTHLY DASHBOARD: {report.client_company.upper()[:28]:<28}   ║",
            f"║  Period: {report.period:<45}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        # Metrics section
        lines.append("║  📊 KEY METRICS                                           ║")
        lines.append("║  ─────────────────────────────────────────────────────── ║")
        
        for metric in report.metrics:
            # Trend indicator
            if metric.trend == MetricTrend.UP:
                trend = "↑"
                color = "🟢"
            elif metric.trend == MetricTrend.DOWN:
                trend = "↓"
                color = "🔴"
            else:
                trend = "→"
                color = "🟡"
            
            # Format value
            if metric.unit == "$":
                value_str = f"${metric.value:,.0f}"
            elif metric.unit == "%":
                value_str = f"{metric.value:.1f}%"
            else:
                value_str = f"{metric.value:,.0f}"
            
            change_str = f"{metric.change:+.1f}%"
            
            lines.append(f"║  {color} {metric.name:<18} {value_str:>10}  ({trend} {change_str})       ║")
        
        lines.append("║                                                           ║")
        
        # Wins section
        lines.append("╠═══════════════════════════════════════════════════════════╣")
        lines.append("║  🏆 THIS MONTH'S WINS                                     ║")
        lines.append("║  ─────────────────────────────────────────────────────── ║")
        
        for win in report.wins[:4]:
            lines.append(f"║    {win[:50]:<50}   ║")
        
        lines.append("║                                                           ║")
        
        # Recommendations section
        lines.append("╠═══════════════════════════════════════════════════════════╣")
        lines.append("║  💡 NEXT MONTH RECOMMENDATIONS                            ║")
        lines.append("║  ─────────────────────────────────────────────────────── ║")
        
        for rec in report.recommendations[:4]:
            lines.append(f"║    {rec[:50]:<50}   ║")
        
        lines.append("║                                                           ║")
        
        # Footer
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Generated by {self.agency_name:<38}   ║",
            f"║  {report.generated_at.strftime('%Y-%m-%d %H:%M'):<51}   ║",
            "║                                                           ║",
            "║  🏯 \"Không đánh mà thắng\" - Win Without Fighting          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_summary_email(self, report: DashboardReport) -> str:
        """Format as email summary."""
        # Calculate overall health
        positive = sum(1 for m in report.metrics if m.trend == MetricTrend.UP)
        total = len(report.metrics)
        health_pct = (positive / total) * 100
        
        if health_pct >= 80:
            health = "🔥 EXCELLENT"
        elif health_pct >= 60:
            health = "✅ GOOD"
        elif health_pct >= 40:
            health = "🟡 MODERATE"
        else:
            health = "⚠️ NEEDS ATTENTION"
        
        lines = [
            f"Subject: 📈 {report.period} Report for {report.client_company}",
            "",
            f"Hi {report.client_name}! 👋",
            "",
            f"Here's your {report.period} performance summary:",
            "",
            f"📊 Overall Health: {health}",
            f"   {positive}/{total} metrics trending up!",
            "",
            "🏆 Key Wins:",
        ]
        
        for win in report.wins[:3]:
            lines.append(f"   • {win}")
        
        lines.extend([
            "",
            "📈 Quick Stats:",
        ])
        
        for metric in report.metrics[:4]:
            trend = "↑" if metric.trend == MetricTrend.UP else ("↓" if metric.trend == MetricTrend.DOWN else "→")
            lines.append(f"   • {metric.name}: {metric.value:,.0f} ({trend} {metric.change:+.1f}%)")
        
        lines.extend([
            "",
            "View full dashboard in your client portal!",
            "",
            f"Best,",
            f"{self.agency_name} Team 🏯",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    dashboard = ClientDashboard("Saigon Digital Hub")
    
    print("📈 Client Dashboard Generator")
    print("=" * 60)
    print()
    
    # Generate report
    report = dashboard.generate_report(
        client_name="Mr. Hoang",
        client_company="Sunrise Realty"
    )
    
    print(dashboard.format_dashboard(report))
    print()
    print("-" * 60)
    print()
    print("📧 Email Summary:")
    print()
    print(dashboard.format_summary_email(report))
