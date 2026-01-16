"""
🎯 Lead Scoring - Smart Lead Prioritization
=============================================

Score and prioritize leads automatically.
Focus on high-value prospects!

Features:
- Multi-factor scoring
- Automatic prioritization
- Lead stages
- Conversion prediction
"""

import uuid
import logging
import re
from typing import Dict, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LeadStage(Enum):
    """Lifecycle stages of a sales lead."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class LeadSource(Enum):
    """Origins of incoming leads."""
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL = "social"
    ADS = "ads"
    COLD = "cold"
    EVENT = "event"


@dataclass
class Lead:
    """A sales lead entity record."""
    id: str
    name: str
    company: str
    email: str
    source: LeadSource
    stage: LeadStage = LeadStage.NEW
    budget: float = 0.0
    score: int = 0
    engagement_score: int = 0
    fit_score: int = 0
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.budget < 0:
            raise ValueError("Budget cannot be negative")


class LeadScoring:
    """
    Lead Scoring System.
    
    Automates the prioritization of sales prospects based on budget, source, and strategic fit.
    """

    # Weighting configuration
    WEIGHTS = {"budget": 0.30, "source": 0.25, "engagement": 0.25, "fit": 0.20}

    SOURCE_VALS = {
        LeadSource.REFERRAL: 100, LeadSource.EVENT: 80,
        LeadSource.WEBSITE: 70, LeadSource.SOCIAL: 50,
        LeadSource.ADS: 40, LeadSource.COLD: 20
    }

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.leads: Dict[str, Lead] = {}
        logger.info(f"Lead Scoring initialized for {agency_name}")

    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def add_lead(
        self,
        name: str,
        company: str,
        email: str,
        source: LeadSource,
        budget: float = 0.0
    ) -> Lead:
        """Register and immediately score a new sales lead."""
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")

        lead = Lead(
            id=f"LEAD-{uuid.uuid4().hex[:6].upper()}",
            name=name, company=company, email=email,
            source=source, budget=float(budget)
        )

        self.calculate_score(lead)
        self.leads[lead.id] = lead
        logger.info(f"Lead added: {name} ({company}). Score: {lead.score}")
        return lead

    def calculate_score(self, lead: Lead):
        """Execute multi-factor scoring algorithm."""
        # 1. Budget Score
        b_score = 100 if lead.budget >= 10000 else 75 if lead.budget >= 5000 else 50 if lead.budget >= 2000 else 25

        # 2. Source Value
        s_val = self.SOURCE_VALS.get(lead.source, 30)

        # 3. Engagement & Fit (Simulated base)
        lead.engagement_score = min(100, 40 + int(lead.budget / 200))
        lead.fit_score = min(100, s_val + 10)

        # Aggregate
        total = (
            b_score * self.WEIGHTS["budget"] +
            s_val * self.WEIGHTS["source"] +
            lead.engagement_score * self.WEIGHTS["engagement"] +
            lead.fit_score * self.WEIGHTS["fit"]
        )
        lead.score = int(total)

    def get_hot_leads(self, threshold: int = 70) -> List[Lead]:
        """Filter leads that meet the hot priority threshold."""
        return [l for l in self.leads.values() if l.score >= threshold]

    def format_dashboard(self) -> str:
        """Render the Lead Scoring Dashboard."""
        hot_leads = [l for l in self.leads.values() if l.score >= 70]
        avg_score = sum(l.score for l in self.leads.values()) / len(self.leads) if self.leads else 0

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 LEAD SCORING DASHBOARD{' ' * 32}║",
            f"║  {len(self.leads)} total │ {len(hot_leads)} hot leads │ {avg_score:.0f} avg score{' ' * 15}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔥 HIGH-PRIORITY PROSPECTS                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        for l in sorted(hot_leads, key=lambda x: x.score, reverse=True)[:5]:
            bar = "█" * (l.score // 10) + "░" * (10 - l.score // 10)
            lines.append(f"║    {l.name[:15]:<15} │ {bar} │ {l.score:>3} points  ║")

        lines.extend([
            "║                                                           ║",
            "║  [➕ New Lead]  [🎯 Re-score]  [📊 Analytics]  [⚙️ Weights] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Focus!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing Lead Scoring...")
    print("=" * 60)

    try:
        system = LeadScoring("Saigon Digital Hub")
        # Seed
        system.add_lead("John Smith", "TechCorp", "john@tech.io", LeadSource.REFERRAL, 8000.0)
        system.add_lead("Anna Kim", "Enterprise", "anna@corp.co", LeadSource.EVENT, 15000.0)

        print("\n" + system.format_dashboard())

    except Exception as e:
        logger.error(f"Scoring Error: {e}")
