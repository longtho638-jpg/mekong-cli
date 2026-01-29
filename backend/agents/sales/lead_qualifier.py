"""
Lead Qualifier Agent - Lead Scoring & Qualification
Auto-scores and qualifies incoming leads.
"""

import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class LeadSource(Enum):
    INBOUND = "inbound"  # GitHub, Blog
    AFFILIATE = "affiliate"  # Partner referrals
    ZALO = "zalo"  # Zalo OA
    FACEBOOK = "facebook"
    DIRECT = "direct"


class LeadStatus(Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    NURTURING = "nurturing"


@dataclass
class Lead:
    """Sales lead"""

    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: LeadSource = LeadSource.INBOUND
    score: int = 0  # 0-100
    status: LeadStatus = LeadStatus.NEW
    company: Optional[str] = None
    interest: Optional[str] = None
    notes: List[str] = field(default_factory=list)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class LeadQualifierAgent:
    """
    Lead Qualifier Agent - Đánh giá & Lọc Lead

    Responsibilities:
    - Score leads (0-100)
    - Auto-qualify based on criteria
    - Filter spam/junk leads
    - Route to appropriate sales stage
    """

    # Scoring weights
    SCORING_RULES = {
        "has_email": 15,
        "has_phone": 15,
        "has_company": 20,
        "source_inbound": 10,
        "source_affiliate": 25,
        "interest_high": 15,
    }

    QUALIFY_THRESHOLD = 50

    def __init__(self):
        self.name = "Lead Qualifier"
        self.status = "ready"
        self.leads_db: Dict[str, Lead] = {}

    def create_lead(
        self,
        name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        source: LeadSource = LeadSource.INBOUND,
        company: Optional[str] = None,
        interest: Optional[str] = None,
    ) -> Lead:
        """Create a new lead"""
        lead_id = f"lead_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        lead = Lead(
            id=lead_id,
            name=name,
            email=email,
            phone=phone,
            source=source,
            company=company,
            interest=interest,
        )

        self.leads_db[lead_id] = lead
        return lead

    def score_lead(self, lead: Lead) -> int:
        """Calculate lead score based on criteria"""
        score = 0

        if lead.email:
            score += self.SCORING_RULES["has_email"]
        if lead.phone:
            score += self.SCORING_RULES["has_phone"]
        if lead.company:
            score += self.SCORING_RULES["has_company"]
        if lead.source == LeadSource.AFFILIATE:
            score += self.SCORING_RULES["source_affiliate"]
        elif lead.source == LeadSource.INBOUND:
            score += self.SCORING_RULES["source_inbound"]
        if lead.interest and "mekong" in lead.interest.lower():
            score += self.SCORING_RULES["interest_high"]

        return min(score, 100)

    def qualify(self, lead_id: str) -> Lead:
        """Auto-qualify a lead based on score"""
        if lead_id not in self.leads_db:
            raise ValueError(f"Lead not found: {lead_id}")

        lead = self.leads_db[lead_id]
        lead.score = self.score_lead(lead)

        if lead.score >= self.QUALIFY_THRESHOLD:
            lead.status = LeadStatus.QUALIFIED
            lead.notes.append(f"Auto-qualified with score {lead.score}")
        else:
            lead.status = LeadStatus.NURTURING
            lead.notes.append(f"Needs nurturing, score {lead.score}")

        return lead

    def get_qualified_leads(self) -> List[Lead]:
        """Get all qualified leads"""
        return [lead for lead in self.leads_db.values() if lead.status == LeadStatus.QUALIFIED]

    def get_stats(self) -> Dict:
        """Get lead statistics"""
        leads = list(self.leads_db.values())
        return {
            "total": len(leads),
            "qualified": len([lead for lead in leads if lead.status == LeadStatus.QUALIFIED]),
            "nurturing": len([lead for lead in leads if lead.status == LeadStatus.NURTURING]),
            "avg_score": sum(lead.score for lead in leads) / len(leads) if leads else 0,
            "by_source": {
                s.value: len([lead for lead in leads if lead.source == s]) for s in LeadSource
            },
        }


# Demo
if __name__ == "__main__":
    agent = LeadQualifierAgent()

    print("💼 Lead Qualifier Agent Demo\n")

    # Create leads
    lead1 = agent.create_lead(
        name="Nguyễn Văn A",
        email="a@company.vn",
        phone="0901234567",
        source=LeadSource.AFFILIATE,
        company="TechVN Co.",
        interest="Mekong-CLI for agency",
    )

    lead2 = agent.create_lead(name="Trần B", email="b@gmail.com", source=LeadSource.FACEBOOK)

    # Qualify leads
    agent.qualify(lead1.id)
    agent.qualify(lead2.id)

    print(f"📊 Lead 1: {lead1.name}")
    print(f"   Score: {lead1.score} → {lead1.status.value}")

    print(f"\n📊 Lead 2: {lead2.name}")
    print(f"   Score: {lead2.score} → {lead2.status.value}")

    # Stats
    print("\n📈 Statistics:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total']}")
    print(f"   Qualified: {stats['qualified']}")
    print(f"   Avg Score: {stats['avg_score']:.1f}")
