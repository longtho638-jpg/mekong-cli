"""
Health Score Agent Data Models.
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class RiskLevel(Enum):
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    CRITICAL = "critical"

@dataclass
class UserHealth:
    user_id: str
    user_name: str
    usage_score: int = 0
    engagement_score: int = 0
    support_score: int = 0
    tenure_score: int = 0
    last_active: Optional[datetime] = None
    signup_date: Optional[datetime] = field(default_factory=datetime.now)

    @property
    def health_score(self) -> int:
        return int(self.usage_score * 0.4 + self.engagement_score * 0.3 + self.support_score * 0.2 + self.tenure_score * 0.1)

    @property
    def risk_level(self) -> RiskLevel:
        if self.health_score >= 70: return RiskLevel.HEALTHY
        if self.health_score >= 40: return RiskLevel.AT_RISK
        return RiskLevel.CRITICAL
