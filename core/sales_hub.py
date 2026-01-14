"""
💰 Sales Hub - Revenue Engine
===============================

Central hub connecting all Sales roles within the agency operations.

Integrates:
- CRM (crm.py)
- Lead Scoring (lead_scoring.py)
- Proposal Generator (proposal_generator.py)
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime

# Import role modules with fallback
try:
    from core.crm import CRM, ContactType, DealStage
    from core.lead_scoring import LeadScoring, LeadSource, LeadStage
    from core.proposal_generator import ProposalGenerator, ServiceType, ProjectTier
except ImportError:
    from crm import CRM, ContactType, DealStage
    from lead_scoring import LeadScoring, LeadSource, LeadStage
    from proposal_generator import ProposalGenerator, ServiceType, ProjectTier

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class SalesMetrics:
    """Department-wide Sales performance metrics."""
    total_contacts: int = 0
    hot_leads: int = 0
    pipeline_value: float = 0.0
    deals_open: int = 0
    proposals_sent: int = 0
    proposals_accepted: int = 0
    conversion_rate: float = 0.0
    forecast_revenue: float = 0.0


class SalesHub:
    """
    Sales Hub System.
    
    Orchestrates department-wide integration between lead scoring, CRM pipeline management, and automated proposals.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        logger.info(f"Initializing Sales Hub for {agency_name}")
        
        try:
            self.crm = CRM(agency_name)
            self.lead_scoring = LeadScoring(agency_name)
            self.proposals = ProposalGenerator(agency_name)
        except Exception as e:
            logger.error(f"Sales Hub initialization failed: {e}")
            raise
    
    def get_aggregate_stats(self) -> SalesMetrics:
        """Fetch and aggregate data from all sales sub-modules."""
        m = SalesMetrics()
        
        try:
            # 1. CRM Metrics
            crm_sum = self.crm.get_summary()
            m.total_contacts = crm_sum.get("total_contacts", 0)
            m.pipeline_value = float(crm_sum.get("pipeline_value", 0.0))
            
            # 2. Lead Scoring
            m.hot_leads = len(self.lead_scoring.get_hot_leads())
            
            # 3. Proposal Data
            # Note: ProposalGenerator stats might need standardization
            m.proposals_sent = len(self.proposals.active_proposals)
            m.proposals_accepted = sum(1 for p in self.proposals.active_proposals.values() if p.status.value == "accepted")
            
        except Exception as e:
            logger.warning(f"Error aggregating Sales metrics: {e}")
            
        return m
    
    def format_hub_dashboard(self) -> str:
        """Render the unified Sales Department Dashboard."""
        m = self.get_aggregate_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💰 SALES HUB DASHBOARD{' ' * 35}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT PERFORMANCE METRICS                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    👥 Total Contacts:     {m.total_contacts:>5}                          ║",
            f"║    🔥 Hot Leads:          {m.hot_leads:>5}                          ║",
            f"║    💰 Pipeline Value:     ${m.pipeline_value:>12,.0f}              ║",
            f"║    📄 Proposals Sent:     {m.proposals_sent:>5}                          ║",
            f"║    ✅ Proposals Won:      {m.proposals_accepted:>5}                          ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    👥 CRM (Pipeline) │ 🎯 Leads (Score) │ 📋 Quotes (Auto)║",
            "║                                                           ║",
            "║  [📊 Reports]  [👥 CRM]  [📋 Proposals]  [⚙️ Setup]       ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Close Deals!     ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💰 Initializing Sales Hub...")
    print("=" * 60)
    
    try:
        hub = SalesHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Sales Hub Error: {e}")
