"""
🏥 Healthcare Marketing - Medical Client Specialist
=====================================================

Marketing for healthcare industry clients.
HIPAA-compliant digital marketing!

Features:
- HIPAA compliance checklist
- Healthcare content calendar
- Medical client campaigns
- Patient acquisition funnels
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ComplianceStatus(Enum):
    """Compliance status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLIANT = "compliant"
    NEEDS_REVIEW = "needs_review"


class HealthcareVertical(Enum):
    """Healthcare verticals."""
    DENTAL = "dental"
    MEDICAL = "medical"
    MENTAL_HEALTH = "mental_health"
    CHIROPRACTIC = "chiropractic"
    WELLNESS = "wellness"
    PHARMACY = "pharmacy"


class CampaignType(Enum):
    """Campaign types for healthcare."""
    PATIENT_ACQUISITION = "patient_acquisition"
    BRAND_AWARENESS = "brand_awareness"
    SERVICE_PROMOTION = "service_promotion"
    COMMUNITY_OUTREACH = "community_outreach"


@dataclass
class HIPAAChecklist:
    """HIPAA compliance checklist."""
    id: str
    client_name: str
    items: Dict[str, bool] = field(default_factory=dict)
    status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    last_reviewed: Optional[datetime] = None


@dataclass
class HealthcareClient:
    """A healthcare industry client."""
    id: str
    name: str
    vertical: HealthcareVertical
    hipaa_status: ComplianceStatus = ComplianceStatus.NOT_STARTED
    campaigns: List[str] = field(default_factory=list)
    monthly_retainer: float = 0


@dataclass
class HealthcareCampaign:
    """A healthcare marketing campaign."""
    id: str
    client_id: str
    name: str
    campaign_type: CampaignType
    hipaa_approved: bool = False
    budget: float = 0
    patient_leads: int = 0
    start_date: Optional[datetime] = None


