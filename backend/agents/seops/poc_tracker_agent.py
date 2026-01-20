"""
POC Tracker Agent - Proof of Concept Management (Refactored)
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List
from .models import POCStage, SuccessCriterion, POC

class POCTrackerAgent:
    """
    POC Tracker Agent - Quản lý POC
    """

    def __init__(self):
        self.name = "POC Tracker"
        self.status = "ready"
        self.pocs: Dict[str, POC] = {}

    def create_poc(self, company: str, contact: str, use_case: str, deal_value: float,
                   duration_days: int = 14, se_assigned: str = "") -> POC:
        """Create new POC"""
        poc_id = f"poc_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        poc = POC(
            id=poc_id, company=company, contact=contact, use_case=use_case,
            deal_value=deal_value, start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=duration_days),
            se_assigned=se_assigned, stage=POCStage.IN_PROGRESS,
        )
        self.pocs[poc_id] = poc
        return poc

    def add_criterion(self, poc_id: str, description: str) -> POC:
        """Add success criterion"""
        if poc_id not in self.pocs:
            raise ValueError(f"POC not found: {poc_id}")
        poc = self.pocs[poc_id]
        criterion = SuccessCriterion(id=f"crit_{len(poc.criteria) + 1}", description=description)
        poc.criteria.append(criterion)
        return poc

    def mark_criterion(self, poc_id: str, criterion_id: str, met: bool, notes: str = "") -> POC:
        """Mark criterion as met/not met"""
        if poc_id not in self.pocs:
            raise ValueError(f"POC not found: {poc_id}")
        poc = self.pocs[poc_id]
        for c in poc.criteria:
            if c.id == criterion_id:
                c.met = met
                c.notes = notes
                break
        return poc

    def update_stage(self, poc_id: str, stage: POCStage) -> POC:
        """Update POC stage"""
        if poc_id not in self.pocs:
            raise ValueError(f"POC not found: {poc_id}")
        poc = self.pocs[poc_id]
        poc.stage = stage
        return poc

    def get_active(self) -> List[POC]:
        """Get active POCs"""
        return [p for p in self.pocs.values() if p.stage in [POCStage.IN_PROGRESS, POCStage.EVALUATION]]

    def get_stats(self) -> Dict:
        """Get POC statistics"""
        pocs = list(self.pocs.values())
        won = len([p for p in pocs if p.stage == POCStage.WON])
        closed = len([p for p in pocs if p.stage in [POCStage.WON, POCStage.LOST]])
        return {
            "total_pocs": len(pocs),
            "active": len(self.get_active()),
            "won": won,
            "lost": len([p for p in pocs if p.stage == POCStage.LOST]),
            "win_rate": f"{won / closed * 100:.0f}%" if closed > 0 else "0%",
            "pipeline_value": sum(p.deal_value for p in pocs if p.stage in [POCStage.IN_PROGRESS, POCStage.EVALUATION]),
            "won_value": sum(p.deal_value for p in pocs if p.stage == POCStage.WON),
        }
