"""
📝 Proposal Generator - Auto-Generate Client Proposals
========================================================

Generate professional client proposals from Agency DNA.
Perfect for pitching new clients!

Features:
- Auto-fill agency info from DNA
- Custom pricing based on niche
- Professional formatting
- Multiple export formats
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ProposalStatus(Enum):
    """Proposal status."""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ServiceTier(Enum):
    """Service tiers."""
    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"


@dataclass
class Service:
    """A service package."""
    name: str
    description: str
    deliverables: List[str]
    monthly_price: float
    setup_fee: float = 0


@dataclass
class Proposal:
    """A client proposal."""
    id: str
    client_name: str
    client_company: str
    client_email: str
    agency_name: str
    niche: str
    services: List[Service]
    status: ProposalStatus
    created_at: datetime
    valid_until: datetime
    notes: str = ""
    
    @property
    def total_monthly(self) -> float:
        return sum(s.monthly_price for s in self.services)
    
    @property
    def total_setup(self) -> float:
        return sum(s.setup_fee for s in self.services)


class ProposalGenerator:
    """
    Proposal Generator.
    
    Create professional client proposals from Agency DNA.
    """
    
    def __init__(self, agency_name: str, niche: str, location: str, skill: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.skill = skill
        
        # Service packages
        self.packages = self._create_packages()
    
    def _create_packages(self) -> Dict[ServiceTier, Service]:
        """Create service packages based on niche."""
        return {
            ServiceTier.STARTER: Service(
                name=f"{self.niche} Starter",
                description=f"Perfect for businesses new to {self.niche.lower()}",
                deliverables=[
                    "Initial strategy consultation",
                    f"{self.niche} audit & analysis",
                    "Monthly performance report",
                    "Email support",
                    "1 revision round per month"
                ],
                monthly_price=500,
                setup_fee=0
            ),
            ServiceTier.GROWTH: Service(
                name=f"{self.niche} Growth",
                description=f"Accelerate your {self.niche.lower()} results",
                deliverables=[
                    "Everything in Starter, plus:",
                    f"Advanced {self.skill} campaigns",
                    "Bi-weekly strategy calls",
                    "A/B testing & optimization",
                    "Priority support",
                    "3 revision rounds per month"
                ],
                monthly_price=1500,
                setup_fee=500
            ),
            ServiceTier.SCALE: Service(
                name=f"{self.niche} Scale",
                description=f"Full-service {self.niche.lower()} partnership",
                deliverables=[
                    "Everything in Growth, plus:",
                    "Dedicated account manager",
                    "Weekly strategy calls",
                    "Custom dashboard access",
                    "Unlimited revisions",
                    "24/7 priority support",
                    "Quarterly business review"
                ],
                monthly_price=3500,
                setup_fee=1000
            )
        }
    
    def create_proposal(
        self,
        client_name: str,
        client_company: str,
        client_email: str,
        tiers: List[ServiceTier],
        valid_days: int = 14,
        notes: str = ""
    ) -> Proposal:
        """Create a new proposal."""
        services = [self.packages[tier] for tier in tiers]
        
        return Proposal(
            id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            client_company=client_company,
            client_email=client_email,
            agency_name=self.agency_name,
            niche=self.niche,
            services=services,
            status=ProposalStatus.DRAFT,
            created_at=datetime.now(),
            valid_until=datetime.now() + timedelta(days=valid_days),
            notes=notes
        )
    
    def format_proposal(self, proposal: Proposal) -> str:
        """Format proposal as ASCII document."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📝 PROPOSAL: {proposal.client_company.upper()[:35]:<35}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  From: {self.agency_name:<45}      ║",
            f"║  To: {proposal.client_name:<47}      ║",
            f"║  Date: {proposal.created_at.strftime('%Y-%m-%d'):<45}      ║",
            f"║  Valid Until: {proposal.valid_until.strftime('%Y-%m-%d'):<38}      ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ABOUT US                                                 ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║  {self.agency_name} specializes in {self.niche.lower():<20}    ║",
            f"║  with deep expertise in {self.skill.lower():<28}    ║",
            f"║  Based in {self.location:<42}    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  PROPOSED SERVICES                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for service in proposal.services:
            lines.append(f"║                                                           ║")
            lines.append(f"║  📦 {service.name:<50}  ║")
            lines.append(f"║     {service.description[:50]:<50}  ║")
            lines.append(f"║                                                           ║")
            lines.append(f"║     Deliverables:                                         ║")
            
            for d in service.deliverables[:4]:
                lines.append(f"║       ✓ {d[:45]:<45}  ║")
            
            if len(service.deliverables) > 4:
                lines.append(f"║       + {len(service.deliverables) - 4} more...                                     ║")
            
            lines.append(f"║                                                           ║")
            lines.append(f"║     Monthly: ${service.monthly_price:,.0f}                                        ║")
            if service.setup_fee > 0:
                lines.append(f"║     Setup: ${service.setup_fee:,.0f} (one-time)                              ║")
        
        lines.extend([
            "╠═══════════════════════════════════════════════════════════╣",
            "║  INVESTMENT SUMMARY                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║     Monthly Investment: ${proposal.total_monthly:,.0f}                             ║",
            f"║     One-time Setup: ${proposal.total_setup:,.0f}                                ║",
            f"║     First Month Total: ${proposal.total_monthly + proposal.total_setup:,.0f}                          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  NEXT STEPS                                               ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    1. Review this proposal                                ║",
            "║    2. Schedule a call to discuss                          ║",
            "║    3. Sign agreement to get started                       ║",
            "║    4. Kick-off meeting within 48 hours                    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - \"Không đánh mà thắng\"             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def export_markdown(self, proposal: Proposal) -> str:
        """Export proposal as markdown."""
        lines = [
            f"# 📝 Proposal for {proposal.client_company}",
            "",
            f"> From: **{self.agency_name}** | {proposal.created_at.strftime('%B %d, %Y')}",
            "",
            "---",
            "",
            "## About Us",
            "",
            f"{self.agency_name} is a specialized {self.niche.lower()} agency based in {self.location}.",
            f"We excel in {self.skill.lower()} and help businesses achieve measurable growth.",
            "",
            "---",
            "",
            "## Proposed Services",
            "",
        ]
        
        for service in proposal.services:
            lines.extend([
                f"### {service.name}",
                "",
                f"*{service.description}*",
                "",
                "**Deliverables:**",
            ])
            
            for d in service.deliverables:
                lines.append(f"- ✓ {d}")
            
            lines.extend([
                "",
                f"**Monthly Price:** ${service.monthly_price:,.0f}",
            ])
            
            if service.setup_fee > 0:
                lines.append(f"**Setup Fee:** ${service.setup_fee:,.0f}")
            
            lines.extend(["", "---", ""])
        
        lines.extend([
            "## Investment Summary",
            "",
            f"| Item | Amount |",
            f"|------|--------|",
            f"| Monthly Investment | ${proposal.total_monthly:,.0f} |",
            f"| One-time Setup | ${proposal.total_setup:,.0f} |",
            f"| **First Month Total** | **${proposal.total_monthly + proposal.total_setup:,.0f}** |",
            "",
            "---",
            "",
            f"*Valid until: {proposal.valid_until.strftime('%B %d, %Y')}*",
            "",
            f"🏯 **{self.agency_name}** — \"Không đánh mà thắng\"",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    generator = ProposalGenerator(
        agency_name="Saigon Digital Hub",
        niche="Real Estate Marketing",
        location="Ho Chi Minh City",
        skill="Facebook Ads"
    )
    
    print("📝 Proposal Generator")
    print("=" * 60)
    print()
    
    # Create proposal
    proposal = generator.create_proposal(
        client_name="Mr. Hoang",
        client_company="Sunrise Realty",
        client_email="hoang@sunriserealty.vn",
        tiers=[ServiceTier.GROWTH]
    )
    
    print(generator.format_proposal(proposal))
    print()
    print(f"✅ Proposal created: {proposal.id}")
    print(f"   Client: {proposal.client_company}")
    print(f"   Monthly: ${proposal.total_monthly:,.0f}")
    print(f"   Valid Until: {proposal.valid_until.strftime('%Y-%m-%d')}")
