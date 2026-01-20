"""
Data models and Enums for Client Health.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class HealthLevel(Enum):
    """Client health levels."""
    EXCELLENT = "excellent"  # 80-100
    GOOD = "good"           # 60-79
    AT_RISK = "at_risk"     # 40-59
    CRITICAL = "critical"   # < 40

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
