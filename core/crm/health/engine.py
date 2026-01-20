"""
Client health score calculation engine.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List

from .models import ClientHealth, HealthLevel, RiskFactor

logger = logging.getLogger(__name__)

class HealthEngine:
    # Weight configuration for overall score
    WEIGHTS = {"engagement": 0.25, "payment": 0.25, "results": 0.30, "communication": 0.20}

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, ClientHealth] = {}

    def calculate_health(
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

        overall = int(
            engagement * self.WEIGHTS["engagement"]
            + payment * self.WEIGHTS["payment"]
            + results * self.WEIGHTS["results"]
            + communication * self.WEIGHTS["communication"]
        )

        if overall >= 80:
            level = HealthLevel.EXCELLENT
        elif overall >= 60:
            level = HealthLevel.GOOD
        elif overall >= 40:
            level = HealthLevel.AT_RISK
        else:
            level = HealthLevel.CRITICAL

        risks = []
        if engagement < 50: risks.append(RiskFactor.LOW_ENGAGEMENT)
        if payment < 70: risks.append(RiskFactor.MISSED_PAYMENTS)
        if results < 50: risks.append(RiskFactor.DECLINING_RESULTS)
        if communication < 50: risks.append(RiskFactor.COMMUNICATION_GAP)

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
        return client
