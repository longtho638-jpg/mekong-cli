"""
📊 Customer Success Analyst - Data & Insights
===============================================

Analyze customer data for insights.
Data-driven success strategies!

Roles:
- Health score analysis
- Churn prediction
- Usage analytics
- Success metrics reporting
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class MetricCategory(Enum):
    """Metric categories."""
    ENGAGEMENT = "engagement"
    SATISFACTION = "satisfaction"
    USAGE = "usage"
    FINANCIAL = "financial"
    RISK = "risk"


class RiskLevel(Enum):
    """Churn risk level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ClientMetrics:
    """Client success metrics."""
    client_name: str
    engagement_score: int
    satisfaction_score: int
    usage_score: int
    health_score: int
    risk_level: RiskLevel
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class InsightReport:
    """Analytics insight report."""
    id: str
    title: str
    period: str
    key_findings: List[str]
    recommendations: List[str]
    created_at: datetime = field(default_factory=datetime.now)


class CSAnalyst:
    """
    Customer Success Analyst.
    
    Data-driven insights.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.client_metrics: Dict[str, ClientMetrics] = {}
        self.reports: List[InsightReport] = []
    
    def calculate_health_score(
        self,
        engagement: int,
        satisfaction: int,
        usage: int
    ) -> int:
        """Calculate health score."""
        return int(engagement * 0.35 + satisfaction * 0.40 + usage * 0.25)
    
    def assess_risk(self, health_score: int) -> RiskLevel:
        """Assess churn risk."""
        if health_score >= 80:
            return RiskLevel.LOW
        elif health_score >= 60:
            return RiskLevel.MEDIUM
        elif health_score >= 40:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    def analyze_client(
        self,
        client_name: str,
        engagement: int,
        satisfaction: int,
        usage: int
    ) -> ClientMetrics:
        """Analyze client metrics."""
        health = self.calculate_health_score(engagement, satisfaction, usage)
        risk = self.assess_risk(health)
        
        metrics = ClientMetrics(
            client_name=client_name,
            engagement_score=engagement,
            satisfaction_score=satisfaction,
            usage_score=usage,
            health_score=health,
            risk_level=risk
        )
        self.client_metrics[client_name] = metrics
        return metrics
    
    def generate_report(
        self,
        title: str,
        period: str,
        findings: List[str],
        recommendations: List[str]
    ) -> InsightReport:
        """Generate insight report."""
        report = InsightReport(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            period=period,
            key_findings=findings,
            recommendations=recommendations
        )
        self.reports.append(report)
        return report
    
    def get_at_risk(self) -> List[ClientMetrics]:
        """Get at-risk clients."""
        return [m for m in self.client_metrics.values() 
                if m.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
    
    def get_portfolio_stats(self) -> Dict[str, Any]:
        """Get portfolio statistics."""
        if not self.client_metrics:
            return {}
        
        scores = [m.health_score for m in self.client_metrics.values()]
        return {
            "total_clients": len(self.client_metrics),
            "avg_health": sum(scores) / len(scores),
            "at_risk": len(self.get_at_risk()),
            "healthy": sum(1 for m in self.client_metrics.values() if m.risk_level == RiskLevel.LOW)
        }
    
    def format_dashboard(self) -> str:
        """Format analyst dashboard."""
        stats = self.get_portfolio_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 CS ANALYST                                            ║",
            f"║  {stats.get('total_clients', 0)} clients │ Avg Health: {stats.get('avg_health', 0):.0f}%                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 HEALTH DISTRIBUTION                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for risk in RiskLevel:
            count = sum(1 for m in self.client_metrics.values() if m.risk_level == risk)
            icons = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}
            bar = "█" * count + "░" * max(0, 5 - count)
            lines.append(f"║  {icons[risk.value]} {risk.value.capitalize():<10} │ {bar:<5} │ {count:>2} clients          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ AT-RISK ANALYSIS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for metrics in sorted(self.get_at_risk(), key=lambda x: x.health_score)[:4]:
            icons = {"low": "🟢", "medium": "🟡", "high": "🟠", "critical": "🔴"}
            bar = "█" * (metrics.health_score // 10) + "░" * (10 - metrics.health_score // 10)
            
            lines.append(f"║  {icons[metrics.risk_level.value]} {metrics.client_name[:15]:<15} │ {bar} │ {metrics.health_score}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 SCORE BREAKDOWN                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📊 Engagement (35%)  │ 📈 Satisfaction (40%)           ║",
            "║    💻 Usage (25%)       │ = Health Score                  ║",
            "║                                                           ║",
            "║  [📊 Run Analysis]  [📋 Generate Report]  [📈 Trends]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Data-driven success!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    analyst = CSAnalyst("Saigon Digital Hub")
    
    print("📊 CS Analyst")
    print("=" * 60)
    print()
    
    # Analyze clients
    analyst.analyze_client("Sunrise Realty", 90, 85, 88)
    analyst.analyze_client("Coffee Lab", 75, 80, 70)
    analyst.analyze_client("Tech Startup", 60, 65, 55)
    analyst.analyze_client("Fashion Brand", 40, 45, 35)
    analyst.analyze_client("Restaurant Chain", 85, 90, 80)
    
    # Generate report
    analyst.generate_report(
        "Q4 Portfolio Analysis",
        "October - December 2025",
        ["2 clients at high risk", "Engagement trending down", "NPS improved 5 points"],
        ["Focus on Fashion Brand", "Launch re-engagement campaign", "Schedule executive check-ins"]
    )
    
    print(analyst.format_dashboard())
