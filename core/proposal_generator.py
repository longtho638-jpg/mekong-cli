"""
📋 Auto-Proposal Generator
==========================

Generate professional proposals in 30 seconds flat.
Complete with pricing, timeline, and deliverables.

Features:
- Smart pricing based on scope
- Custom timeline generation
- Deliverables breakdown
- PDF export (future)
- Voice narration (via voice_clone.py)
"""

import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid


class ServiceType(Enum):
    """Types of services offered."""
    SEO = "seo"
    CONTENT = "content"
    PPC = "ppc"
    SOCIAL = "social_media"
    WEB_DEV = "web_development"
    BRANDING = "branding"
    EMAIL = "email_marketing"
    CONSULTING = "consulting"


class ProjectSize(Enum):
    """Project size tiers."""
    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"
    ENTERPRISE = "enterprise"


class ProposalStatus(Enum):
    """Proposal lifecycle status."""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


@dataclass
class ServicePackage:
    """A service package with pricing."""
    service_type: ServiceType
    name: str
    description: str
    deliverables: List[str]
    base_price: float
    hours_estimate: int
    timeline_weeks: int


@dataclass
class ProposalItem:
    """An item in a proposal."""
    name: str
    description: str
    price: float
    quantity: int = 1
    
    @property
    def total(self) -> float:
        return self.price * self.quantity


@dataclass
class Proposal:
    """A complete proposal."""
    id: str
    client_name: str
    client_email: str
    project_name: str
    project_description: str
    items: List[ProposalItem]
    status: ProposalStatus
    created_at: datetime
    valid_until: datetime
    notes: str = ""
    discount_percent: float = 0
    
    # Agency info
    agency_name: str = "Nova Digital"
    agency_owner: str = "Alex"
    
    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)
    
    @property
    def discount_amount(self) -> float:
        return self.subtotal * (self.discount_percent / 100)
    
    @property
    def total(self) -> float:
        return self.subtotal - self.discount_amount


