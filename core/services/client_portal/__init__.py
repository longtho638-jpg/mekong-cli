"""
Client Portal Service Facade.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .entities import EntityFactory
from .models import (
    Client,
    ClientStatus,
    Invoice,
    InvoiceStatus,
    Message,
    Project,
    ProjectStatus,
    ProjectTask,
    TaskStatus,
)
from .stats import StatsManager

logger = logging.getLogger(__name__)

class ClientPortalService(EntityFactory, StatsManager):
    """Core service cho client portal business logic."""

    def __init__(self, agency_name: str = "Nova Digital"):
        EntityFactory.__init__(self)
        StatsManager.__init__(self)
        self.agency_name = agency_name
        logger.info(f"Client Portal service initialized for {agency_name}")

    def create_invoice_entity(
        self,
        client_id: str,
        amount: float,
        items: List[Dict[str, Any]],
        project_id: Optional[str] = None,
        status: InvoiceStatus = InvoiceStatus.DRAFT,
    ) -> Invoice:
        """Tạo invoice entity mới."""
        if amount < 0:
            raise ValueError("Amount cannot be negative")

        invoice = Invoice(
            id=self.generate_invoice_id(),
            client_id=client_id,
            project_id=project_id,
            amount=amount,
            status=status,
            due_date=datetime.now() + timedelta(days=30),
            items=items,
        )

        self.stats["total_invoiced"] += amount
        if status == InvoiceStatus.PAID:
            invoice.paid_date = datetime.now()
            self.stats["total_collected"] += amount

        return invoice

    def create_message_entity(
        self, client_id: str, content: str, sender: str = "agency"
    ) -> Message:
        """Tạo message entity mới."""
        return Message(
            id=self.generate_message_id(), client_id=client_id, sender=sender, content=content
        )
