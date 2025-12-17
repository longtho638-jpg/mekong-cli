"""
🎯 CRM System - From Lead to Client
====================================

Complete sales pipeline management.

Features:
- Contact management
- Deal pipeline tracking
- Activity logging
- Lead scoring
- Sales forecasting
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid


class ContactType(Enum):
    """Contact types."""
    LEAD = "lead"
    PROSPECT = "prospect"
    CLIENT = "client"
    PARTNER = "partner"
    CHURNED = "churned"


class DealStage(Enum):
    """Deal pipeline stages."""
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(Enum):
    """Activity types."""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    TASK = "task"


@dataclass
class Contact:
    """A CRM contact."""
    id: str
    name: str
    email: str
    company: str
    phone: str
    contact_type: ContactType
    created_at: datetime
    lead_score: int = 50  # 0-100
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    last_contact: Optional[datetime] = None


@dataclass
class Deal:
    """A sales deal."""
    id: str
    contact_id: str
    title: str
    value: float
    stage: DealStage
    created_at: datetime
    expected_close: datetime
    probability: int  # 0-100
    notes: str = ""


@dataclass
class Activity:
    """An activity log entry."""
    id: str
    contact_id: str
    deal_id: Optional[str]
    activity_type: ActivityType
    description: str
    timestamp: datetime
    outcome: str = ""


class CRM:
    """
    CRM System for Agency.
    
    Track your sales pipeline:
    - Contacts & companies
    - Deals by stage
    - Activities & touchpoints
    - Lead scoring
    - Revenue forecasting
    """
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        
        # Data stores
        self.contacts: Dict[str, Contact] = {}
        self.deals: Dict[str, Deal] = {}
        self.activities: List[Activity] = []
        
        # Pipeline stages with probabilities
        self.stage_probabilities = {
            DealStage.QUALIFIED: 20,
            DealStage.PROPOSAL: 40,
            DealStage.NEGOTIATION: 70,
            DealStage.CLOSED_WON: 100,
            DealStage.CLOSED_LOST: 0
        }
        
        # Create demo data
        self._create_demo_data()
    
    def _create_demo_data(self):
        """Create demo contacts and deals."""
        demo_contacts = [
            ("John Smith", "john@acme.com", "Acme Corp", ContactType.PROSPECT, 75),
            ("Sarah Johnson", "sarah@techstart.io", "TechStart", ContactType.CLIENT, 90),
            ("Mike Wilson", "mike@growthlab.co", "GrowthLab", ContactType.LEAD, 45),
            ("Emily Chen", "emily@scaleup.io", "ScaleUp Co", ContactType.PROSPECT, 65),
            ("David Lee", "david@localshop.com", "Local Shop", ContactType.LEAD, 30)
        ]
        
        for name, email, company, ctype, score in demo_contacts:
            contact = self.add_contact(name, email, company, ctype)
            contact.lead_score = score
        
        # Create deals
        contacts = list(self.contacts.values())
        demo_deals = [
            (contacts[0].id, "Website Redesign", 5000, DealStage.PROPOSAL),
            (contacts[1].id, "SEO Retainer", 2000, DealStage.CLOSED_WON),
            (contacts[2].id, "Content Strategy", 3000, DealStage.QUALIFIED),
            (contacts[3].id, "PPC Campaign", 1500, DealStage.NEGOTIATION)
        ]
        
        for contact_id, title, value, stage in demo_deals:
            self.create_deal(contact_id, title, value, stage)
    
    # ═══════════════════════════════════════════════════════════
    # Contact Management
    # ═══════════════════════════════════════════════════════════
    
    def add_contact(
        self,
        name: str,
        email: str,
        company: str,
        contact_type: ContactType = ContactType.LEAD,
        phone: str = ""
    ) -> Contact:
        """Add a new contact."""
        contact = Contact(
            id=f"CON-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            email=email,
            company=company,
            phone=phone,
            contact_type=contact_type,
            created_at=datetime.now()
        )
        self.contacts[contact.id] = contact
        return contact
    
    def update_lead_score(self, contact_id: str, score: int) -> bool:
        """Update contact lead score (0-100)."""
        if contact_id in self.contacts:
            self.contacts[contact_id].lead_score = max(0, min(100, score))
            return True
        return False
    
    def get_hot_leads(self, min_score: int = 70) -> List[Contact]:
        """Get high-scoring leads."""
        return [
            c for c in self.contacts.values() 
            if c.lead_score >= min_score and c.contact_type in [ContactType.LEAD, ContactType.PROSPECT]
        ]
    
    # ═══════════════════════════════════════════════════════════
    # Deal Pipeline
    # ═══════════════════════════════════════════════════════════
    
    def create_deal(
        self,
        contact_id: str,
        title: str,
        value: float,
        stage: DealStage = DealStage.QUALIFIED,
        close_days: int = 30
    ) -> Deal:
        """Create a new deal."""
        deal = Deal(
            id=f"DEAL-{uuid.uuid4().hex[:6].upper()}",
            contact_id=contact_id,
            title=title,
            value=value,
            stage=stage,
            created_at=datetime.now(),
            expected_close=datetime.now() + timedelta(days=close_days),
            probability=self.stage_probabilities.get(stage, 20)
        )
        self.deals[deal.id] = deal
        return deal
    
    def move_deal(self, deal_id: str, new_stage: DealStage) -> bool:
        """Move deal to new stage."""
        if deal_id in self.deals:
            deal = self.deals[deal_id]
            deal.stage = new_stage
            deal.probability = self.stage_probabilities.get(new_stage, 20)
            
            # Update contact type if won
            if new_stage == DealStage.CLOSED_WON:
                if deal.contact_id in self.contacts:
                    self.contacts[deal.contact_id].contact_type = ContactType.CLIENT
            
            return True
        return False
    
    def get_pipeline(self) -> Dict[str, Any]:
        """Get complete pipeline view."""
        pipeline = {stage.value: [] for stage in DealStage}
        
        for deal in self.deals.values():
            pipeline[deal.stage.value].append({
                "id": deal.id,
                "title": deal.title,
                "value": deal.value,
                "contact": self.contacts.get(deal.contact_id, {})
            })
        
        return pipeline
    
    def get_pipeline_value(self) -> Dict[str, float]:
        """Get value by stage."""
        values = {stage.value: 0 for stage in DealStage}
        
        for deal in self.deals.values():
            values[deal.stage.value] += deal.value
        
        return values
    
    # ═══════════════════════════════════════════════════════════
    # Activity Tracking
    # ═══════════════════════════════════════════════════════════
    
    def log_activity(
        self,
        contact_id: str,
        activity_type: ActivityType,
        description: str,
        deal_id: Optional[str] = None,
        outcome: str = ""
    ) -> Activity:
        """Log an activity."""
        activity = Activity(
            id=f"ACT-{uuid.uuid4().hex[:6]}",
            contact_id=contact_id,
            deal_id=deal_id,
            activity_type=activity_type,
            description=description,
            timestamp=datetime.now(),
            outcome=outcome
        )
        self.activities.append(activity)
        
        # Update last contact
        if contact_id in self.contacts:
            self.contacts[contact_id].last_contact = datetime.now()
        
        return activity
    
    def get_contact_activities(self, contact_id: str) -> List[Activity]:
        """Get activities for a contact."""
        return [a for a in self.activities if a.contact_id == contact_id]
    
    # ═══════════════════════════════════════════════════════════
    # Analytics & Forecasting
    # ═══════════════════════════════════════════════════════════
    
    def forecast_revenue(self) -> Dict[str, Any]:
        """Forecast revenue from pipeline."""
        open_deals = [
            d for d in self.deals.values() 
            if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
        ]
        
        total_value = sum(d.value for d in open_deals)
        weighted_value = sum(d.value * (d.probability / 100) for d in open_deals)
        
        # By month
        this_month = datetime.now().replace(day=1)
        next_month = (this_month + timedelta(days=32)).replace(day=1)
        
        this_month_deals = [d for d in open_deals if d.expected_close < next_month]
        next_month_deals = [d for d in open_deals if d.expected_close >= next_month]
        
        return {
            "total_pipeline": total_value,
            "weighted_pipeline": weighted_value,
            "this_month": sum(d.value * (d.probability / 100) for d in this_month_deals),
            "next_month": sum(d.value * (d.probability / 100) for d in next_month_deals),
            "deals_count": len(open_deals)
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get CRM summary."""
        contacts_by_type = {}
        for c in self.contacts.values():
            t = c.contact_type.value
            contacts_by_type[t] = contacts_by_type.get(t, 0) + 1
        
        pipeline = self.get_pipeline_value()
        forecast = self.forecast_revenue()
        
        won_value = pipeline.get("closed_won", 0)
        lost_value = pipeline.get("closed_lost", 0)
        
        return {
            "contacts_total": len(self.contacts),
            "contacts_by_type": contacts_by_type,
            "deals_total": len(self.deals),
            "pipeline_value": forecast["total_pipeline"],
            "weighted_forecast": forecast["weighted_pipeline"],
            "won_value": won_value,
            "lost_value": lost_value,
            "win_rate": (won_value / max(1, won_value + lost_value)) * 100,
            "activities_count": len(self.activities)
        }
    
    def format_pipeline_text(self) -> str:
        """Format pipeline as text."""
        pipeline = self.get_pipeline()
        summary = self.get_summary()
        forecast = self.forecast_revenue()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 {self.agency_name.upper()} - CRM DASHBOARD            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║                                                           ║",
            "║  📊 PIPELINE                                              ║",
        ]
        
        for stage in [DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION]:
            deals = pipeline[stage.value]
            value = sum(d["value"] for d in deals)
            lines.append(f"║  {stage.value.upper():<15} {len(deals):>3} deals    ${value:>8,.0f}    ║")
        
        lines.extend([
            "║                                                           ║",
            f"║  💰 FORECAST                                              ║",
            f"║  Pipeline Value:     ${forecast['total_pipeline']:>10,.0f}                ║",
            f"║  Weighted Forecast:  ${forecast['weighted_pipeline']:>10,.0f}                ║",
            "║                                                           ║",
            f"║  📈 METRICS                                               ║",
            f"║  Win Rate:           {summary['win_rate']:>10.1f}%                ║",
            f"║  Total Contacts:     {summary['contacts_total']:>10}                 ║",
            "║                                                           ║",
            "╚═══════════════════════════════════════════════════════════╝"
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    # Initialize CRM
    crm = CRM(agency_name="Nova Digital")
    
    print("🎯 CRM System Initialized!")
    print(f"   Contacts: {len(crm.contacts)}")
    print(f"   Deals: {len(crm.deals)}")
    print()
    
    # Hot leads
    hot_leads = crm.get_hot_leads()
    print("🔥 Hot Leads (score >= 70):")
    for lead in hot_leads:
        print(f"   • {lead.name} ({lead.company}) - Score: {lead.lead_score}")
    print()
    
    # Pipeline
    pipeline = crm.get_pipeline_value()
    print("📊 Pipeline Value:")
    for stage, value in pipeline.items():
        if value > 0:
            print(f"   • {stage}: ${value:,.0f}")
    print()
    
    # Forecast
    forecast = crm.forecast_revenue()
    print("🔮 Revenue Forecast:")
    print(f"   Total Pipeline: ${forecast['total_pipeline']:,.0f}")
    print(f"   Weighted: ${forecast['weighted_pipeline']:,.0f}")
    print()
    
    # Log activity
    contact = list(crm.contacts.values())[0]
    crm.log_activity(
        contact_id=contact.id,
        activity_type=ActivityType.CALL,
        description="Discovery call - discussed project needs",
        outcome="Positive - booking proposal call"
    )
    print(f"✅ Activity logged for {contact.name}")
    print()
    
    # Summary
    summary = crm.get_summary()
    print("📈 CRM Summary:")
    print(f"   Contacts: {summary['contacts_total']}")
    print(f"   Deals: {summary['deals_total']}")
    print(f"   Win Rate: {summary['win_rate']:.1f}%")
    print()
    
    # Full dashboard
    print(crm.format_pipeline_text())
