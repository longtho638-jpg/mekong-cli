"""
Partnership Agent - Partner Relationship Management
Manages partnerships, co-marketing, and revenue sharing.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class PartnerType(Enum):
    REFERRAL = "referral"
    RESELLER = "reseller"
    TECHNOLOGY = "technology"
    STRATEGIC = "strategic"


class PartnerStatus(Enum):
    PROSPECT = "prospect"
    ONBOARDING = "onboarding"
    ACTIVE = "active"
    INACTIVE = "inactive"


@dataclass
class Partner:
    """Business partner"""
    id: str
    name: str
    company: str
    partner_type: PartnerType
    status: PartnerStatus = PartnerStatus.PROSPECT
    contact_email: str = ""
    revenue_share: float = 0.0  # Percentage
    total_referrals: int = 0
    total_revenue: float = 0.0
    joined_at: Optional[datetime] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class PartnershipAgent:
    """
    Partnership Agent - Quản lý Đối tác
    
    Responsibilities:
    - Partner onboarding
    - Relationship tracking
    - Co-marketing activities
    - Revenue sharing
    """

    # Default revenue shares by partner type
    REVENUE_SHARES = {
        PartnerType.REFERRAL: 15.0,
        PartnerType.RESELLER: 25.0,
        PartnerType.TECHNOLOGY: 10.0,
        PartnerType.STRATEGIC: 20.0
    }

    def __init__(self):
        self.name = "Partnership"
        self.status = "ready"
        self.partners: Dict[str, Partner] = {}

    def add_partner(
        self,
        name: str,
        company: str,
        partner_type: PartnerType,
        contact_email: str = ""
    ) -> Partner:
        """Add new partner"""
        partner_id = f"partner_{int(datetime.now().timestamp())}_{random.randint(100,999)}"

        partner = Partner(
            id=partner_id,
            name=name,
            company=company,
            partner_type=partner_type,
            contact_email=contact_email,
            revenue_share=self.REVENUE_SHARES.get(partner_type, 10.0)
        )

        self.partners[partner_id] = partner
        return partner

    def activate(self, partner_id: str) -> Partner:
        """Activate partner"""
        if partner_id not in self.partners:
            raise ValueError(f"Partner not found: {partner_id}")

        partner = self.partners[partner_id]
        partner.status = PartnerStatus.ACTIVE
        partner.joined_at = datetime.now()

        return partner

    def record_referral(self, partner_id: str, revenue: float) -> Partner:
        """Record a referral from partner"""
        if partner_id not in self.partners:
            raise ValueError(f"Partner not found: {partner_id}")

        partner = self.partners[partner_id]
        partner.total_referrals += 1
        partner.total_revenue += revenue

        return partner

    def calculate_payout(self, partner_id: str) -> float:
        """Calculate partner payout"""
        if partner_id not in self.partners:
            raise ValueError(f"Partner not found: {partner_id}")

        partner = self.partners[partner_id]
        return partner.total_revenue * (partner.revenue_share / 100)

    def get_active(self) -> List[Partner]:
        """Get active partners"""
        return [p for p in self.partners.values() if p.status == PartnerStatus.ACTIVE]

    def get_stats(self) -> Dict:
        """Get partnership statistics"""
        partners = list(self.partners.values())
        active = self.get_active()

        return {
            "total_partners": len(partners),
            "active": len(active),
            "total_referrals": sum(p.total_referrals for p in partners),
            "total_revenue": sum(p.total_revenue for p in partners),
            "total_payouts": sum(self.calculate_payout(p.id) for p in partners)
        }


# Demo
if __name__ == "__main__":
    agent = PartnershipAgent()

    print("🤝 Partnership Agent Demo\n")

    # Add partners
    p1 = agent.add_partner("GDG Vietnam", "Google Developer Groups", PartnerType.STRATEGIC, "gdg@google.com")
    p2 = agent.add_partner("TechAgency", "Tech Consulting", PartnerType.RESELLER, "partner@tech.vn")

    print(f"📋 Partner: {p1.company}")
    print(f"   Type: {p1.partner_type.value}")
    print(f"   Revenue Share: {p1.revenue_share}%")

    # Activate
    agent.activate(p1.id)
    agent.activate(p2.id)

    # Record referrals
    agent.record_referral(p1.id, 5000)
    agent.record_referral(p1.id, 8000)
    agent.record_referral(p2.id, 3000)

    print("\n💰 Payouts:")
    print(f"   {p1.company}: ${agent.calculate_payout(p1.id):,.0f}")
    print(f"   {p2.company}: ${agent.calculate_payout(p2.id):,.0f}")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Active: {stats['active']}")
    print(f"   Total Revenue: ${stats['total_revenue']:,.0f}")
