"""
Invoice Manager
===============
Handles invoice generation, status tracking, and failed payment recovery.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from backend.core.payments.stripe_client import StripeClient
from backend.services.notification_service import notification_service

logger = logging.getLogger(__name__)

class InvoiceManager:
    """
    Manages invoice logic using StripeClient.
    """

    def __init__(self, db_client: Optional[Session] = None):
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

    async def handle_payment_failed(self, invoice_obj: Dict[str, Any]):
        """
        Handle a failed invoice payment event.
        - Log failure
        - Notify user (via NotificationService)
        - Update local status
        """
        invoice_id = invoice_obj.get('id')
        customer_id = invoice_obj.get('customer')
        amount_due = invoice_obj.get('amount_due', 0)
        currency = invoice_obj.get('currency', 'usd')
        hosted_invoice_url = invoice_obj.get('hosted_invoice_url')

        # Try to find user_id from metadata
        metadata = invoice_obj.get('metadata', {})
        user_id = metadata.get('user_id') or metadata.get('tenant_id')

        logger.warning(f"Payment failed for invoice {invoice_id} (Customer: {customer_id}, Amount: {amount_due})")

        # 1. Trigger notification
        if self.db and user_id:
            try:
                await notification_service.send_payment_failure_notification(
                    db=self.db,
                    user_id=user_id,
                    amount=amount_due / 100.0,
                    currency=currency.upper(),
                    invoice_url=hosted_invoice_url
                )
                logger.info(f"Sent payment failure notification to {user_id}")
            except Exception as e:
                logger.error(f"Failed to send payment failure notification: {e}")
        elif not user_id:
            logger.warning(f"Could not send notification: No user_id found in invoice metadata for {invoice_id}")

        # 2. Update DB record (Placeholder for actual model update)
        if self.db:
            # TODO: Implement actual DB update using SQLAlchemy model
            # invoice = self.db.query(Invoice).filter(Invoice.stripe_invoice_id == invoice_id).first()
            # if invoice:
            #     invoice.status = InvoiceStatus.OPEN # or PAST_DUE
            #     self.db.commit()
            pass

        return {"status": "handled", "action": "notify_user"}

    async def handle_payment_succeeded(self, invoice_obj: Dict[str, Any]):
        """
        Handle successful invoice payment.
        """
        invoice_id = invoice_obj.get('id')
        amount_paid = invoice_obj.get('amount_paid', 0)
        currency = invoice_obj.get('currency', 'usd')

        # Try to find user_id
        metadata = invoice_obj.get('metadata', {})
        user_id = metadata.get('user_id') or metadata.get('tenant_id')

        logger.info(f"Payment succeeded for invoice {invoice_id}")

        if self.db and user_id:
            try:
                await notification_service.send_payment_success_notification(
                    db=self.db,
                    user_id=user_id,
                    amount=amount_paid / 100.0,
                    currency=currency.upper(),
                    transaction_id=invoice_obj.get('payment_intent')
                )
                logger.info(f"Sent payment success notification to {user_id}")
            except Exception as e:
                logger.error(f"Failed to send payment success notification: {e}")

        if self.db:
            # TODO: Update invoice status in DB
            pass

        return {"status": "handled", "action": "record_payment"}
