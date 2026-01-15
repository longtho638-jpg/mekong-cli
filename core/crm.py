"""
🎯 CRM System - From Lead to Client
====================================

Complete sales pipeline management for the Agency OS. Handles contact 
lifecycle, deal progression, and revenue forecasting.

Features:
- 👥 Contact Management: Tracking leads, prospects, and clients.
- 💼 Deal Pipeline: Moving opportunities through sales stages.
- 📉 Forecasting: Probability-weighted revenue projections.
- 📊 Dashboard: Visual summary of sales health.

Binh Pháp: 🧲 Địa (Earth) - Mastering the terrain of customer relationships.
"""

import uuid
import logging
import re
from typing import Optional, Dict, Any, List, Union, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

try:
    from .db import get_db
except (ImportError, ValueError):
    def get_db(): return None


class ContactType(Enum):
    """Lifecycle stages of a contact."""
    LEAD = "lead"
    PROSPECT = "prospect"
    CLIENT = "client"
    PARTNER = "partner"
    CHURNED = "churned"


class DealStage(Enum):
    """Phases of the sales pipeline."""
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(Enum):
    """Categorization of sales interactions."""
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
    company: str = ""
    phone: str = ""
    contact_type: ContactType = ContactType.LEAD
    created_at: datetime = field(default_factory=datetime.now)
    lead_score: int = 50  # 0-100
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    last_contact: Optional[datetime] = None

    def __post_init__(self):
        if not 0 <= self.lead_score <= 100:
            self.lead_score = 50


@dataclass
class Deal:
    """A specific sales opportunity."""
    id: str
    contact_id: str
    title: str
    value: float
    stage: DealStage
    created_at: datetime = field(default_factory=datetime.now)
    expected_close: Optional[datetime] = None
    probability: int = 20  # 0-100
    notes: str = ""

    def __post_init__(self):
        if self.value < 0: self.value = 0.0
        if not self.expected_close:
            self.expected_close = datetime.now() + timedelta(days=30)


class CRM:
    """
    🎯 The CRM Engine
    
    Manages the relationship data and sales velocity metrics.
    """
    
    # Stage → Win Probability (%)
    STAGE_PROBABILITIES = {
        DealStage.QUALIFIED: 20,
        DealStage.PROPOSAL: 40,
        DealStage.NEGOTIATION: 70,
        DealStage.CLOSED_WON: 100,
        DealStage.CLOSED_LOST: 0
    }
    
    HOT_LEAD_THRESHOLD = 70
    
    def __init__(self, agency_name: str = "Agency OS"):
        self.agency_name = agency_name
        self.db = get_db()
        self.contacts: Dict[str, Contact] = {}
        self.deals: Dict[str, Deal] = {}
        self.activities: List[Dict[str, Any]] = []
        
        self._seed_demo_data()
    
    def _seed_demo_data(self):
        """Pre-populates the system with sample data for training/demo."""
        try:
            c1 = self.add_contact("Anh Minh", "minh@mekong.vn", "Mekong Rice", phone="0901234567")
            self.create_deal(c1.id, "Zalo OA Integration", 2500.0, DealStage.NEGOTIATION)
            
            c2 = self.add_contact("Chị Lan", "lan@spa.vn", "Lotus Beauty", phone="0907654321")
            c2.lead_score = 85 # Hot Lead
        except Exception: pass

    def add_contact(
        self, 
        name: str, 
        email: str, 
        company: str = "", 
        ctype: ContactType = ContactType.LEAD,
        phone: str = ""
    ) -> Contact:
        """Adds a new individual or company to the CRM database."""
        cid = f"CON-{uuid.uuid4().hex[:6].upper()}"
        contact = Contact(
            id=cid, name=name, email=email, 
            company=company, phone=phone,
            contact_type=ctype
        )
        self.contacts[cid] = contact
        return contact
    
    def create_deal(
        self, 
        contact_id: str, 
        title: str, 
        value: float, 
        stage: DealStage = DealStage.QUALIFIED
    ) -> Deal:
        """Registers a new sales opportunity for a contact."""
        did = f"DEAL-{uuid.uuid4().hex[:6].upper()}"
        deal = Deal(
            id=did, contact_id=contact_id, title=title, 
            value=value, stage=stage,
            probability=self.STAGE_PROBABILITIES.get(stage, 20)
        )
        self.deals[did] = deal
        return deal
    
    def get_hot_leads(self) -> List[Contact]:
        """Filters contacts for those with high intent (score >= 70)."""
        return [c for c in self.contacts.values() if c.lead_score >= self.HOT_LEAD_THRESHOLD]
    
    def forecast_revenue(self) -> Dict[str, float]:
        """Calculates total and probability-weighted pipeline value."""
        active = [d for d in self.deals.values() if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]
        
        total = sum(d.value for d in active)
        weighted = sum(d.value * (d.probability / 100.0) for d in active)
        
        return {
            "total_pipeline": total,
            "weighted_pipeline": weighted
        }

    def get_summary(self) -> Dict[str, Any]:
        """Aggregate performance summary for the CRM."""
        closed = [d for d in self.deals.values() if d.stage in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]
        won = [d for d in closed if d.stage == DealStage.CLOSED_WON]
        active = [d for d in self.deals.values() if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]
        
        win_rate = (len(won) / len(closed) * 100) if closed else 0.0
        
        return {
            "total_contacts": len(self.contacts),
            "contacts_total": len(self.contacts), # Legacy key support
            "pipeline_value": sum(d.value for d in active),
            "deal_count": len(self.deals),
            "active_deal_count": len(active),
            "win_rate": win_rate
        }


class CRMPresenter:
    """Handles visual formatting of CRM data."""
    
    @staticmethod
    def format_pipeline_text(crm: CRM) -> str:
        """Renders a text-based pipeline overview."""
        summary = crm.get_summary()
        forecast = crm.forecast_revenue()
        
        lines = [
            "╔" + "═" * 50 + "╗",
            "║" + "🎯 SALES PIPELINE OVERVIEW".center(50) + "║",
            "╠" + "═" * 50 + "╣",
            f"║  CONTACTS TOTAL : {summary['total_contacts']:<28} ║",
            f"║  ACTIVE DEALS   : {summary['active_deal_count']:<28} ║",
            f"║  WIN RATE       : {summary['win_rate']:>5.1f}%{' ' * 22} ║",
            "╟" + "─" * 50 + "╢",
            f"║  PIPELINE VALUE : ${summary['pipeline_value']:>12,.0f}{' ' * 15} ║",
            f"║  WEIGHTED FORECAST: ${forecast['weighted_pipeline']:>12,.0f}{' ' * 11} ║",
            "╚" + "═" * 50 + "╝"
        ]
        return "\n".join(lines)


if __name__ == "__main__":
    system = CRM()
    print(CRMPresenter.format_pipeline_text(system))