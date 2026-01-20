"""
Customer Success management engine.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, List

from .models import EngagementLevel, QBRRecord, SuccessPlan, SuccessStage

logger = logging.getLogger(__name__)

class CSMEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.success_plans: Dict[str, SuccessPlan] = {}
        self.qbrs: List[QBRRecord] = []

    def create_success_plan(
        self, client_name: str, csm: str, goals: List[str], milestones: List[str]
    ) -> SuccessPlan:
        if not client_name or not csm:
            raise ValueError("Client and CSM names are required")

        plan = SuccessPlan(
            id=f"CSP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name, csm=csm,
            stage=SuccessStage.ONBOARDING,
            goals=goals, milestones=milestones,
            risks=[], engagement=EngagementLevel.ENGAGED,
        )
        self.success_plans[plan.id] = plan
        logger.info(f"Success plan created for {client_name}")
        return plan

    def advance_stage(self, plan_id: str) -> bool:
        if plan_id not in self.success_plans: return False
        plan = self.success_plans[plan_id]
        stages = list(SuccessStage)
        current_idx = stages.index(plan.stage)
        if current_idx < len(stages) - 1:
            plan.stage = stages[current_idx + 1]
            return True
        return False

    def record_qbr(
        self, client_name: str, achievements: List[str],
        challenges: List[str], next_goals: List[str], satisfaction: int,
    ) -> QBRRecord:
        qbr = QBRRecord(
            id=f"QBR-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name, date=datetime.now(),
            achievements=achievements, challenges=challenges,
            next_quarter_goals=next_goals, satisfaction=satisfaction,
        )
        self.qbrs.append(qbr)
        return qbr