class ProposalGenerator:
    """
    Smart Proposal Generator.
    
    Creates professional proposals with:
    - Intelligent pricing
    - Custom packages
    - Timeline estimation
    - Deliverables breakdown
    """
    
    def __init__(
        self,
        agency_name: str = "Nova Digital",
        owner_name: str = "Alex"
    ):
        self.agency_name = agency_name
        self.owner_name = owner_name
        
        # Store proposals
        self.proposals: Dict[str, Proposal] = {}
        
        # Service catalog
        self.services = self._load_service_catalog()
        
        # Stats
        self.stats = {
            "proposals_created": 0,
            "proposals_sent": 0,
            "proposals_accepted": 0,
            "total_value": 0.0,
            "accepted_value": 0.0
        }
    
    def _load_service_catalog(self) -> Dict[ServiceType, ServicePackage]:
        """Load service packages."""
        return {
            ServiceType.SEO: ServicePackage(
                service_type=ServiceType.SEO,
                name="SEO Growth Package",
                description="Complete SEO optimization to rank higher on Google",
                deliverables=[
                    "Technical SEO audit",
                    "Keyword research (50 keywords)",
                    "On-page optimization (10 pages)",
                    "Link building (5 backlinks/month)",
                    "Monthly ranking reports"
                ],
                base_price=1500,
                hours_estimate=20,
                timeline_weeks=12
            ),
            ServiceType.CONTENT: ServicePackage(
                service_type=ServiceType.CONTENT,
                name="Content Marketing",
                description="High-quality content that converts",
                deliverables=[
                    "Content strategy development",
                    "4 blog posts per month (1500+ words)",
                    "Social media content calendar",
                    "1 lead magnet (ebook/guide)",
                    "Email newsletter setup"
                ],
                base_price=2000,
                hours_estimate=30,
                timeline_weeks=4
            ),
            ServiceType.PPC: ServicePackage(
                service_type=ServiceType.PPC,
                name="PPC Advertising",
                description="Paid ads that deliver ROI",
                deliverables=[
                    "Campaign strategy & setup",
                    "Google Ads management",
                    "Facebook/Instagram ads",
                    "Landing page optimization",
                    "Weekly performance reports"
                ],
                base_price=1000,
                hours_estimate=15,
                timeline_weeks=4
            ),
            ServiceType.SOCIAL: ServicePackage(
                service_type=ServiceType.SOCIAL,
                name="Social Media Management",
                description="Build your audience on social media",
                deliverables=[
                    "Social strategy development",
                    "20 posts per month",
                    "Community management",
                    "Influencer outreach",
                    "Monthly analytics report"
                ],
                base_price=1200,
                hours_estimate=25,
                timeline_weeks=4
            ),
            ServiceType.WEB_DEV: ServicePackage(
                service_type=ServiceType.WEB_DEV,
                name="Website Development",
                description="Beautiful, high-converting websites",
                deliverables=[
                    "Custom design (5 pages)",
                    "Mobile responsive",
                    "SEO-friendly structure",
                    "Contact forms & CTA",
                    "1 month support"
                ],
                base_price=3500,
                hours_estimate=40,
                timeline_weeks=4
            ),
            ServiceType.BRANDING: ServicePackage(
                service_type=ServiceType.BRANDING,
                name="Brand Identity",
                description="Stand out with a unique brand",
                deliverables=[
                    "Logo design (3 concepts)",
                    "Brand guidelines",
                    "Color palette & typography",
                    "Business card design",
                    "Social media templates"
                ],
                base_price=2500,
                hours_estimate=30,
                timeline_weeks=3
            ),
            ServiceType.EMAIL: ServicePackage(
                service_type=ServiceType.EMAIL,
                name="Email Marketing",
                description="Nurture leads into customers",
                deliverables=[
                    "Email strategy development",
                    "Welcome sequence (5 emails)",
                    "Newsletter template",
                    "List segmentation",
                    "A/B testing setup"
                ],
                base_price=800,
                hours_estimate=12,
                timeline_weeks=2
            ),
            ServiceType.CONSULTING: ServicePackage(
                service_type=ServiceType.CONSULTING,
                name="Strategy Consulting",
                description="Expert guidance for your business",
                deliverables=[
                    "Business audit",
                    "2-hour strategy session",
                    "Action plan document",
                    "30-day follow-up call",
                    "Email support"
                ],
                base_price=500,
                hours_estimate=5,
                timeline_weeks=1
            )
        }
    
    def calculate_price(
        self,
        services: List[ServiceType],
        size: ProjectSize = ProjectSize.GROWTH,
        rush: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate pricing for selected services.
        
        Args:
            services: List of services to include
            size: Project size tier (affects scope)
            rush: Rush delivery (adds 25%)
        
        Returns:
            Pricing breakdown
        """
        # Size multipliers
        size_multiplier = {
            ProjectSize.STARTER: 0.7,
            ProjectSize.GROWTH: 1.0,
            ProjectSize.SCALE: 1.5,
            ProjectSize.ENTERPRISE: 2.5
        }
        
        multiplier = size_multiplier[size]
        
        items = []
        total_hours = 0
        max_timeline = 0
        
        for service_type in services:
            if service_type in self.services:
                pkg = self.services[service_type]
                adjusted_price = pkg.base_price * multiplier
                
                items.append({
                    "service": pkg.name,
                    "description": pkg.description,
                    "price": adjusted_price,
                    "hours": pkg.hours_estimate,
                    "timeline_weeks": pkg.timeline_weeks,
                    "deliverables": pkg.deliverables
                })
                
                total_hours += pkg.hours_estimate
                max_timeline = max(max_timeline, pkg.timeline_weeks)
        
        subtotal = sum(item["price"] for item in items)
        
        # Rush fee
        rush_fee = subtotal * 0.25 if rush else 0
        
        return {
            "items": items,
            "subtotal": subtotal,
            "rush_fee": rush_fee,
            "total": subtotal + rush_fee,
            "total_hours": total_hours,
            "timeline_weeks": max_timeline,
            "size": size.value,
            "rush": rush
        }
    
    def create_proposal(
        self,
        client_name: str,
        client_email: str,
        project_name: str,
        project_description: str,
        services: List[ServiceType],
        size: ProjectSize = ProjectSize.GROWTH,
        discount_percent: float = 0,
        valid_days: int = 14,
        notes: str = ""
    ) -> Proposal:
        """
        Create a complete proposal.
        
        Args:
            client_name: Client's name
            client_email: Client's email
            project_name: Name of the project
            project_description: Description of the project
            services: List of services to include
            size: Project size tier
            discount_percent: Discount to apply
            valid_days: Days until proposal expires
            notes: Additional notes
        
        Returns:
            Complete Proposal object
        """
        pricing = self.calculate_price(services, size)
        
        items = [
            ProposalItem(
                name=item["service"],
                description=item["description"],
                price=item["price"]
            )
            for item in pricing["items"]
        ]
        
        proposal = Proposal(
            id=f"PROP-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            client_name=client_name,
            client_email=client_email,
            project_name=project_name,
            project_description=project_description,
            items=items,
            status=ProposalStatus.DRAFT,
            created_at=datetime.now(),
            valid_until=datetime.now() + timedelta(days=valid_days),
            notes=notes,
            discount_percent=discount_percent,
            agency_name=self.agency_name,
            agency_owner=self.owner_name
        )
        
        self.proposals[proposal.id] = proposal
        self.stats["proposals_created"] += 1
        self.stats["total_value"] += proposal.total
        
        return proposal
    
    def format_proposal_text(self, proposal: Proposal) -> str:
        """Format proposal as plain text."""
        lines = [
            f"# PROPOSAL: {proposal.project_name}",
            f"## Prepared for: {proposal.client_name}",
            f"",
            f"**From:** {proposal.agency_name}",
            f"**Date:** {proposal.created_at.strftime('%B %d, %Y')}",
            f"**Valid Until:** {proposal.valid_until.strftime('%B %d, %Y')}",
            f"**Proposal ID:** {proposal.id}",
            f"",
            f"---",
            f"",
            f"## Project Overview",
            f"",
            f"{proposal.project_description}",
            f"",
            f"---",
            f"",
            f"## Services & Investment",
            f""
        ]
        
        for item in proposal.items:
            lines.append(f"### {item.name}")
            lines.append(f"{item.description}")
            lines.append(f"**Investment:** ${item.price:,.2f}")
            lines.append("")
        
        lines.extend([
            f"---",
            f"",
            f"## Pricing Summary",
            f"",
            f"| Item | Amount |",
            f"|------|--------|",
            f"| Subtotal | ${proposal.subtotal:,.2f} |"
        ])
        
        if proposal.discount_percent > 0:
            lines.append(f"| Discount ({proposal.discount_percent}%) | -${proposal.discount_amount:,.2f} |")
        
        lines.extend([
            f"| **Total** | **${proposal.total:,.2f}** |",
            f"",
            f"---",
            f"",
            f"## Next Steps",
            f"",
            f"1. Review this proposal",
            f"2. Reply with any questions",
            f"3. Sign and return to get started!",
            f"",
            f"Looking forward to working with you!",
            f"",
            f"**{proposal.agency_owner}**",
            f"*{proposal.agency_name}*"
        ])
        
        if proposal.notes:
            lines.extend([
                f"",
                f"---",
                f"",
                f"## Notes",
                f"",
                proposal.notes
            ])
        
        return "\n".join(lines)
    
    def send_proposal(self, proposal_id: str) -> bool:
        """Mark proposal as sent."""
        if proposal_id in self.proposals:
            self.proposals[proposal_id].status = ProposalStatus.SENT
            self.stats["proposals_sent"] += 1
            return True
        return False
    
    def accept_proposal(self, proposal_id: str) -> bool:
        """Mark proposal as accepted."""
        if proposal_id in self.proposals:
            proposal = self.proposals[proposal_id]
            proposal.status = ProposalStatus.ACCEPTED
            self.stats["proposals_accepted"] += 1
            self.stats["accepted_value"] += proposal.total
            return True
        return False
    
    def get_proposal(self, proposal_id: str) -> Optional[Proposal]:
        """Get a proposal by ID."""
        return self.proposals.get(proposal_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get proposal statistics."""
        acceptance_rate = (
            self.stats["proposals_accepted"] / 
            max(1, self.stats["proposals_sent"])
        ) * 100
        
        return {
            **self.stats,
            "acceptance_rate": acceptance_rate,
            "avg_proposal_value": (
                self.stats["total_value"] / 
                max(1, self.stats["proposals_created"])
            )
        }


# Example usage
if __name__ == "__main__":
    # Initialize generator
    gen = ProposalGenerator(
        agency_name="Nova Digital",
        owner_name="Alex"
    )
    
    print("📋 Proposal Generator Initialized!")
    print(f"   Agency: {gen.agency_name}")
    print(f"   Services: {len(gen.services)}")
    print()
    
    # Calculate pricing
    pricing = gen.calculate_price(
        services=[ServiceType.SEO, ServiceType.CONTENT, ServiceType.PPC],
        size=ProjectSize.GROWTH
    )
    
    print("💰 Pricing Calculated:")
    print(f"   Services: {len(pricing['items'])}")
    print(f"   Hours: {pricing['total_hours']}")
    print(f"   Timeline: {pricing['timeline_weeks']} weeks")
    print(f"   Total: ${pricing['total']:,.2f}")
    print()
    
    # Create proposal
    proposal = gen.create_proposal(
        client_name="John Smith",
        client_email="john@example.com",
        project_name="Complete Digital Marketing",
        project_description="Comprehensive marketing to grow your online presence",
        services=[ServiceType.SEO, ServiceType.CONTENT, ServiceType.PPC],
        size=ProjectSize.GROWTH,
        discount_percent=10,
        notes="First-time client discount applied!"
    )
    
    print(f"✅ Proposal Created: {proposal.id}")
    print(f"   Client: {proposal.client_name}")
    print(f"   Services: {len(proposal.items)}")
    print(f"   Subtotal: ${proposal.subtotal:,.2f}")
    print(f"   Discount: ${proposal.discount_amount:,.2f}")
    print(f"   Total: ${proposal.total:,.2f}")
    print()
    
    # Format and display
    print("📄 Proposal Preview:")
    print("=" * 50)
    print(gen.format_proposal_text(proposal)[:1000] + "...")
    print()
    
    # Send proposal
    gen.send_proposal(proposal.id)
    print(f"📤 Proposal Sent!")
    
    # Accept proposal
    gen.accept_proposal(proposal.id)
    print(f"🎉 Proposal Accepted!")
    print()
    
    # Stats
    stats = gen.get_stats()
    print("📊 Statistics:")
    print(f"   Created: {stats['proposals_created']}")
    print(f"   Sent: {stats['proposals_sent']}")
    print(f"   Accepted: {stats['proposals_accepted']}")
    print(f"   Acceptance Rate: {stats['acceptance_rate']:.1f}%")
    print(f"   Total Value: ${stats['total_value']:,.2f}")
    print(f"   Accepted Value: ${stats['accepted_value']:,.2f}")
