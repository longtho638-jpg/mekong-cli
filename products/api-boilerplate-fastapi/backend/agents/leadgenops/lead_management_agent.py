"""
Lead Management Agent - Routing & Enrichment
Manages lead routing, enrichment, and CRM sync.
"""

from dataclasses import dataclass, field
from typing import Dict
from datetime import datetime
from enum import Enum
import random


class LeadStatus(Enum):
    NEW = "new"
    ENRICHED = "enriched"
    ROUTED = "routed"
    SYNCED = "synced"
    DUPLICATE = "duplicate"


class RoutingRule(Enum):
    ROUND_ROBIN = "round_robin"
    TERRITORY = "territory"
    LEAD_SCORE = "lead_score"


@dataclass
class ManagedLead:
    """Managed lead"""
    id: str
    email: str
    company: str = ""
    status: LeadStatus = LeadStatus.NEW
    enriched_data: Dict = field(default_factory=dict)
    assigned_to: str = ""
    crm_id: str = ""
    score: int = 0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class LeadManagementAgent:
    """
    Lead Management Agent - Quản lý Leads
    
    Responsibilities:
    - Lead routing
    - Data enrichment
    - CRM sync
    - Duplicate detection
    """
    
    def __init__(self):
        self.name = "Lead Management"
        self.status = "ready"
        self.leads: Dict[str, ManagedLead] = {}
        self.sales_reps = ["Rep A", "Rep B", "Rep C"]
        self.round_robin_index = 0
        
    def add_lead(self, email: str, company: str = "") -> ManagedLead:
        """Add lead to management"""
        # Check for duplicates
        for lead in self.leads.values():
            if lead.email == email:
                lead.status = LeadStatus.DUPLICATE
                return lead
        
        lead_id = f"mgd_{random.randint(1000,9999)}"
        
        lead = ManagedLead(
            id=lead_id,
            email=email,
            company=company,
            score=random.randint(20, 80)
        )
        
        self.leads[lead_id] = lead
        return lead
    
    def enrich_lead(self, lead_id: str) -> ManagedLead:
        """Enrich lead with data"""
        if lead_id not in self.leads:
            raise ValueError(f"Lead not found: {lead_id}")
            
        lead = self.leads[lead_id]
        
        # Simulate enrichment
        lead.enriched_data = {
            "company_size": random.choice(["1-50", "51-200", "201-500", "500+"]),
            "industry": random.choice(["Tech", "Finance", "Healthcare", "Retail"]),
            "revenue": random.choice(["<$1M", "$1-10M", "$10-50M", "$50M+"]),
            "linkedin": f"linkedin.com/company/{lead.company.lower().replace(' ', '-')}"
        }
        
        lead.status = LeadStatus.ENRICHED
        lead.score += 10  # Boost score after enrichment
        
        return lead
    
    def route_lead(self, lead_id: str, rule: RoutingRule = RoutingRule.ROUND_ROBIN) -> ManagedLead:
        """Route lead to sales rep"""
        if lead_id not in self.leads:
            raise ValueError(f"Lead not found: {lead_id}")
            
        lead = self.leads[lead_id]
        
        if rule == RoutingRule.ROUND_ROBIN:
            lead.assigned_to = self.sales_reps[self.round_robin_index]
            self.round_robin_index = (self.round_robin_index + 1) % len(self.sales_reps)
        elif rule == RoutingRule.LEAD_SCORE:
            # High score leads go to top rep
            lead.assigned_to = self.sales_reps[0] if lead.score > 60 else self.sales_reps[-1]
        
        lead.status = LeadStatus.ROUTED
        return lead
    
    def sync_to_crm(self, lead_id: str) -> ManagedLead:
        """Sync lead to CRM"""
        if lead_id not in self.leads:
            raise ValueError(f"Lead not found: {lead_id}")
            
        lead = self.leads[lead_id]
        lead.crm_id = f"CRM_{random.randint(10000,99999)}"
        lead.status = LeadStatus.SYNCED
        
        return lead
    
    def get_stats(self) -> Dict:
        """Get management statistics"""
        leads = list(self.leads.values())
        
        return {
            "total_leads": len(leads),
            "enriched": len([l for l in leads if l.status in [LeadStatus.ENRICHED, LeadStatus.ROUTED, LeadStatus.SYNCED]]),
            "routed": len([l for l in leads if l.status in [LeadStatus.ROUTED, LeadStatus.SYNCED]]),
            "synced": len([l for l in leads if l.status == LeadStatus.SYNCED]),
            "duplicates": len([l for l in leads if l.status == LeadStatus.DUPLICATE]),
            "avg_score": sum(l.score for l in leads) / len(leads) if leads else 0
        }


# Demo
if __name__ == "__main__":
    agent = LeadManagementAgent()
    
    print("📋 Lead Management Agent Demo\n")
    
    # Add leads
    l1 = agent.add_lead("john@acme.com", "Acme Corp")
    
    print(f"📋 Lead: {l1.email}")
    print(f"   Company: {l1.company}")
    print(f"   Score: {l1.score}")
    
    # Enrich
    agent.enrich_lead(l1.id)
    
    print("\n🔍 Enriched Data:")
    for k, v in l1.enriched_data.items():
        print(f"   {k}: {v}")
    
    # Route
    agent.route_lead(l1.id)
    print(f"\n🎯 Routed to: {l1.assigned_to}")
    
    # Sync
    agent.sync_to_crm(l1.id)
    print(f"✅ CRM ID: {l1.crm_id}")
    
    # Stats
    stats = agent.get_stats()
    print(f"\n📊 Stats: {stats['total_leads']} total, {stats['synced']} synced")
