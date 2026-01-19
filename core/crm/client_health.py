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

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class HealthLevel(Enum):
    """Client health levels."""

    EXCELLENT = "excellent"  # 80-100
    GOOD = "good"  # 60-79
    AT_RISK = "at_risk"  # 40-59
    CRITICAL = "critical"  # < 40


class RiskFactor(Enum):
    """Behavioral risk factors."""

    LOW_ENGAGEMENT = "low_engagement"
    MISSED_PAYMENTS = "missed_payments"
    DECLINING_RESULTS = "declining_results"
    COMMUNICATION_GAP = "communication_gap"
    CONTRACT_ENDING = "contract_ending"


@dataclass
class ClientHealth:
    """Client health snapshot entity."""

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

    def __post_init__(self):
        # Validate all scores are within 0-100
        for score in [
            self.overall_score,
            self.engagement_score,
            self.payment_score,
            self.results_score,
            self.communication_score,
        ]:
            if not 0 <= score <= 100:
                raise ValueError(f"Score {score} out of range (0-100)")


class ClientHealthScore:
    """
    Client Health Score System.

    Predicts churn by monitoring engagement, payment, results, and communication.
    """

    # Weight configuration for overall score
    WEIGHTS = {"engagement": 0.25, "payment": 0.25, "results": 0.30, "communication": 0.20}

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, ClientHealth] = {}
        logger.info(f"Client Health System initialized for {agency_name}")

    def add_client(
        self,
        name: str,
        engagement: int = 80,
        payment: int = 100,
        results: int = 70,
        communication: int = 85,
    ) -> ClientHealth:
        """Analyze and record client health."""
        if not name:
            raise ValueError("Client name required")

        # Calculate overall score based on weights
        overall = int(
            engagement * self.WEIGHTS["engagement"]
            + payment * self.WEIGHTS["payment"]
            + results * self.WEIGHTS["results"]
            + communication * self.WEIGHTS["communication"]
        )

        # Determine level
        if overall >= 80:
            level = HealthLevel.EXCELLENT
        elif overall >= 60:
            level = HealthLevel.GOOD
        elif overall >= 40:
            level = HealthLevel.AT_RISK
        else:
            level = HealthLevel.CRITICAL

        # Risk factor detection
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
            last_contact=datetime.now() - timedelta(days=int(100 - engagement) // 10),
        )

        self.clients[client.id] = client
        logger.info(f"Client health tracked: {name} (Score: {overall})")
        return client

    def get_at_risk(self) -> List[ClientHealth]:
        """Filter clients requiring immediate attention."""
        return [
            c
            for c in self.clients.values()
            if c.health_level in [HealthLevel.AT_RISK, HealthLevel.CRITICAL]
        ]

    def format_dashboard(self) -> str:
        """Render Health Dashboard."""
        total = len(self.clients)
        at_risk = self.get_at_risk()

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ❤️ CLIENT HEALTH DASHBOARD{' ' * 32}║",
            f"║  {total} clients │ {len(at_risk)} at-risk │ {self.agency_name[:25]:<25} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 TOP HEALTH SCORES                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        level_icons = {
            HealthLevel.EXCELLENT: "🟢",
            HealthLevel.GOOD: "🟡",
            HealthLevel.AT_RISK: "🟠",
            HealthLevel.CRITICAL: "🔴",
        }

        # Sort by score
        sorted_clients = sorted(self.clients.values(), key=lambda x: x.overall_score, reverse=True)[
            :5
        ]
        for c in sorted_clients:
            icon = level_icons.get(c.health_level, "⚪")
            bar = "█" * (c.overall_score // 10) + "░" * (10 - c.overall_score // 10)
            lines.append(f"║  {icon} {c.client_name[:15]:<15} │ {bar} │ {c.overall_score:>3}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  🚨 URGENT: AT-RISK CLIENTS                               ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        if not at_risk:
            lines.append("║    ✅ All clients are currently healthy!                  ║")
        else:
            for c in at_risk[:3]:
                # Shorten risk factor names
                risk_str = ", ".join(r.value.split("_")[0] for r in c.risk_factors[:2])
                lines.append(f"║    🔴 {c.client_name[:15]:<15} │ {risk_str:<25}  ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  📈 AVERAGE METRICS                                       ║",
                "║  ───────────────────────────────────────────────────────  ║",
            ]
        )

        if total:

            def avg(attr):
                return sum(getattr(c, attr) for c in self.clients.values()) // total

            lines.append(
                f"║    📊 Engagement: {avg('engagement_score'):>3}  │  💳 Payment: {avg('payment_score'):>3}      ║"
            )
            lines.append(
                f"║    📈 Results:    {avg('results_score'):>3}  │  💬 Comms:   {avg('communication_score'):>3}      ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  [📊 Details]  [📧 Outreach]  [📅 Schedule Check-in]      ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Health!              ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("❤️ Initializing Client Health Score System...")
    print("=" * 60)

    try:
        health = ClientHealthScore("Saigon Digital Hub")

        # Add diverse clients
        health.add_client(
            "Sunrise Realty", engagement=90, payment=100, results=85, communication=95
        )
        health.add_client("Coffee Lab", engagement=75, payment=100, results=70, communication=80)
        health.add_client(
            "Tech Startup VN", engagement=60, payment=80, results=55, communication=60
        )
        health.add_client("Fashion Brand", engagement=40, payment=60, results=35, communication=45)

        print("\n" + health.format_dashboard())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
