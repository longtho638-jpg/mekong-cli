"""
Health Score Agent Facade.
"""
from typing import Dict

from .engine import HealthEngine
from .models import RiskLevel, UserHealth


class HealthScoreAgent(HealthEngine):
    """Refactored Health Score Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Health Score"
        self.status = "ready"

    def get_stats(self) -> Dict:
        users = list(self.users.values())
        return {"total": len(users), "avg_score": sum(u.health_score for u in users) / len(users) if users else 0}

__all__ = ['HealthScoreAgent', 'RiskLevel', 'UserHealth']
