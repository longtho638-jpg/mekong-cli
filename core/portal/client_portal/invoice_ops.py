"""
Invoice and Billing operations for the portal.
"""
import logging
from typing import Any, Dict, List, Optional

from .base import BasePortal
from .entities_proxy import Invoice, InvoiceStatus

logger = logging.getLogger(__name__)

class InvoiceOps(BasePortal):
    def create_invoice(
        self,
        client_id: str,
        amount: float,
        items: List[Dict[str, Any]],
        project_id: Optional[str] = None,
        status: InvoiceStatus = InvoiceStatus.DRAFT,
    ) -> Invoice:
        """Tạo invoice mới."""
        errors = self.presenter.validate_invoice_data(amount, items)
        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")

        invoice = self.service.create_invoice_entity(
            client_id=client_id, amount=amount, items=items, project_id=project_id, status=status
        )

        self.invoices[invoice.id] = invoice
        self.repository.save_invoices(self.invoices)
        self.repository.save_stats(self.service.stats)

        if status == InvoiceStatus.PAID and client_id in self.clients:
            self.clients[client_id].total_spent += amount
            self.repository.save_clients(self.clients)

        logger.info(f"Invoice {invoice.id} created for {amount}")
        return invoice

    def get_client_invoices(self, client_id: str) -> List[Invoice]:
        """Lấy invoices của client."""
        return [i for i in self.invoices.values() if i.client_id == client_id]

    def get_all_invoices(self) -> List[Invoice]:
        """Lấy tất cả invoices."""
        return list(self.invoices.values())
