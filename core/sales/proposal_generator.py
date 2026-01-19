"""
📋 Smart Proposal Generator - Professional Services
====================================================

Generate comprehensive project proposals with automated pricing and timelines.
Supports multiple service types and project tiers.

Features:
- Service catalog with base pricing
- Tier-based multipliers (Starter to Enterprise)
- Deliverable breakdown per service
- Profit-focused pricing logic
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class ServiceType(Enum):
    """Categorization of offered professional services."""

    SEO = "seo"
    CONTENT = "content"
    PPC = "ppc"
    SOCIAL = "social_media"
    WEB_DEV = "web_development"
    BRANDING = "branding"


class ProjectTier(Enum):
    """Scaling tiers for projects."""

    STARTER = "starter"
    GROWTH = "growth"
    SCALE = "scale"
    ENTERPRISE = "enterprise"


class ProposalStatus(Enum):
    """Lifecycle status of a proposal."""

    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"


@dataclass
class ServicePackage:
    """A standard service offering blueprint."""

    service_type: ServiceType
    name: str
    description: str
    deliverables: List[str]
    base_price: float
    hours_estimate: int


@dataclass
class ProposalItem:
    """A specific line item in a generated proposal."""

    name: str
    price: float
    description: str = ""


@dataclass
class Proposal:
    """A complete proposal document entity."""

    id: str
    client_name: str
    project_name: str
    items: List[ProposalItem] = field(default_factory=list)
    status: ProposalStatus = ProposalStatus.DRAFT
    discount_pct: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))

    def __post_init__(self):
        if not self.client_name:
            raise ValueError("Client name is required")

    @property
    def total_value(self) -> float:
        """Calculate final price after discounts."""
        subtotal = sum(i.price for i in self.items)
        return subtotal * (1 - (self.discount_pct / 100.0))


class ProposalGenerator:
    """
    Smart Proposal Generation System.

    Orchestrates service selection, tier-based pricing adjustments, and professional output formatting.
    """

    # Tier multipliers
    TIER_FACTORS = {
        ProjectTier.STARTER: 0.75,
        ProjectTier.GROWTH: 1.0,
        ProjectTier.SCALE: 1.5,
        ProjectTier.ENTERPRISE: 2.5,
    }

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.catalog = self._load_catalog()
        self.active_proposals: Dict[str, Proposal] = {}
        logger.info(f"Proposal System initialized for {agency_name}")

    def _load_catalog(self) -> Dict[ServiceType, ServicePackage]:
        """Blueprint for standard agency offerings."""
        return {
            ServiceType.SEO: ServicePackage(
                ServiceType.SEO,
                "SEO Growth",
                "Rank higher on Google",
                ["Audit", "Backlinks"],
                1500.0,
                20,
            ),
            ServiceType.WEB_DEV: ServicePackage(
                ServiceType.WEB_DEV,
                "Web Build",
                "Custom high-speed site",
                ["Design", "Dev", "Launch"],
                3500.0,
                40,
            ),
        }

    def create_proposal(
        self,
        client: str,
        project: str,
        services: List[ServiceType],
        tier: ProjectTier = ProjectTier.GROWTH,
    ) -> Proposal:
        """Initialize a new professional proposal project."""
        multiplier = self.TIER_FACTORS.get(tier, 1.0)
        items = []

        for stype in services:
            if stype in self.catalog:
                pkg = self.catalog[stype]
                items.append(
                    ProposalItem(
                        name=pkg.name,
                        price=pkg.base_price * multiplier,
                        description=pkg.description,
                    )
                )

        proposal = Proposal(
            id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client,
            project_name=project,
            items=items,
        )
        self.active_proposals[proposal.id] = proposal
        logger.info(f"Proposal created: {proposal.id} for {client}")
        return proposal

    def format_summary(self, p_id: str) -> str:
        """Render ASCII Proposal Summary Dashboard."""
        if p_id not in self.active_proposals:
            return "Proposal not found."

        p = self.active_proposals[p_id]

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📄 PROPOSAL SUMMARY - {p.id:<27} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Client: {p.client_name[:20]:<20} │ Project: {p.project_name[:20]:<20} ║",
            f"║  Status: {p.status.value.upper():<10}          │ Valid To: {p.valid_until.strftime('%Y-%m-%d')} ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  INVESTMENT BREAKDOWN:                                    ║",
        ]

        for item in p.items:
            lines.append(f"║    • {item.name:<25} │ ${item.price:>10,.0f}          ║")

        lines.extend(
            [
                "║  ───────────────────────────────────────────────────────  ║",
                f"║  💰 TOTAL INVESTMENT: ${p.total_value:>15,.0f} {' ' * 18}║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name[:40]:<40} - Scale!            ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing Proposal System...")
    print("=" * 60)

    try:
        system = ProposalGenerator("Saigon Digital Hub")
        # Generate
        prop = system.create_proposal(
            "Acme Corp",
            "Digital Transformation",
            [ServiceType.SEO, ServiceType.WEB_DEV],
            ProjectTier.SCALE,
        )

        print("\n" + system.format_summary(prop.id))

    except Exception as e:
        logger.error(f"Proposal Error: {e}")
