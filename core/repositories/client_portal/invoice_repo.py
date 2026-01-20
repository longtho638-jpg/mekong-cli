"""
Billing and Invoice database operations.
"""
import json
import logging
from datetime import datetime
from typing import Dict

from .base import BaseRepository

try:
    from ...services.client_portal_service import Invoice, InvoiceStatus
except ImportError:
    from services.client_portal_service import Invoice, InvoiceStatus

logger = logging.getLogger(__name__)

class InvoiceRepo(BaseRepository):
    def save_invoices(self, invoices: Dict[str, Invoice]) -> bool:
        """Lưu danh sách invoices."""
        try:
            data = {}
            for invoice_id, invoice in invoices.items():
                data[invoice_id] = {
                    "id": invoice.id,
                    "client_id": invoice.client_id,
                    "project_id": invoice.project_id,
                    "amount": invoice.amount,
                    "status": invoice.status.value,
                    "due_date": invoice.due_date.isoformat(),
                    "paid_date": invoice.paid_date.isoformat() if invoice.paid_date else None,
                    "items": invoice.items,
                    "notes": invoice.notes,
                }

            with open(self.invoices_file, "w") as f:
                json.dump(data, f, indent=2)

            logger.info(f"Saved {len(invoices)} invoices")
            return True
        except Exception as e:
            logger.error(f"Failed to save invoices: {e}")
            return False

    def load_invoices(self) -> Dict[str, Invoice]:
        """Tải danh sách invoices."""
        try:
            if not self.invoices_file.exists():
                return {}

            with open(self.invoices_file, "r") as f:
                data = json.load(f)

            invoices = {}
            for invoice_id, invoice_data in data.items():
                invoice = Invoice(
                    id=invoice_data["id"],
                    client_id=invoice_data["client_id"],
                    project_id=invoice_data.get("project_id"),
                    amount=invoice_data["amount"],
                    status=InvoiceStatus(invoice_data["status"]),
                    due_date=datetime.fromisoformat(invoice_data["due_date"]),
                    paid_date=datetime.fromisoformat(invoice_data["paid_date"])
                    if invoice_data.get("paid_date")
                    else None,
                    items=invoice_data.get("items", []),
                    notes=invoice_data.get("notes", ""),
                )
                invoices[invoice_id] = invoice

            logger.info(f"Loaded {len(invoices)} invoices")
            return invoices
        except Exception as e:
            logger.error(f"Failed to load invoices: {e}")
            return {}
