"""
Revenue Engine core logic.
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .models import Currency, Forecast, Invoice, InvoiceStatus

ARR_TARGET_2026 = 1_000_000

class RevenueEngineLogic:
    def __init__(self):
        self.invoices: List[Invoice] = []
        self._next_id = 1

    def create_invoice(self, client_name: str, amount: float, currency: Currency = Currency.USD, notes: str = "") -> Invoice:
        invoice = Invoice(id=self._next_id, client_name=client_name, amount=amount, currency=currency, notes=notes)
        self.invoices.append(invoice)
        self._next_id += 1
        return invoice

    def get_total_revenue(self) -> float:
        return sum(inv.amount if inv.currency == Currency.USD else inv.amount / 24500 for inv in self.invoices if inv.status == InvoiceStatus.PAID)

    def get_mrr(self) -> float:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        return sum(inv.amount if inv.currency == Currency.USD else inv.amount / 24500 for inv in self.invoices if inv.status == InvoiceStatus.PAID and inv.paid_date and inv.paid_date > thirty_days_ago)

    def get_arr(self) -> float:
        return self.get_mrr() * 12
