"""
Lead Qualifier Agent - BANT Scoring & Qualification
Qualifies leads using BANT methodology and prepares for AE handoff.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class QualificationStatus(Enum):
    PENDING = "pending"
    QUALIFIED = "qualified"
    DISQUALIFIED = "disqualified"
    HANDED_OFF = "handed_off"


@dataclass
class BANTScore:
    """BANT scoring"""
    budget: int = 0  # 0-25
    authority: int = 0  # 0-25
    need: int = 0  # 0-25
    timeline: int = 0  # 0-25

    @property
    def total(self) -> int:
        return self.budget + self.authority + self.need + self.timeline

    @property
    def grade(self) -> str:
        if self.total >= 80:
            return "A"
        elif self.total >= 60:
            return "B"
        elif self.total >= 40:
            return "C"
        else:
            return "D"


@dataclass
class Lead:
    """Sales lead"""
    id: str
    name: str
    company: str
    email: str
    title: str
    bant: BANTScore = field(default_factory=BANTScore)
    status: QualificationStatus = QualificationStatus.PENDING
    notes: str = ""
    assigned_ae: Optional[str] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class LeadQualifierAgent:
    """
    Lead Qualifier Agent - Chấm điểm BANT
    
    Responsibilities:
    - Score leads using BANT
    - Qualify/disqualify leads
    - Prepare AE handoffs
    - Track qualification metrics
    """

    # Qualification threshold
    QUALIFIED_THRESHOLD = 60

    def __init__(self):
        self.name = "Lead Qualifier"
        self.status = "ready"
        self.leads: Dict[str, Lead] = {}

    def add_lead(
        self,
        name: str,
        company: str,
        email: str,
        title: str
    ) -> Lead:
        """Add new lead to queue"""
        lead_id = f"lead_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        lead = Lead(
            id=lead_id,
            name=name,
            company=company,
            email=email,
            title=title
        )

        self.leads[lead_id] = lead
        return lead

    def score_bant(
        self,
        lead_id: str,
        budget: int,
        authority: int,
        need: int,
        timeline: int
    ) -> Lead:
        """Score lead using BANT"""
        if lead_id not in self.leads:
            raise ValueError(f"Lead not found: {lead_id}")

        lead = self.leads[lead_id]
        lead.bant = BANTScore(
            budget=min(25, max(0, budget)),
            authority=min(25, max(0, authority)),
            need=min(25, max(0, need)),
            timeline=min(25, max(0, timeline))
        )

        # Auto-qualify based on score
        if lead.bant.total >= self.QUALIFIED_THRESHOLD:
            lead.status = QualificationStatus.QUALIFIED
        else:
            lead.status = QualificationStatus.DISQUALIFIED

        return lead

    def handoff(self, lead_id: str, ae_name: str) -> Lead:
        """Handoff qualified lead to AE"""
        if lead_id not in self.leads:
            raise ValueError(f"Lead not found: {lead_id}")

        lead = self.leads[lead_id]
        if lead.status != QualificationStatus.QUALIFIED:
            raise ValueError("Only qualified leads can be handed off")

        lead.status = QualificationStatus.HANDED_OFF
        lead.assigned_ae = ae_name

        return lead

    def get_queue(self) -> List[Lead]:
        """Get pending leads"""
        return [l for l in self.leads.values() if l.status == QualificationStatus.PENDING]

    def get_qualified(self) -> List[Lead]:
        """Get qualified leads awaiting handoff"""
        return [l for l in self.leads.values() if l.status == QualificationStatus.QUALIFIED]

    def get_stats(self) -> Dict:
        """Get qualification stats"""
        leads = list(self.leads.values())
        qualified = len([l for l in leads if l.status in [QualificationStatus.QUALIFIED, QualificationStatus.HANDED_OFF]])

        return {
            "total_leads": len(leads),
            "pending": len(self.get_queue()),
            "qualified": qualified,
            "disqualified": len([l for l in leads if l.status == QualificationStatus.DISQUALIFIED]),
            "handed_off": len([l for l in leads if l.status == QualificationStatus.HANDED_OFF]),
            "qualification_rate": f"{qualified/len(leads)*100:.0f}%" if leads else "0%"
        }


# Demo
if __name__ == "__main__":
    agent = LeadQualifierAgent()

    print("🎯 Lead Qualifier Agent Demo\n")

    # Add leads
    l1 = agent.add_lead("Nguyễn A", "TechCorp VN", "a@techcorp.vn", "CTO")
    l2 = agent.add_lead("Trần B", "StartupX", "b@startupx.com", "Developer")

    print(f"📋 Lead: {l1.name} ({l1.title})")

    # Score BANT
    agent.score_bant(l1.id, budget=22, authority=20, need=25, timeline=18)
    agent.score_bant(l2.id, budget=10, authority=5, need=20, timeline=10)

    print(f"\n📊 BANT Score: {l1.bant.total}/100 (Grade {l1.bant.grade})")
    print(f"   Budget: {l1.bant.budget}")
    print(f"   Authority: {l1.bant.authority}")
    print(f"   Need: {l1.bant.need}")
    print(f"   Timeline: {l1.bant.timeline}")

    # Handoff
    agent.handoff(l1.id, "AE_001")
    print(f"\n✅ Handed off to: {l1.assigned_ae}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Qualification Rate: {stats['qualification_rate']}")
