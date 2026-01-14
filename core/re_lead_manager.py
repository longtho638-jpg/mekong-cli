"""
📋 RE Lead Manager - Real Estate Leads
========================================

Manage real estate leads and inquiries.
Leads that convert!

Roles:
- Lead capture
- Inquiry management
- Follow-up tracking
- Conversion optimization
"""

import uuid
import logging
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LeadSource(Enum):
    """Origins of incoming property leads."""
    WEBSITE = "website"
    PORTAL = "portal"
    REFERRAL = "referral"
    SOCIAL = "social"
    WALK_IN = "walk_in"
    AD = "ad"


class LeadStatus(Enum):
    """Lifecycle status of a real estate lead."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    VIEWING = "viewing"
    NEGOTIATING = "negotiating"
    WON = "won"
    LOST = "lost"


class LeadIntent(Enum):
    """Primary objective of the prospect."""
    BUY = "buy"
    SELL = "sell"
    RENT = "rent"
    LEASE = "lease"
    INVEST = "invest"


@dataclass
class RELead:
    """A real estate lead entity record."""
    id: str
    name: str
    phone: str
    email: str
    source: LeadSource
    intent: LeadIntent
    budget: float
    location_pref: str
    status: LeadStatus = LeadStatus.NEW
    assigned_to: str = ""
    property_type: str = ""
    notes: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    last_contact: Optional[datetime] = None

    def __post_init__(self):
        if self.budget < 0:
            raise ValueError("Budget cannot be negative")


@dataclass
class Viewing:
    """A property showing record."""
    id: str
    lead_id: str
    property_id: str
    scheduled_at: datetime
    completed: bool = False
    feedback: str = ""


class RELeadManager:
    """
    RE Lead Manager System.
    
    Orchestrates property lead capture, agent assignment, and viewing schedules.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.leads: Dict[str, RELead] = {}
        self.viewings: List[Viewing] = []
        logger.info(f"RE Lead Manager initialized for {agency_name}")
    
    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def capture_lead(
        self,
        name: str,
        phone: str,
        email: str,
        source: LeadSource,
        intent: LeadIntent,
        budget: float,
        location: str
    ) -> RELead:
        """Register a new incoming lead into the CRM."""
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")

        lead = RELead(
            id=f"LED-{uuid.uuid4().hex[:6].upper()}",
            name=name, phone=phone, email=email,
            source=source, intent=intent, budget=float(budget),
            location_pref=location
        )
        self.leads[lead.id] = lead
        logger.info(f"Lead captured: {name} (${budget:,.0f} {intent.value})")
        return lead
    
    def schedule_showing(self, lead_id: str, property_id: str, time: datetime) -> Optional[Viewing]:
        """Book a property viewing for a specific lead."""
        if lead_id not in self.leads: return None
        
        v = Viewing(
            id=f"VWG-{uuid.uuid4().hex[:6].upper()}",
            lead_id=lead_id, property_id=property_id, scheduled_at=time
        )
        self.viewings.append(v)
        self.leads[lead_id].status = LeadStatus.VIEWING
        logger.info(f"Viewing scheduled for {lead_id} at {property_id}")
        return v
    
    def format_dashboard(self) -> str:
        """Render the RE Lead Dashboard."""
        active_leads = [l for l in self.leads.values() if l.status != LeadStatus.WON and l.status != LeadStatus.LOST]
        total_pipe = sum(l.budget for l in active_leads)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 RE LEAD MANAGER DASHBOARD{' ' * 31}║",
            f"║  {len(self.leads)} total │ {len(active_leads)} active │ ${total_pipe:,.0f} pipeline value{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SALES PIPELINE                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        # Display latest 5 active leads
        for l in sorted(active_leads, key=lambda x: x.created_at, reverse=True)[:5]:
            icon = {"buy": "🏠", "rent": "🔑", "invest": "💎"}.get(l.intent.value, "📋")
            lines.append(f"║  🆕 {icon} {l.name[:15]:<15} │ ${l.budget:>10,.0f} │ {l.status.value:<12} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Lead]  [📅 Viewings]  [📊 Reports]  [⚙️ Setup]   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Converting!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📋 Initializing RE Lead System...")
    print("=" * 60)
    
    try:
        leads_system = RELeadManager("Saigon Digital Hub")
        # Seed
        leads_system.capture_lead("Nguyen Van A", "090", "a@corp.co", LeadSource.WEBSITE, LeadIntent.BUY, 500000.0, "D2")
        
        print("\n" + leads_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Lead Error: {e}")
