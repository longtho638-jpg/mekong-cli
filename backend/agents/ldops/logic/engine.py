"""
Development Agent core logic.
"""

import random
from datetime import datetime
from typing import Dict, List

from .models import CareerTrack, DevelopmentPlan, Skill, SkillLevel


class DevelopmentEngine:
    LEVEL_ORDER = [
        SkillLevel.BEGINNER,
        SkillLevel.INTERMEDIATE,
        SkillLevel.ADVANCED,
        SkillLevel.EXPERT,
    ]

    def __init__(self):
        self.plans: Dict[str, DevelopmentPlan] = {}

    def create_plan(
        self,
        employee_id: str,
        employee_name: str,
        career_track: CareerTrack,
        current_role: str,
        target_role: str,
    ) -> DevelopmentPlan:
        pid = f"plan_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        plan = DevelopmentPlan(
            id=pid,
            employee_id=employee_id,
            employee_name=employee_name,
            career_track=career_track,
            current_role=current_role,
            target_role=target_role,
        )
        self.plans[pid] = plan
        return plan

    def add_skill(
        self,
        plan_id: str,
        name: str,
        category: str,
        current_level: SkillLevel,
        target_level: SkillLevel,
    ) -> Skill:
        if plan_id not in self.plans:
            raise ValueError("Plan not found")
        sid = f"skill_{random.randint(100, 999)}"
        current_idx, target_idx = (
            self.LEVEL_ORDER.index(current_level),
            self.LEVEL_ORDER.index(target_level),
        )
        gap = max(0, target_idx - current_idx)
        skill = Skill(
            id=sid,
            name=name,
            category=category,
            current_level=current_level,
            target_level=target_level,
            gap=gap,
        )
        self.plans[plan_id].skills.append(skill)
        self.plans[plan_id].progress = self.plans[plan_id].calculate_progress()
        return skill
