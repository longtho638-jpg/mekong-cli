"""
💰 Sales Hub - Revenue Engine
===============================

Central hub connecting all Sales roles.

Integrates:
- CRM (crm.py)
- Lead Scoring (lead_scoring.py)
- Proposal Generator (proposal_generator.py)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.crm import CRM, ContactType, DealStage
from core.lead_scoring import LeadScoring, LeadSource, LeadStage
from core.proposal_generator import ProposalGenerator, ServiceType, ProjectSize


@dataclass
class SalesMetrics:
    """Department-wide metrics."""
    total_contacts: int
    hot_leads: int
    pipeline_value: float
    deals_open: int
    proposals_sent: int
    proposals_accepted: int
    conversion_rate: float
    forecast_revenue: float


class SalesHub:
    """
    Sales Hub.
    
    Revenue engine for the agency.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.crm = CRM(agency_name)
        self.lead_scoring = LeadScoring(agency_name)
        self.proposals = ProposalGenerator(agency_name)
    
    def get_department_metrics(self) -> SalesMetrics:
        """Get department-wide metrics."""
        crm_summary = self.crm.get_summary()
        pipeline = self.crm.get_pipeline()
        forecast = self.crm.forecast_revenue()
        hot_leads = self.lead_scoring.get_hot_leads()
        proposal_stats = self.proposals.get_stats()
        
        deals_open = sum(
            len(deals) for stage, deals in pipeline.items() 
            if stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
        )
        
        return SalesMetrics(
            total_contacts=crm_summary.get("total_contacts", 0),
            hot_leads=len(hot_leads),
            pipeline_value=crm_summary.get("pipeline_value", 0),
            deals_open=deals_open,
            proposals_sent=proposal_stats.get("sent", 0),
            proposals_accepted=proposal_stats.get("accepted", 0),
            conversion_rate=proposal_stats.get("conversion_rate", 0),
            forecast_revenue=forecast.get("total_weighted", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 SALES HUB                                             ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👥 Total Contacts:     {metrics.total_contacts:>5}                          ║",
            f"║    🔥 Hot Leads:          {metrics.hot_leads:>5}                          ║",
            f"║    💰 Pipeline Value:     ${metrics.pipeline_value:>12,.0f}              ║",
            f"║    📋 Open Deals:         {metrics.deals_open:>5}                          ║",
            f"║    📄 Proposals Sent:     {metrics.proposals_sent:>5}                          ║",
            f"║    ✅ Proposals Won:      {metrics.proposals_accepted:>5}                          ║",
            f"║    📈 Conversion Rate:    {metrics.conversion_rate:>5.1f}%                         ║",
            f"║    💵 Forecast Revenue:   ${metrics.forecast_revenue:>12,.0f}              ║",
            "║                                                           ║",
            "║  🔗 SALES ROLES                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    👥 CRM               → Contacts, deals, pipeline      ║",
            "║    🎯 Lead Scoring      → Score, prioritize, qualify     ║",
            "║    📋 Proposal Generator → Quotes, pricing, close        ║",
            "║                                                           ║",
            "║  📋 SALES TEAM                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👥 CRM               │ {metrics.total_contacts} contacts, {metrics.deals_open} deals     ║",
            f"║    🎯 Leads             │ {metrics.hot_leads} hot leads ready          ║",
            f"║    📋 Proposals         │ {metrics.proposals_sent} sent, {metrics.proposals_accepted} won           ║",
            "║                                                           ║",
            "║  [📊 Reports]  [👥 CRM]  [📋 Proposals]                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Close more deals!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = SalesHub("Saigon Digital Hub")
    
    print("💰 Sales Hub")
    print("=" * 60)
    print()
    
    # CRM already has demo data
    # Add some leads to lead scoring
    hub.lead_scoring.add_lead("Sarah CEO", "Big Corp", "sarah@bigcorp.com", LeadSource.REFERRAL, 15000)
    hub.lead_scoring.add_lead("Mike CTO", "Tech Inc", "mike@tech.com", LeadSource.WEBSITE, 8000)
    
    # Create a proposal
    hub.proposals.create_proposal(
        "Sarah CEO",
        "sarah@bigcorp.com",
        "Digital Transformation",
        "Complete digital agency services",
        [ServiceType.WEB_DEV, ServiceType.SEO, ServiceType.CONTENT],
        ProjectSize.GROWTH
    )
    
    print(hub.format_hub_dashboard())
