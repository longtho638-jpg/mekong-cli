"""
Invoice Automation engine logic.
"""
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List

from .models import AutoInvoice, InvoiceStatus, InvoiceType, RecurringSchedule


class InvoiceEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.invoices: Dict[str, AutoInvoice] = {}
        self.schedules: Dict[str, RecurringSchedule] = {}

    def create_invoice(self, client: str, amount: float, invoice_type: InvoiceType = InvoiceType.ONE_TIME, due_days: int = 30) -> AutoInvoice:
        invoice = AutoInvoice(id=f"INV-{uuid.uuid4().hex[:6].upper()}", client=client, amount=amount, invoice_type=invoice_type, due_date=datetime.now() + timedelta(days=due_days))
        self.invoices[invoice.id] = invoice
        return invoice

    def setup_recurring(self, client: str, amount: float, frequency: str = "monthly") -> RecurringSchedule:
        schedule = RecurringSchedule(id=f"REC-{uuid.uuid4().hex[:6].upper()}", client=client, amount=amount, frequency=frequency, next_date=datetime.now() + timedelta(days=30))
        self.schedules[schedule.id] = schedule
        return schedule

    def mark_paid(self, invoice_id: str):
        if invoice_id in self.invoices:
            self.invoices[invoice_id].status = InvoiceStatus.PAID
            self.invoices[invoice_id].paid_at = datetime.now()
