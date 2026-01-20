"""
Healthcare Marketing Engine logic.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from .models import (
    CampaignType,
    ComplianceStatus,
    HealthcareCampaign,
    HealthcareClient,
    HealthcareVertical,
    HIPAAChecklist,
)

logger = logging.getLogger(__name__)

class HealthcareEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.clients: Dict[str, HealthcareClient] = {}
        self.campaigns: Dict[str, HealthcareCampaign] = {}
        self.checklists: Dict[str, HIPAAChecklist] = {}

    def add_client(
        self, name: str, vertical: HealthcareVertical, monthly_retainer: float = 0.0
    ) -> HealthcareClient:
        """Register a new medical provider as a client."""
        if not name:
            raise ValueError("Client name required")

        client = HealthcareClient(
            id=f"HCC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            vertical=vertical,
            monthly_retainer=monthly_retainer,
        )
        self.clients[client.id] = client
        logger.info(f"Healthcare client added: {name} ({vertical.value})")
        return client

    def create_hipaa_checklist(self, client_id: str) -> Optional[HIPAAChecklist]:
        """Initialize a HIPAA audit checklist for a client."""
        if client_id not in self.clients:
            return None

        c = self.clients[client_id]
        checklist = HIPAAChecklist(
            id=f"HIP-{uuid.uuid4().hex[:6].upper()}",
            client_name=c.name,
            items={"BAA signed": False, "PHI handling reviewed": False, "Data encrypted": False},
        )
        self.checklists[checklist.id] = checklist
        logger.debug(f"HIPAA checklist created for {c.name}")
        return checklist

    def update_checklist(self, checklist_id: str, item: str, done: bool) -> bool:
        """Update a specific HIPAA requirement status."""
        if checklist_id not in self.checklists:
            return False

        c = self.checklists[checklist_id]
        c.items[item] = done

        completed = sum(1 for v in c.items.values() if v)
        total = len(c.items)
        if completed == total:
            c.status = ComplianceStatus.COMPLIANT
        elif completed > 0:
            c.status = ComplianceStatus.IN_PROGRESS

        c.last_reviewed = datetime.now()
        logger.info(f"HIPAA Item Updated: {item} -> {done}")
        return True
