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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class LeadSource(Enum):
    """Lead sources."""
    WEBSITE = "website"
    PORTAL = "portal"  # batdongsan, etc.
    REFERRAL = "referral"
    SOCIAL = "social"
    WALK_IN = "walk_in"
    AD = "ad"


class LeadStatus(Enum):
    """Lead status."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    VIEWING = "viewing"
    NEGOTIATING = "negotiating"
    WON = "won"
    LOST = "lost"


class LeadIntent(Enum):
    """Lead intent."""
    BUY = "buy"
    SELL = "sell"
    RENT = "rent"
    LEASE = "lease"
    INVEST = "invest"


@dataclass
class RELead:
    """A real estate lead."""
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


@dataclass
class Viewing:
    """A property viewing."""
    id: str
    lead_id: str
    property_id: str
    scheduled_at: datetime
    completed: bool = False
    feedback: str = ""


class RELeadManager:
    """
    Real Estate Lead Manager.
    
    Manage leads and conversions.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.leads: Dict[str, RELead] = {}
        self.viewings: List[Viewing] = []
    
    def capture_lead(
        self,
        name: str,
        phone: str,
        email: str,
        source: LeadSource,
        intent: LeadIntent,
        budget: float,
        location: str,
        property_type: str = ""
    ) -> RELead:
        """Capture a new lead."""
        lead = RELead(
            id=f"LED-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            phone=phone,
            email=email,
            source=source,
            intent=intent,
            budget=budget,
            location_pref=location,
            property_type=property_type
        )
        self.leads[lead.id] = lead
        return lead
    
    def assign_lead(self, lead: RELead, agent: str):
        """Assign lead to agent."""
        lead.assigned_to = agent
    
    def update_status(self, lead: RELead, status: LeadStatus):
        """Update lead status."""
        lead.status = status
        lead.last_contact = datetime.now()
    
    def add_note(self, lead: RELead, note: str):
        """Add note to lead."""
        lead.notes.append(f"[{datetime.now().strftime('%Y-%m-%d')}] {note}")
    
    def schedule_viewing(
        self,
        lead: RELead,
        property_id: str,
        scheduled: datetime
    ) -> Viewing:
        """Schedule a viewing."""
        viewing = Viewing(
            id=f"VWG-{uuid.uuid4().hex[:6].upper()}",
            lead_id=lead.id,
            property_id=property_id,
            scheduled_at=scheduled
        )
        self.viewings.append(viewing)
        lead.status = LeadStatus.VIEWING
        return viewing
    
    def get_stats(self) -> Dict[str, Any]:
        """Get lead statistics."""
        by_status = {}
        for status in LeadStatus:
            by_status[status.value] = sum(1 for l in self.leads.values() if l.status == status)
        
        won = by_status.get("won", 0)
        total = len(self.leads)
        conversion = (won / total * 100) if total else 0
        
        pipeline_value = sum(l.budget for l in self.leads.values() 
                            if l.status not in [LeadStatus.WON, LeadStatus.LOST])
        
        return {
            "total": total,
            "by_status": by_status,
            "conversion_rate": conversion,
            "pipeline_value": pipeline_value,
            "viewings": len(self.viewings)
        }
    
    def format_dashboard(self) -> str:
        """Format lead manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📋 RE LEAD MANAGER                                       ║",
            f"║  {stats['total']} leads │ ${stats['pipeline_value']:,.0f} pipeline │ {stats['conversion_rate']:.0f}% CVR  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 LEAD PIPELINE                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"new": "🆕", "contacted": "📞", "qualified": "✅",
                       "viewing": "👁️", "negotiating": "🤝", "won": "🏆", "lost": "❌"}
        
        for status in [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED, 
                      LeadStatus.VIEWING, LeadStatus.NEGOTIATING]:
            count = stats['by_status'].get(status.value, 0)
            icon = status_icons.get(status.value, "⚪")
            value = sum(l.budget for l in self.leads.values() if l.status == status)
            lines.append(f"║    {icon} {status.value.title():<12} │ {count:>3} leads │ ${value:>12,.0f}   ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT LEADS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        intent_icons = {"buy": "🏠", "sell": "💰", "rent": "🔑", "lease": "📄", "invest": "💎"}
        
        for lead in list(self.leads.values())[-4:]:
            s_icon = status_icons.get(lead.status.value, "⚪")
            i_icon = intent_icons.get(lead.intent.value, "🏠")
            
            lines.append(f"║  {s_icon} {i_icon} {lead.name[:15]:<15} │ ${lead.budget:>10,.0f} │ {lead.location_pref[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 BY SOURCE                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        source_icons = {"website": "🌐", "portal": "📱", "referral": "👋",
                       "social": "📘", "walk_in": "🚶", "ad": "📢"}
        
        for source in list(LeadSource)[:4]:
            count = sum(1 for l in self.leads.values() if l.source == source)
            icon = source_icons.get(source.value, "📋")
            lines.append(f"║    {icon} {source.value.title():<12} │ {count:>3} leads                     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Lead]  [📅 Viewings]  [📊 Reports]               ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Leads that convert!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    leads = RELeadManager("Saigon Digital Hub")
    
    print("📋 RE Lead Manager")
    print("=" * 60)
    print()
    
    l1 = leads.capture_lead("Nguyen Van A", "0901234567", "a@email.com", LeadSource.WEBSITE, LeadIntent.BUY, 500000, "District 2", "Villa")
    l2 = leads.capture_lead("Tran Thi B", "0907654321", "b@email.com", LeadSource.PORTAL, LeadIntent.RENT, 2000, "District 7", "Apartment")
    l3 = leads.capture_lead("John Smith", "0909999999", "john@email.com", LeadSource.REFERRAL, LeadIntent.INVEST, 1000000, "District 1")
    
    leads.assign_lead(l1, "Agent Alex")
    leads.update_status(l1, LeadStatus.QUALIFIED)
    leads.add_note(l1, "Interested in 5-bed villa, budget flexible")
    
    leads.update_status(l2, LeadStatus.VIEWING)
    leads.schedule_viewing(l2, "LST-001", datetime.now() + timedelta(days=2))
    
    print(leads.format_dashboard())
