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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class LeadStage(Enum):
    """Lead stages."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


class LeadSource(Enum):
    """Lead sources."""
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL = "social"
    ADS = "ads"
    COLD = "cold"
    EVENT = "event"


@dataclass
class Lead:
    """A sales lead."""
    id: str
    name: str
    company: str
    email: str
    source: LeadSource
    stage: LeadStage = LeadStage.NEW
    budget: float = 0
    score: int = 0
    engagement_score: int = 0
    fit_score: int = 0
    created_at: datetime = field(default_factory=datetime.now)


class LeadScoring:
    """
    Lead Scoring System.
    
    Smart lead prioritization.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.leads: Dict[str, Lead] = {}
        self.score_weights = {
            "budget": 30,
            "source": 25,
            "engagement": 25,
            "fit": 20
        }
        self.source_scores = {
            LeadSource.REFERRAL: 100,
            LeadSource.EVENT: 80,
            LeadSource.WEBSITE: 70,
            LeadSource.SOCIAL: 50,
            LeadSource.ADS: 40,
            LeadSource.COLD: 20,
        }
    
    def add_lead(
        self,
        name: str,
        company: str,
        email: str,
        source: LeadSource,
        budget: float = 0
    ) -> Lead:
        """Add a new lead."""
        lead = Lead(
            id=f"LEAD-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            company=company,
            email=email,
            source=source,
            budget=budget
        )
        
        self.score_lead(lead)
        self.leads[lead.id] = lead
        return lead
    
    def score_lead(self, lead: Lead):
        """Score a lead."""
        # Budget score (0-100)
        if lead.budget >= 10000:
            budget_score = 100
        elif lead.budget >= 5000:
            budget_score = 75
        elif lead.budget >= 2000:
            budget_score = 50
        else:
            budget_score = 25
        
        # Source score
        source_score = self.source_scores.get(lead.source, 30)
        
        # Engagement score (simulated)
        lead.engagement_score = min(100, 40 + (lead.budget // 100))
        
        # Fit score (simulated)
        lead.fit_score = min(100, source_score + 10)
        
        # Calculate total score
        lead.score = int(
            (budget_score * self.score_weights["budget"] +
             source_score * self.score_weights["source"] +
             lead.engagement_score * self.score_weights["engagement"] +
             lead.fit_score * self.score_weights["fit"]) / 100
        )
    
    def get_hot_leads(self) -> List[Lead]:
        """Get hot leads (score >= 70)."""
        return sorted(
            [l for l in self.leads.values() if l.score >= 70],
            key=lambda x: x.score,
            reverse=True
        )
    
    def format_dashboard(self) -> str:
        """Format lead scoring dashboard."""
        hot = len(self.get_hot_leads())
        total = len(self.leads)
        avg_score = sum(l.score for l in self.leads.values()) / total if total else 0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 LEAD SCORING                                          ║",
            f"║  {total} leads │ {hot} hot │ Avg: {avg_score:.0f}                       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔥 HOT LEADS (Score ≥70)                                  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for lead in self.get_hot_leads()[:4]:
            bar = "█" * (lead.score // 10) + "░" * (10 - lead.score // 10)
            lines.append(f"║    {lead.name[:15]:<15} │ {bar} │ {lead.score:>3}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 SCORING FACTORS                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for factor, weight in self.score_weights.items():
            bar_len = weight // 5
            bar = "█" * bar_len
            lines.append(f"║    {factor.capitalize():<12} │ {bar:<6} │ {weight}%              ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 BY SOURCE                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        source_icons = {"referral": "👥", "website": "🌐", "social": "📱", "ads": "📺", "cold": "❄️", "event": "🎪"}
        
        for source in list(LeadSource)[:4]:
            count = sum(1 for l in self.leads.values() if l.source == source)
            icon = source_icons.get(source.value, "•")
            lines.append(f"║    {icon} {source.value.capitalize():<12} │ {count:>3} leads                   ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ Add Lead]  [🎯 Score All]  [📊 Analytics]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Focus on winners!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    scoring = LeadScoring("Saigon Digital Hub")
    
    print("🎯 Lead Scoring")
    print("=" * 60)
    print()
    
    # Add leads
    scoring.add_lead("John Smith", "Tech Corp", "john@techcorp.com", LeadSource.REFERRAL, 8000)
    scoring.add_lead("Sarah Lee", "Growth Inc", "sarah@growth.com", LeadSource.WEBSITE, 5000)
    scoring.add_lead("Mike Chen", "Startup XYZ", "mike@startup.com", LeadSource.SOCIAL, 3000)
    scoring.add_lead("Anna Kim", "Enterprise Co", "anna@enterprise.com", LeadSource.EVENT, 15000)
    
    print(scoring.format_dashboard())
