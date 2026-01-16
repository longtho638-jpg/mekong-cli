"""
Prospecting Agent - Lead Discovery & Cadences
Manages prospecting activities and email sequences.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class ProspectStatus(Enum):
    NEW = "new"
    CONTACTED = "contacted"
    ENGAGED = "engaged"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"


@dataclass
class Prospect:
    """Sales prospect"""
    id: str
    name: str
    company: str
    email: str
    phone: str = ""
    status: ProspectStatus = ProspectStatus.NEW
    source: str = "inbound"
    cadence_step: int = 0
    last_contacted: Optional[datetime] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


@dataclass
class Cadence:
    """Outreach cadence"""
    id: str
    name: str
    steps: List[Dict]  # {day, type, template}
    active: bool = True


class ProspectingAgent:
    """
    Prospecting Agent - Tìm kiếm Khách hàng
    
    Responsibilities:
    - Discover and enrich leads
    - Manage email sequences
    - Call scripts
    - Cadence automation
    """

    # Default cadence
    DEFAULT_CADENCE = [
        {"day": 1, "type": "email", "template": "intro"},
        {"day": 3, "type": "call", "template": "discovery"},
        {"day": 5, "type": "email", "template": "follow_up"},
        {"day": 7, "type": "linkedin", "template": "connect"},
        {"day": 10, "type": "call", "template": "final_attempt"},
    ]

    # Email templates
    EMAIL_TEMPLATES = {
        "intro": """Chào {name},

Tôi là {rep_name} từ Mekong-CLI. Nhận thấy {company} đang mở rộng hoạt động, 
tôi muốn giới thiệu giải pháp giúp tiết kiệm 67% chi phí AI.

Bạn có 15 phút để trao đổi tuần này không?

Best,
{rep_name}""",
        "follow_up": """Chào {name},

Tôi muốn follow up email trước. Bạn đã có cơ hội xem qua chưa?

Demo nhanh 15 phút sẽ giúp bạn thấy được tiềm năng tiết kiệm.

{rep_name}"""
    }

    def __init__(self):
        self.name = "Prospecting"
        self.status = "ready"
        self.prospects: Dict[str, Prospect] = {}
        self.cadences: Dict[str, Cadence] = {}

    def add_prospect(
        self,
        name: str,
        company: str,
        email: str,
        phone: str = "",
        source: str = "inbound"
    ) -> Prospect:
        """Add new prospect"""
        prospect_id = f"prospect_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        prospect = Prospect(
            id=prospect_id,
            name=name,
            company=company,
            email=email,
            phone=phone,
            source=source
        )

        self.prospects[prospect_id] = prospect
        return prospect

    def advance_cadence(self, prospect_id: str) -> Prospect:
        """Move prospect to next cadence step"""
        if prospect_id not in self.prospects:
            raise ValueError(f"Prospect not found: {prospect_id}")

        prospect = self.prospects[prospect_id]
        prospect.cadence_step += 1
        prospect.last_contacted = datetime.now()

        if prospect.status == ProspectStatus.NEW:
            prospect.status = ProspectStatus.CONTACTED

        return prospect

    def get_email_content(self, prospect_id: str, template: str, rep_name: str) -> str:
        """Generate email from template"""
        if prospect_id not in self.prospects:
            raise ValueError(f"Prospect not found: {prospect_id}")

        prospect = self.prospects[prospect_id]
        template_content = self.EMAIL_TEMPLATES.get(template, "")

        return template_content.format(
            name=prospect.name,
            company=prospect.company,
            rep_name=rep_name
        )

    def get_due_today(self) -> List[Prospect]:
        """Get prospects due for contact today"""
        # Simplified: return prospects in cadence
        return [
            p for p in self.prospects.values()
            if p.cadence_step < len(self.DEFAULT_CADENCE) and p.status != ProspectStatus.QUALIFIED
        ]

    def qualify(self, prospect_id: str, qualified: bool) -> Prospect:
        """Mark prospect as qualified/unqualified"""
        if prospect_id not in self.prospects:
            raise ValueError(f"Prospect not found: {prospect_id}")

        prospect = self.prospects[prospect_id]
        prospect.status = ProspectStatus.QUALIFIED if qualified else ProspectStatus.UNQUALIFIED

        return prospect

    def get_stats(self) -> Dict:
        """Get prospecting stats"""
        prospects = list(self.prospects.values())

        return {
            "total": len(prospects),
            "new": len([p for p in prospects if p.status == ProspectStatus.NEW]),
            "contacted": len([p for p in prospects if p.status == ProspectStatus.CONTACTED]),
            "qualified": len([p for p in prospects if p.status == ProspectStatus.QUALIFIED]),
            "conversion_rate": f"{len([p for p in prospects if p.status == ProspectStatus.QUALIFIED])/len(prospects)*100:.0f}%" if prospects else "0%"
        }


# Demo
if __name__ == "__main__":
    agent = ProspectingAgent()

    print("🎯 Prospecting Agent Demo\n")

    # Add prospects
    p1 = agent.add_prospect("Nguyễn A", "TechCorp VN", "a@techcorp.vn", source="linkedin")
    p2 = agent.add_prospect("Trần B", "StartupX", "b@startupx.com", source="website")

    print(f"📋 Added: {p1.name} ({p1.company})")
    print(f"📋 Added: {p2.name} ({p2.company})")

    # Advance cadence
    agent.advance_cadence(p1.id)
    print(f"\n📧 Step {p1.cadence_step}: {agent.DEFAULT_CADENCE[0]}")

    # Get email
    email = agent.get_email_content(p1.id, "intro", "Sales Rep")
    print(f"\n📝 Email Preview:\n{email[:100]}...")

    # Qualify
    agent.qualify(p1.id, True)

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total']}")
    print(f"   Qualified: {stats['qualified']}")
