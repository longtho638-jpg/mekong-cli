"""
Mutual Defense engine logic.
"""
import logging
import uuid
from typing import Dict, List

from .models import CaseStatus, CaseType, DefenseCase


class DefenseEngine:
    def __init__(self):
        self.cases: Dict[str, DefenseCase] = {}
        self.blacklist: List[str] = []

    def report_case(self, reporter: str, client: str, c_type: CaseType, title: str, desc: str, amount: float) -> DefenseCase:
        c = DefenseCase(id=f"DC-{uuid.uuid4().hex[:6].upper()}", reporter_id=reporter, client_name=client, case_type=c_type, title=title, description=desc, amount_disputed=amount, status=CaseStatus.VOTING)
        self.cases[c.id] = c
        return c
