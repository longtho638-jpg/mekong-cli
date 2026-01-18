"""
POC Tracker Agent - Proof of Concept Management
Tracks POCs, success criteria, and conversions.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional


class POCStage(Enum):
    PROPOSED = "proposed"
    IN_PROGRESS = "in_progress"
    EVALUATION = "evaluation"
    WON = "won"
    LOST = "lost"


@dataclass
class SuccessCriterion:
    """POC success criterion"""

    id: str
    description: str
    met: bool = False
    notes: str = ""


@dataclass
class POC:
    """Proof of Concept"""

    id: str
    company: str
    contact: str
    use_case: str
    stage: POCStage = POCStage.PROPOSED
    deal_value: float = 0.0
    criteria: List[SuccessCriterion] = field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    se_assigned: str = ""
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def criteria_met(self) -> int:
        return len([c for c in self.criteria if c.met])

    @property
    def success_rate(self) -> float:
        if not self.criteria:
            return 0
        return self.criteria_met / len(self.criteria) * 100


class POCTrackerAgent:
    """
    POC Tracker Agent - Quản lý POC

    Responsibilities:
    - Create and track POCs
    - Manage success criteria
    - Track conversion rates
    - Technical requirements
    """

    def __init__(self):
        self.name = "POC Tracker"
        self.status = "ready"
        self.pocs: Dict[str, POC] = {}

    def create_poc(
        self,
        company: str,
        contact: str,
        use_case: str,
        deal_value: float,
        duration_days: int = 14,
        se_assigned: str = "",
    ) -> POC:
        """Create new POC"""
        poc_id = f"poc_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        poc = POC(
            id=poc_id,
            company=company,
            contact=contact,
            use_case=use_case,
            deal_value=deal_value,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=duration_days),
            se_assigned=se_assigned,
            stage=POCStage.IN_PROGRESS,
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
        return [
            p for p in self.pocs.values() if p.stage in [POCStage.IN_PROGRESS, POCStage.EVALUATION]
        ]

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
            "pipeline_value": sum(
                p.deal_value for p in pocs if p.stage in [POCStage.IN_PROGRESS, POCStage.EVALUATION]
            ),
            "won_value": sum(p.deal_value for p in pocs if p.stage == POCStage.WON),
        }


# Demo
if __name__ == "__main__":
    agent = POCTrackerAgent()

    print("🔬 POC Tracker Agent Demo\n")

    # Create POC
    poc = agent.create_poc(
        company="TechCorp VN",
        contact="Nguyễn A",
        use_case="Marketing Automation",
        deal_value=10000,
        duration_days=14,
        se_assigned="SE_001",
    )

    print(f"📋 POC: {poc.company}")
    print(f"   Use Case: {poc.use_case}")
    print(f"   Value: ${poc.deal_value:,.0f}")

    # Add criteria
    agent.add_criterion(poc.id, "Deploy in under 15 minutes")
    agent.add_criterion(poc.id, "Cost savings > 50%")
    agent.add_criterion(poc.id, "Integration with Zalo works")

    print(f"\n✅ Criteria: {len(poc.criteria)}")

    # Mark criteria
    agent.mark_criterion(poc.id, "crit_1", True, "Deployed in 12 minutes")
    agent.mark_criterion(poc.id, "crit_2", True, "67% savings achieved")

    print(f"   Met: {poc.criteria_met}/{len(poc.criteria)} ({poc.success_rate:.0f}%)")

    # Update stage
    agent.update_stage(poc.id, POCStage.WON)

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Active: {stats['active']}")
    print(f"   Won Value: ${stats['won_value']:,.0f}")
