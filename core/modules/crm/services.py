"""
CRM Module - Service Logic
"""

import logging
import uuid
from typing import Any, Dict, List

from .entities import Contact, ContactType, Deal, DealStage

try:
    from core.infrastructure.database import get_db
except (ImportError, ValueError):

    def get_db():
        return None


logger = logging.getLogger(__name__)


class CRMService:
    """
    🎯 The CRM Engine (Service Layer)

    Manages the relationship data and sales velocity metrics.
    """

    # Stage → Win Probability (%)
    STAGE_PROBABILITIES = {
        DealStage.QUALIFIED: 20,
        DealStage.PROPOSAL: 40,
        DealStage.NEGOTIATION: 70,
        DealStage.CLOSED_WON: 100,
        DealStage.CLOSED_LOST: 0,
    }

    HOT_LEAD_THRESHOLD = 70

    def __init__(self, agency_name: str = "Agency OS"):
        self.agency_name = agency_name
        self.db = get_db()
        self.contacts: Dict[str, Contact] = {}
        self.deals: Dict[str, Deal] = {}

        # Load data from DB if available, else seed demo
        if self.db:
            self._load_from_db()
        else:
            self._seed_demo_data()

    def _load_from_db(self):
        """Hydrate state from Supabase."""
        try:
            # Load Contacts
            res = self.db.table("contacts").select("*").execute()
            for record in res.data:
                # Map snake_case DB to model
                contact = Contact(
                    id=record["id"],
                    name=record["name"],
                    email=record["email"],
                    company=record.get("company", ""),
                    phone=record.get("phone", ""),
                    lead_score=record.get("lead_score", 50),
                )
                self.contacts[contact.id] = contact

            # Load Deals
            res_deals = self.db.table("deals").select("*").execute()
            for record in res_deals.data:
                deal = Deal(
                    id=record["id"],
                    contact_id=record["contact_id"],
                    title=record["title"],
                    value=float(record["value"]),
                    stage=DealStage(record["stage"])
                    if record["stage"] in DealStage._value2member_map_
                    else DealStage.QUALIFIED,
                    probability=record.get("probability", 20),
                )
                self.deals[deal.id] = deal

            logger.info(
                f"✅ CRM: Loaded {len(self.contacts)} contacts and {len(self.deals)} deals from DB."
            )
        except Exception as e:
            logger.error(f"❌ CRM Load Error: {e}")
            self._seed_demo_data()  # Fallback

    def _seed_demo_data(self):
        """Pre-populates the system with sample data for training/demo."""
        try:
            c1 = self.add_contact("Anh Minh", "minh@mekong.vn", "Mekong Rice", phone="0901234567")
            self.create_deal(c1.id, "Zalo OA Integration", 2500.0, DealStage.NEGOTIATION)

            c2 = self.add_contact("Chị Lan", "lan@spa.vn", "Lotus Beauty", phone="0907654321")
            c2.lead_score = 85  # Hot Lead
        except Exception:
            pass

    def add_contact(
        self,
        name: str,
        email: str,
        company: str = "",
        ctype: ContactType = ContactType.LEAD,
        phone: str = "",
    ) -> Contact:
        """Adds a new individual or company to the CRM database."""
        cid = f"CON-{uuid.uuid4().hex[:6].upper()}"
        contact = Contact(
            id=cid, name=name, email=email, company=company, phone=phone, contact_type=ctype
        )
        self.contacts[cid] = contact

        # Persist if DB enabled
        if self.db:
            try:
                data = {
                    "id": contact.id,
                    "name": contact.name,
                    "email": contact.email,
                    "company": contact.company,
                    "phone": contact.phone,
                    "contact_type": contact.contact_type.value,
                    "lead_score": contact.lead_score,
                }
                self.db.table("contacts").insert(data).execute()
            except Exception as e:
                logger.error(f"Failed to persist contact: {e}")

        return contact

    def create_deal(
        self, contact_id: str, title: str, value: float, stage: DealStage = DealStage.QUALIFIED
    ) -> Deal:
        """Registers a new sales opportunity for a contact."""
        did = f"DEAL-{uuid.uuid4().hex[:6].upper()}"
        deal = Deal(
            id=did,
            contact_id=contact_id,
            title=title,
            value=value,
            stage=stage,
            probability=self.STAGE_PROBABILITIES.get(stage, 20),
        )
        self.deals[did] = deal
        return deal

    def get_hot_leads(self) -> List[Contact]:
        """Filters contacts for those with high intent (score >= 70)."""
        return [c for c in self.contacts.values() if c.lead_score >= self.HOT_LEAD_THRESHOLD]

    def forecast_revenue(self) -> Dict[str, float]:
        """Calculates total and probability-weighted pipeline value."""
        active = [
            d
            for d in self.deals.values()
            if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
        ]

        total = sum(d.value for d in active)
        weighted = sum(d.value * (d.probability / 100.0) for d in active)

        return {"total_pipeline": total, "weighted_pipeline": weighted}

    def get_summary(self) -> Dict[str, Any]:
        """Aggregate performance summary for the CRM."""
        closed = [
            d
            for d in self.deals.values()
            if d.stage in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
        ]
        won = [d for d in closed if d.stage == DealStage.CLOSED_WON]
        active = [
            d
            for d in self.deals.values()
            if d.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]
        ]

        win_rate = (len(won) / len(closed) * 100) if closed else 0.0

        return {
            "total_contacts": len(self.contacts),
            "contacts_total": len(self.contacts),
            "pipeline_value": sum(d.value for d in active),
            "deal_count": len(self.deals),
            "active_deal_count": len(active),
            "win_rate": win_rate,
        }
