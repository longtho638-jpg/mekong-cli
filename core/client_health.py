"""
❤️ Client Health Score - Proactive Client Management
======================================================

Monitor client health and prevent churn.
Healthy clients = Growing agency!

Features:
- Multi-factor health scoring
- Churn risk indicators
- Engagement tracking
- Proactive alerts
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class HealthLevel(Enum):
    """Health levels."""
    EXCELLENT = "excellent"
    GOOD = "good"
    AT_RISK = "at_risk"
    CRITICAL = "critical"


class RiskFactor(Enum):
    """Risk factors."""
    LOW_ENGAGEMENT = "low_engagement"
    MISSED_PAYMENTS = "missed_payments"
    DECLINING_RESULTS = "declining_results"
    COMMUNICATION_GAP = "communication_gap"
    CONTRACT_ENDING = "contract_ending"


@dataclass
class ClientHealth:
    """Client health record."""
    id: str
    client_name: str
    overall_score: int  # 0-100
    health_level: HealthLevel
    engagement_score: int = 0
    payment_score: int = 0
    results_score: int = 0
    communication_score: int = 0
    risk_factors: List[RiskFactor] = field(default_factory=list)
    last_contact: Optional[datetime] = None


class ClientHealthScore:
    """
    Client Health Score.
    
    Monitor and prevent churn.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, ClientHealth] = {}
    
    def add_client(
        self,
        name: str,
        engagement: int = 80,
        payment: int = 100,
        results: int = 70,
        communication: int = 85
    ) -> ClientHealth:
        """Add client health record."""
        # Calculate overall score
        overall = int((engagement * 0.25 + payment * 0.25 + results * 0.30 + communication * 0.20))
        
        # Determine health level
        if overall >= 80:
            level = HealthLevel.EXCELLENT
        elif overall >= 60:
            level = HealthLevel.GOOD
        elif overall >= 40:
            level = HealthLevel.AT_RISK
        else:
            level = HealthLevel.CRITICAL
        
        # Identify risk factors
        risks = []
        if engagement < 50:
            risks.append(RiskFactor.LOW_ENGAGEMENT)
        if payment < 70:
            risks.append(RiskFactor.MISSED_PAYMENTS)
        if results < 50:
            risks.append(RiskFactor.DECLINING_RESULTS)
        if communication < 50:
            risks.append(RiskFactor.COMMUNICATION_GAP)
        
        client = ClientHealth(
            id=f"CHK-{uuid.uuid4().hex[:6].upper()}",
            client_name=name,
            overall_score=overall,
            health_level=level,
            engagement_score=engagement,
            payment_score=payment,
            results_score=results,
            communication_score=communication,
            risk_factors=risks,
            last_contact=datetime.now() - timedelta(days=int(100 - engagement) // 10)
        )
        
        self.clients[client.id] = client
        return client
    
    def get_at_risk(self) -> List[ClientHealth]:
        """Get at-risk clients."""
        return [c for c in self.clients.values() if c.health_level in [HealthLevel.AT_RISK, HealthLevel.CRITICAL]]
    
    def format_dashboard(self) -> str:
        """Format health dashboard."""
        total = len(self.clients)
        excellent = sum(1 for c in self.clients.values() if c.health_level == HealthLevel.EXCELLENT)
        at_risk = len(self.get_at_risk())
        avg_score = sum(c.overall_score for c in self.clients.values()) / total if total else 0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ❤️ CLIENT HEALTH SCORE                                   ║",
            f"║  {total} clients │ {excellent} excellent │ {at_risk} at-risk          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 HEALTH OVERVIEW                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"excellent": "💚", "good": "💛", "at_risk": "🧡", "critical": "❤️"}
        
        for client in sorted(self.clients.values(), key=lambda x: x.overall_score, reverse=True)[:5]:
            icon = level_icons.get(client.health_level.value, "❓")
            bar = "█" * (client.overall_score // 10) + "░" * (10 - client.overall_score // 10)
            lines.append(f"║  {icon} {client.client_name[:15]:<15} │ {bar} │ {client.overall_score:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  ⚠️ AT-RISK CLIENTS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        at_risk_clients = self.get_at_risk()[:3]
        if at_risk_clients:
            for client in at_risk_clients:
                risks = ", ".join(r.value.replace("_", " ")[:12] for r in client.risk_factors[:2])
                lines.append(f"║    🚨 {client.client_name[:15]:<15} │ {risks:<25}  ║")
        else:
            lines.append("║    ✅ No at-risk clients! Great job!                      ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 SCORE BREAKDOWN                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📊 Engagement:     {sum(c.engagement_score for c in self.clients.values()) // max(1, total):>3}   (25% weight)           ║",
            f"║    💳 Payment:        {sum(c.payment_score for c in self.clients.values()) // max(1, total):>3}   (25% weight)           ║",
            f"║    📈 Results:        {sum(c.results_score for c in self.clients.values()) // max(1, total):>3}   (30% weight)           ║",
            f"║    💬 Communication:  {sum(c.communication_score for c in self.clients.values()) // max(1, total):>3}   (20% weight)           ║",
            "║                                                           ║",
            "║  [📊 Details]  [📧 Outreach]  [📅 Schedule Check-in]      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Healthy clients!                 ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    health = ClientHealthScore("Saigon Digital Hub")
    
    print("❤️ Client Health Score")
    print("=" * 60)
    print()
    
    # Add clients
    health.add_client("Sunrise Realty", engagement=90, payment=100, results=85, communication=95)
    health.add_client("Coffee Lab", engagement=75, payment=100, results=70, communication=80)
    health.add_client("Tech Startup VN", engagement=60, payment=80, results=55, communication=60)
    health.add_client("Fashion Brand", engagement=40, payment=60, results=35, communication=45)
    
    print(health.format_dashboard())