class HealthcareMarketing:
    """
    Healthcare Marketing.
    
    Compliant medical industry marketing.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, HealthcareClient] = {}
        self.campaigns: Dict[str, HealthcareCampaign] = {}
        self.checklists: Dict[str, HIPAAChecklist] = {}
        
        self._init_demo_data()
    
    def _get_default_hipaa_items(self) -> Dict[str, bool]:
        """Get default HIPAA checklist items."""
        return {
            "BAA signed": False,
            "PHI handling reviewed": False,
            "Ad copy approved": False,
            "Landing page compliant": False,
            "Form data encrypted": False,
            "Privacy policy updated": False,
            "Staff training complete": False,
        }
    
    def _init_demo_data(self):
        """Initialize demo data."""
        clients = [
            ("Smile Dental Clinic", HealthcareVertical.DENTAL, 3000),
            ("Mind Matters Therapy", HealthcareVertical.MENTAL_HEALTH, 2500),
            ("City Medical Center", HealthcareVertical.MEDICAL, 5000),
        ]
        
        for name, vertical, retainer in clients:
            client = self.add_client(name, vertical, retainer)
            self.create_hipaa_checklist(client)
    
    def add_client(
        self,
        name: str,
        vertical: HealthcareVertical,
        monthly_retainer: float = 0
    ) -> HealthcareClient:
        """Add a healthcare client."""
        client = HealthcareClient(
            id=f"HCC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            vertical=vertical,
            monthly_retainer=monthly_retainer
        )
        self.clients[client.id] = client
        return client
    
    def create_hipaa_checklist(self, client: HealthcareClient) -> HIPAAChecklist:
        """Create HIPAA checklist for client."""
        checklist = HIPAAChecklist(
            id=f"HIP-{uuid.uuid4().hex[:6].upper()}",
            client_name=client.name,
            items=self._get_default_hipaa_items()
        )
        self.checklists[checklist.id] = checklist
        return checklist
    
    def update_checklist_item(self, checklist: HIPAAChecklist, item: str, completed: bool):
        """Update checklist item."""
        if item in checklist.items:
            checklist.items[item] = completed
            
            # Update overall status
            completed_count = sum(checklist.items.values())
            total = len(checklist.items)
            
            if completed_count == 0:
                checklist.status = ComplianceStatus.NOT_STARTED
            elif completed_count == total:
                checklist.status = ComplianceStatus.COMPLIANT
            else:
                checklist.status = ComplianceStatus.IN_PROGRESS
    
    def create_campaign(
        self,
        client: HealthcareClient,
        name: str,
        campaign_type: CampaignType,
        budget: float
    ) -> HealthcareCampaign:
        """Create a healthcare campaign."""
        campaign = HealthcareCampaign(
            id=f"HCM-{uuid.uuid4().hex[:6].upper()}",
            client_id=client.id,
            name=name,
            campaign_type=campaign_type,
            budget=budget,
            start_date=datetime.now()
        )
        self.campaigns[campaign.id] = campaign
        client.campaigns.append(campaign.id)
        return campaign
    
    def get_stats(self) -> Dict[str, Any]:
        """Get healthcare marketing statistics."""
        total_retainer = sum(c.monthly_retainer for c in self.clients.values())
        compliant = sum(1 for c in self.checklists.values() 
                       if c.status == ComplianceStatus.COMPLIANT)
        total_leads = sum(c.patient_leads for c in self.campaigns.values())
        
        return {
            "clients": len(self.clients),
            "campaigns": len(self.campaigns),
            "monthly_retainer": total_retainer,
            "compliant_clients": compliant,
            "compliance_rate": (compliant / len(self.clients) * 100) if self.clients else 0,
            "patient_leads": total_leads
        }
    
    def format_dashboard(self) -> str:
        """Format healthcare marketing dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏥 HEALTHCARE MARKETING                                  ║",
            f"║  {stats['clients']} clients │ ${stats['monthly_retainer']:,.0f}/mo │ {stats['compliance_rate']:.0f}% HIPAA  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏥 HEALTHCARE CLIENTS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        vertical_icons = {"dental": "🦷", "medical": "🏥", "mental_health": "🧠",
                         "chiropractic": "🦴", "wellness": "🧘", "pharmacy": "💊"}
        status_icons = {"not_started": "⚪", "in_progress": "🟡",
                       "compliant": "🟢", "needs_review": "🟠"}
        
        for client in list(self.clients.values())[:4]:
            v_icon = vertical_icons.get(client.vertical.value, "🏥")
            s_icon = status_icons.get(client.hipaa_status.value, "⚪")
            lines.append(f"║    {v_icon} {s_icon} {client.name[:20]:<20} │ ${client.monthly_retainer:>6,.0f}/mo  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 HIPAA COMPLIANCE                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for checklist in list(self.checklists.values())[:3]:
            completed = sum(checklist.items.values())
            total = len(checklist.items)
            pct = (completed / total * 100) if total else 0
            s_icon = status_icons.get(checklist.status.value, "⚪")
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            lines.append(f"║    {s_icon} {checklist.client_name[:16]:<16} │ {bar} │ {pct:>3.0f}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 HEALTHCARE KEYWORDS                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    🔍 \"dentist near me\" │ \"family doctor\" │ \"therapy\"    ║",
            "║    🔍 \"urgent care\" │ \"mental health\" │ \"chiropractor\"   ║",
            "║                                                           ║",
            "║  [🏥 Clients]  [📋 HIPAA]  [📢 Campaigns]                 ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Healthy marketing!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hm = HealthcareMarketing("Saigon Digital Hub")
    
    print("🏥 Healthcare Marketing")
    print("=" * 60)
    print()
    
    # Complete some HIPAA items
    for checklist in list(hm.checklists.values())[:1]:
        hm.update_checklist_item(checklist, "BAA signed", True)
        hm.update_checklist_item(checklist, "PHI handling reviewed", True)
        hm.update_checklist_item(checklist, "Ad copy approved", True)
    
    print(hm.format_dashboard())
