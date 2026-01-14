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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProposalStatus(Enum):
    """Lifecycle status of a client proposal."""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ServiceTier(Enum):
    """Pricing tiers for service packages."""
    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"


@dataclass
class ServicePackage:
    """A defined service offering entity."""
    name: str
    description: str
    deliverables: List[str]
    monthly_price: float
    setup_fee: float = 0.0

    def __post_init__(self):
        if self.monthly_price < 0 or self.setup_fee < 0:
            raise ValueError("Pricing cannot be negative")


@dataclass
class Proposal:
    """A complete proposal document entity."""
    id: str
    client_name: str
    client_company: str
    client_email: str
    agency_name: str
    niche: str
    services: List[ServicePackage]
    status: ProposalStatus = ProposalStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    notes: str = ""
    
    @property
    def total_monthly(self) -> float:
        return sum(s.monthly_price for s in self.services)
    
    @property
    def total_setup(self) -> float:
        return sum(s.setup_fee for s in self.services)


class ProposalGenerator:
    """
    Proposal Generation System.
    
    Automates the creation of high-conversion client proposals using Agency DNA and niche-specific templates.
    """
    
    def __init__(self, agency_name: str, niche: str, location: str, skill: str):
        self.agency_name = agency_name
        self.niche = niche
        self.location = location
        self.skill = skill
        self.packages = self._init_packages()
        logger.info(f"Proposal Generator initialized for {agency_name} ({niche})")
    
    def _init_packages(self) -> Dict[ServiceTier, ServicePackage]:
        """Blueprint for standard service tiers based on agency niche."""
        return {
            ServiceTier.STARTER: ServicePackage(
                f"{self.niche} Starter", f"Ideal for {self.niche} entry", ["Consult", "Audit"], 500.0
            ),
            ServiceTier.GROWTH: ServicePackage(
                f"{self.niche} Growth", f"Scale your {self.niche} results", ["Ads", "Strategy"], 1500.0, 500.0
            )
        }
    
    def generate_proposal(
        self,
        client: str,
        company: str,
        email: str,
        tiers: List[ServiceTier]
    ) -> Proposal:
        """Execute proposal generation logic."""
        if not client or not email:
            raise ValueError("Client name and email are mandatory")

        services = [self.packages[t] for t in tiers if t in self.packages]
        
        prop = Proposal(
            id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client, client_company=company, client_email=email,
            agency_name=self.agency_name, niche=self.niche,
            services=services
        )
        logger.info(f"Proposal generated: {prop.id} for {company}")
        return prop
    
    def format_dashboard(self, prop: Proposal) -> str:
        """Render ASCII Proposal Preview."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📝 PROPOSAL PREVIEW - {prop.id:<26} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Client: {prop.client_company[:25]:<25} │ From: {self.agency_name[:15]:<15} ║",
            f"║  Total Monthly: ${prop.total_monthly:>10,.0f} │ Setup: ${prop.total_setup:>10,.0f} ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  PROPOSED SERVICES:                                       ║",
        ]
        
        for s in prop.services:
            lines.append(f"║    📦 {s.name:<25} │ ${s.monthly_price:>10,.0f}/mo ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📤 Send Proposal]  [📝 Edit Content]  [🎨 Branding]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Win Fast!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📝 Initializing Proposal System...")
    print("=" * 60)
    
    try:
        gen = ProposalGenerator("Saigon Digital", "Real Estate", "HCM City", "Meta Ads")
        p = gen.generate_proposal("Hoang", "Sunrise Realty", "hoang@sunrise.vn", [ServiceTier.GROWTH])
        
        print("\n" + gen.format_dashboard(p))
        
    except Exception as e:
        logger.error(f"Proposal Error: {e}")
