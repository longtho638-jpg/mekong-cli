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

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

try:
    from .db import get_db
except ImportError:
    # Fallback for standalone execution
    from db import get_db


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


class CRMPresenter:
    """
    Handles the presentation logic for the CRM.
    Separates the View from the Model.
    """
    
    @staticmethod
    def format_pipeline_text(crm: 'CRM') -> str:
        """Format pipeline as text."""
        pipeline = crm.get_pipeline()
        summary = crm.get_summary()
        forecast = crm.forecast_revenue()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 {crm.agency_name.upper()} - CRM DASHBOARD            ║",
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
    
    # Probability Constants
    PROB_QUALIFIED = 20
    PROB_PROPOSAL = 40
    PROB_NEGOTIATION = 70
    PROB_CLOSED_WON = 100
    PROB_CLOSED_LOST = 0
    
    # Lead Scoring Thresholds
    HOT_LEAD_THRESHOLD = 70
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        self.db = get_db()
        self.is_connected = bool(self.db)
        
        # Data stores
        self.contacts: Dict[str, Contact] = {}
        self.deals: Dict[str, Deal] = {}
        self.activities: List[Activity] = []
        
        # Pipeline stages with probabilities
        self.stage_probabilities = {
            DealStage.QUALIFIED: self.PROB_QUALIFIED,
            DealStage.PROPOSAL: self.PROB_PROPOSAL,
            DealStage.NEGOTIATION: self.PROB_NEGOTIATION,
            DealStage.CLOSED_WON: self.PROB_CLOSED_WON,
            DealStage.CLOSED_LOST: self.PROB_CLOSED_LOST
        }
        
        # Load data (Demo or Real)
        if not self.is_connected:
            self._create_demo_data()
        else:
            # Future: Load from Supabase
            print("🔗 Connected to Supabase (Mock loading for now)")
            self._create_demo_data() 
    
    def _create_demo_data(self) -> None:
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
        if not contacts: return

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
    
    def get_hot_leads(self, min_score: Optional[int] = None) -> List[Contact]:
        """Get high-scoring leads."""
        threshold = min_score if min_score is not None else self.HOT_LEAD_THRESHOLD
        return [
            c for c in self.contacts.values() 
            if c.lead_score >= threshold and c.contact_type in [ContactType.LEAD, ContactType.PROSPECT]
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
            probability=self.stage_probabilities.get(stage, self.PROB_QUALIFIED)
        )
        self.deals[deal.id] = deal
        return deal
    
    def move_deal(self, deal_id: str, new_stage: DealStage) -> bool:
        """Move deal to new stage."""
        if deal_id in self.deals:
            deal = self.deals[deal_id]
            deal.stage = new_stage
            deal.probability = self.stage_probabilities.get(new_stage, self.PROB_QUALIFIED)
            
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
        """
        Forecast revenue from pipeline.
        Optimized to reduce iterations.
        """
        total_value = 0.0
        weighted_value = 0.0
        this_month_weighted = 0.0
        next_month_weighted = 0.0
        
        open_deals_count = 0
        
        # Date boundaries
        now = datetime.now()
        this_month_start = now.replace(day=1)
        next_month_start = (this_month_start + timedelta(days=32)).replace(day=1)
        month_after_next_start = (next_month_start + timedelta(days=32)).replace(day=1)

        for deal in self.deals.values():
            if deal.stage in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]:
                continue
            
            open_deals_count += 1
            total_value += deal.value
            weighted = deal.value * (deal.probability / 100.0)
            weighted_value += weighted
            
            # Month buckets
            if deal.expected_close < next_month_start:
                this_month_weighted += weighted
            elif deal.expected_close < month_after_next_start:
                next_month_weighted += weighted
        
        return {
            "total_pipeline": total_value,
            "weighted_pipeline": weighted_value,
            "this_month": this_month_weighted,
            "next_month": next_month_weighted,
            "deals_count": open_deals_count
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get CRM summary."""
        contacts_by_type = {}
        for c in self.contacts.values():
            t = c.contact_type.value
            contacts_by_type[t] = contacts_by_type.get(t, 0) + 1
        
        pipeline_values = self.get_pipeline_value()
        forecast = self.forecast_revenue()
        
        won_value = pipeline_values.get("closed_won", 0)
        lost_value = pipeline_values.get("closed_lost", 0)
        
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
    pipeline_val = crm.get_pipeline_value()
    print("📊 Pipeline Value:")
    for stage_key, value_amt in pipeline_val.items():
        if value_amt > 0:
            print(f"   • {stage_key}: ${value_amt:,.0f}")
    print()
    
    # Forecast
    forecast_data = crm.forecast_revenue()
    print("🔮 Revenue Forecast:")
    print(f"   Total Pipeline: ${forecast_data['total_pipeline']:,.0f}")
    print(f"   Weighted: ${forecast_data['weighted_pipeline']:,.0f}")
    print()
    
    # Log activity
    first_contact = list(crm.contacts.values())[0]
    crm.log_activity(
        contact_id=first_contact.id,
        activity_type=ActivityType.CALL,
        description="Discovery call - discussed project needs",
        outcome="Positive - booking proposal call"
    )
    print(f"✅ Activity logged for {first_contact.name}")
    print()
    
    # Summary
    summary_data = crm.get_summary()
    print("📈 CRM Summary:")
    print(f"   Contacts: {summary_data['contacts_total']}")
    print(f"   Deals: {summary_data['deals_total']}")
    print(f"   Win Rate: {summary_data['win_rate']:.1f}%")
    print()
    
    # Full dashboard via Presenter
    print(CRMPresenter.format_pipeline_text(crm))