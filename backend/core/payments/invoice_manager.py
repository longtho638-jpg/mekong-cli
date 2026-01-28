"""
Invoice Manager
===============
Handles invoice generation, status tracking, and failed payment recovery.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.core.payments.stripe_client import StripeClient

logger = logging.getLogger(__name__)

class InvoiceManager:
    """
    Manages invoice logic using StripeClient.
    """

    def __init__(self, db_client=None):
        self.stripe = StripeClient()
        self.db = db_client

    def list_customer_invoices(self, customer_id: str) -> List[Dict[str, Any]]:
        """List invoices for a specific customer."""
        invoices = self.stripe.list_invoices(customer_id)

        # Format for internal consumption
        formatted = []
        for inv in invoices:
            formatted.append({
                "id": inv.id,
                "number": inv.number,
                "amount_due": inv.amount_due / 100,
                "amount_paid": inv.amount_paid / 100,
                "amount_remaining": inv.amount_remaining / 100,
                "currency": inv.currency,
                "status": inv.status,
                "created": datetime.fromtimestamp(inv.created),
                "due_date": datetime.fromtimestamp(inv.due_date) if inv.due_date else None,
                "pdf_url": inv.invoice_pdf,
                "hosted_url": inv.hosted_invoice_url
            })
        return formatted

    def handle_payment_failed(self, invoice_obj: Dict[str, Any]):
        """
        Handle a failed invoice payment event.
        - Log failure
        - Notify user (via email logic typically)
        - Update local status
        """
        invoice_id = invoice_obj.get('id')
        customer_id = invoice_obj.get('customer')
        amount_due = invoice_obj.get('amount_due')

        logger.warning(f"Payment failed for invoice {invoice_id} (Customer: {customer_id}, Amount: {amount_due})")

        # In a real system:
        # 1. Update DB record for invoice to 'failed'
        # 2. Trigger dunning email via NotificationService

        if self.db:
            # self.db.table('invoices').update({'status': 'failed'}).eq('stripe_invoice_id', invoice_id).execute()
            pass

        return {"status": "handled", "action": "notify_user"}

    def handle_payment_succeeded(self, invoice_obj: Dict[str, Any]):
        """
        Handle successful invoice payment.
        """
        invoice_id = invoice_obj.get('id')
        # customer_id = invoice_obj.get('customer')

        logger.info(f"Payment succeeded for invoice {invoice_id}")

        if self.db:
            # self.db.table('invoices').update({'status': 'paid'}).eq('stripe_invoice_id', invoice_id).execute()
            pass

        return {"status": "handled", "action": "record_payment"}
