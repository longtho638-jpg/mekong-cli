"""
Development Agent Facade.
"""
from typing import Dict, List

from .engine import DevelopmentEngine
from .models import CareerTrack, DevelopmentPlan, Skill, SkillLevel


class DevelopmentAgent(DevelopmentEngine):
    """Refactored Development Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Development"
        self.status = "ready"

    def get_stats(self) -> Dict:
        plans = list(self.plans.values())
        return {"total_plans": len(plans), "avg_progress": sum(p.progress for p in plans) / len(plans) if plans else 0}

__all__ = ['DevelopmentAgent', 'SkillLevel', 'CareerTrack', 'Skill', 'DevelopmentPlan']
