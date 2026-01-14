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
import logging
import re
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from .db import get_db
except ImportError:
    from db import get_db


class ContactType(Enum):
    """Contact lifecycle stages."""
    LEAD = "lead"
    PROSPECT = "prospect"
    CLIENT = "client"
    PARTNER = "partner"
    CHURNED = "churned"


class DealStage(Enum):
    """Sales pipeline stages."""
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(Enum):
    """Types of sales interactions."""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    TASK = "task"


@dataclass
class Contact:
    """A CRM contact entity."""
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

    def __post_init__(self):
        if not 0 <= self.lead_score <= 100:
            raise ValueError("Lead score must be between 0 and 100")


@dataclass
class Deal:
    """A sales deal entity."""
    id: str
    contact_id: str
    title: str
    value: float
    stage: DealStage
    created_at: datetime
    expected_close: datetime
    probability: int  # 0-100
    notes: str = ""

    def __post_init__(self):
        if self.value < 0:
            raise ValueError("Deal value cannot be negative")


@dataclass
class Activity:
    """A sales activity record."""
    id: str
    contact_id: str
    deal_id: Optional[str]
    activity_type: ActivityType
    description: str
    timestamp: datetime = field(default_factory=datetime.now)
    outcome: str = ""


class CRM:
    """
    CRM System.
    
    Manages sales pipeline, contacts, and performance forecasting.
    """
    
    # Configuration
    PROBABILITIES = {
        DealStage.QUALIFIED: 20,
        DealStage.PROPOSAL: 40,
        DealStage.NEGOTIATION: 70,
        DealStage.CLOSED_WON: 100,
        DealStage.CLOSED_LOST: 0
    }
    HOT_LEAD_MIN = 70
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        self.db = get_db()
        self.contacts: Dict[str, Contact] = {}
        self.deals: Dict[str, Deal] = {}
        self.activities: List[Activity] = []
        
        logger.info(f"CRM System initialized for {agency_name}")
        self._create_demo_data()
    
    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def _create_demo_data(self):
        """Seed the system with sample sales data."""
        logger.info("Loading demo CRM data...")
        try:
            c1 = self.add_contact("John Smith", "john@acme.co", "Acme Corp", ContactType.PROSPECT)
            self.create_deal(c1.id, "Website Overhaul", 5000.0, DealStage.PROPOSAL)
            
            c2 = self.add_contact("Sarah Jin", "sarah@tech.io", "TechStart", ContactType.LEAD)
            c2.lead_score = 85
        except Exception as e:
            logger.error(f"Demo data error: {e}")

    def add_contact(self, name: str, email: str, company: str, ctype: ContactType = ContactType.LEAD) -> Contact:
        """Create a new contact record."""
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")

        contact = Contact(
            id=f"CON-{uuid.uuid4().hex[:6].upper()}",
            name=name, email=email, company=company, phone="",
            contact_type=ctype, created_at=datetime.now()
        )
        self.contacts[contact.id] = contact
        logger.info(f"Contact added: {name} ({company})")
        return contact
    
    def create_deal(self, contact_id: str, title: str, value: float, stage: DealStage = DealStage.QUALIFIED) -> Deal:
        """Register a new sales opportunity."""
        if contact_id not in self.contacts:
            raise KeyError("Invalid Contact ID")

        deal = Deal(
            id=f"DEAL-{uuid.uuid4().hex[:6].upper()}",
            contact_id=contact_id, title=title, value=value, stage=stage,
            created_at=datetime.now(),
            expected_close=datetime.now() + timedelta(days=30),
            probability=self.PROBABILITIES.get(stage, 20)
        )
        self.deals[deal.id] = deal
        logger.info(f"Deal created: {title} (${value:,.0f})")
        return deal
    
    def log_activity(self, contact_id: str, act_type: ActivityType, desc: str) -> Activity:
        """Record a sales interaction."""
        activity = Activity(
            id=f"ACT-{uuid.uuid4().hex[:6]}",
            contact_id=contact_id, deal_id=None,
            activity_type=act_type, description=desc
        )
        self.activities.append(activity)
        if contact_id in self.contacts:
            self.contacts[contact_id].last_contact = datetime.now()
        logger.debug(f"Activity logged for {contact_id}")
        return activity

    def format_dashboard(self) -> str:
        """Render ASCII CRM Dashboard."""
        active_deals = [d for d in self.deals.values() if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]
        total_val = sum(d.value for d in active_deals)
        weighted_val = sum(d.value * (d.probability / 100.0) for d in active_deals)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 CRM DASHBOARD - {self.agency_name.upper()[:28]:<28} ║",
            f"║  {len(self.contacts)} contacts │ {len(active_deals)} active deals │ ${total_val:,.0f} pipeline{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 PIPELINE BY STAGE                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for stage in [DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION]:
            stage_deals = [d for d in self.deals.values() if d.stage == stage]
            val = sum(d.value for d in stage_deals)
            lines.append(f"║  {stage.value.upper():<15} │ {len(stage_deals):>2} deals │ ${val:>10,.0f}          ║")
            
        lines.extend([
            "║                                                           ║",
            "║  🔮 SALES FORECAST                                        ║",
            f"║    Weighted Pipeline: ${weighted_val:>12,.0f}                ║",
            "║                                                           ║",
            "║  [➕ Contact]  [💼 New Deal]  [📞 Log Activity]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Scale!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing CRM System...")
    print("=" * 60)
    
    try:
        crm_system = CRM("Saigon Digital Hub")
        print("\n" + crm_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"CRM Error: {e}")