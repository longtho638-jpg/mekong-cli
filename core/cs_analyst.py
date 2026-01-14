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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MetricCategory(Enum):
    """Metric categories for analytics."""
    ENGAGEMENT = "engagement"
    SATISFACTION = "satisfaction"
    USAGE = "usage"
    FINANCIAL = "financial"
    RISK = "risk"


class RiskLevel(Enum):
    """Churn risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ClientMetrics:
    """Client success metrics record entity."""
    client_name: str
    engagement_score: int
    satisfaction_score: int
    usage_score: int
    health_score: int
    risk_level: RiskLevel
    last_updated: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        # Validate scores are within 0-100 range
        for score in [self.engagement_score, self.satisfaction_score, self.usage_score, self.health_score]:
            if not 0 <= score <= 100:
                raise ValueError(f"Score {score} out of range (0-100)")


@dataclass
class InsightReport:
    """Analytics insight report record entity."""
    id: str
    title: str
    period: str
    key_findings: List[str]
    recommendations: List[str]
    created_at: datetime = field(default_factory=datetime.now)


class CSAnalyst:
    """
    Customer Success Analyst System.
    
    Provides data-driven insights into portfolio health and churn risk.
    """
    
    # Weight configuration for health calculation
    WEIGHTS = {
        "engagement": 0.35,
        "satisfaction": 0.40,
        "usage": 0.25
    }
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.client_metrics: Dict[str, ClientMetrics] = {}
        self.reports: List[InsightReport] = []
        logger.info(f"CS Analyst initialized for {agency_name}")
    
    def calculate_health_score(
        self,
        engagement: int,
        satisfaction: int,
        usage: int
    ) -> int:
        """Weighted health score calculation."""
        return int(
            engagement * self.WEIGHTS["engagement"] + 
            satisfaction * self.WEIGHTS["satisfaction"] + 
            usage * self.WEIGHTS["usage"]
        )
    
    def assess_risk(self, health_score: int) -> RiskLevel:
        """Map health score to a specific risk tier."""
        if health_score >= 80: return RiskLevel.LOW
        if health_score >= 60: return RiskLevel.MEDIUM
        if health_score >= 40: return RiskLevel.HIGH
        return RiskLevel.CRITICAL
    
    def analyze_client(
        self,
        client_name: str,
        engagement: int,
        satisfaction: int,
        usage: int
    ) -> ClientMetrics:
        """Execute a full health and risk analysis for a client."""
        if not client_name:
            raise ValueError("Client name is required")

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
        logger.info(f"Analysis complete for {client_name}. Health: {health}, Risk: {risk.value}")
        return metrics
    
    def generate_report(
        self,
        title: str,
        period: str,
        findings: List[str],
        recommendations: List[str]
    ) -> InsightReport:
        """Create a summary intelligence report."""
        report = InsightReport(
            id=f"RPT-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            period=period,
            key_findings=findings,
            recommendations=recommendations
        )
        self.reports.append(report)
        logger.info(f"Insight report generated: {title}")
        return report
    
    def get_at_risk_list(self) -> List[ClientMetrics]:
        """Filter list of high or critical risk clients."""
        return [m for m in self.client_metrics.values() 
                if m.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
    
    def format_dashboard(self) -> str:
        """Render the CS Analyst Dashboard."""
        active_count = len(self.client_metrics)
        avg_health = sum(m.health_score for m in self.client_metrics.values()) / active_count if active_count else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 CS ANALYST DASHBOARD{' ' * 34}║",
            f"║  {active_count} clients │ Avg Health: {avg_health:.0f}% {' ' * 25}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📈 RISK DISTRIBUTION                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        icons = {RiskLevel.LOW: "🟢", RiskLevel.MEDIUM: "🟡", RiskLevel.HIGH: "🟠", RiskLevel.CRITICAL: "🔴"}
        for level in RiskLevel:
            count = sum(1 for m in self.client_metrics.values() if m.risk_level == level)
            bar = "█" * count + "░" * max(0, 5 - count)
            lines.append(f"║  {icons[level]} {level.value.capitalize():<10} │ {bar:<5} │ {count:>2} clients          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ AT-RISK ANALYSIS (Lowest Score First)                 ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        at_risk = sorted(self.get_at_risk_list(), key=lambda x: x.health_score)[:4]
        if not at_risk:
            lines.append("║    ✅ No high-risk clients detected.                      ║")
        else:
            for m in at_risk:
                icon = icons.get(m.risk_level, "⚪")
                bar = "█" * (m.health_score // 10) + "░" * (10 - m.health_score // 10)
                lines.append(f"║  {icon} {m.client_name[:15]:<15} │ {bar} │ {m.health_score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📊 Run Data]  [📋 Generate Report]  [📈 Global Trends]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Insights!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing CS Analyst...")
    print("=" * 60)
    
    try:
        analyst = CSAnalyst("Saigon Digital Hub")
        # Seed analysis
        analyst.analyze_client("Acme Corp", 90, 85, 88)
        analyst.analyze_client("Fashion Brand", 40, 45, 35)
        
        print("\n" + analyst.format_dashboard())
        
    except Exception as e:
        logger.error(f"Analysis Error: {e}")
