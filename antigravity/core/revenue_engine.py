"""
RevenueEngine - Track and optimize revenue.

Features:
- Invoice management
- Revenue tracking
- Forecasting
- Pricing optimization

🏯 Binh Pháp: Tướng (General) - Leadership metrics
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum


class InvoiceStatus(Enum):
    """Invoice payment status."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Currency(Enum):
    """Supported currencies."""
    USD = "USD"
    VND = "VND"


@dataclass
class Invoice:
    """An invoice record."""
    id: Optional[int] = None
    client_name: str = ""
    amount: float = 0.0
    currency: Currency = Currency.USD
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    paid_date: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    
    def get_amount_vnd(self) -> int:
        """Get amount in VND (1 USD = 24,500 VND)."""
        if self.currency == Currency.VND:
            return int(self.amount)
        return int(self.amount * 24500)


@dataclass
class Forecast:
    """Revenue forecast."""
    month: str
    projected: float
    actual: float = 0.0
    confidence: float = 0.8
    
    def variance(self) -> float:
        """Calculate variance from projection."""
        return self.actual - self.projected


class RevenueEngine:
    """
    Track and optimize revenue.
    
    Example:
        engine = RevenueEngine()
        inv = engine.create_invoice("ABC Corp", 1500)
        engine.mark_paid(inv)
        print(engine.get_mrr())
    """
    
    def __init__(self):
        self.invoices: List[Invoice] = []
        self._next_id = 1
    
    def create_invoice(
        self,
        client_name: str,
        amount: float,
        currency: Currency = Currency.USD,
        notes: str = ""
    ) -> Invoice:
        """Create a new invoice."""
        invoice = Invoice(
            id=self._next_id,
            client_name=client_name,
            amount=amount,
            currency=currency,
            notes=notes
        )
        self.invoices.append(invoice)
        self._next_id += 1
        return invoice
    
    def send_invoice(self, invoice: Invoice) -> Invoice:
        """Mark invoice as sent."""
        invoice.status = InvoiceStatus.SENT
        return invoice
    
    def mark_paid(self, invoice: Invoice) -> Invoice:
        """Mark invoice as paid."""
        invoice.status = InvoiceStatus.PAID
        invoice.paid_date = datetime.now()
        return invoice
    
    def get_total_revenue(self) -> float:
        """Get total revenue from paid invoices (in USD)."""
        return sum(
            inv.amount if inv.currency == Currency.USD else inv.amount / 24500
            for inv in self.invoices
            if inv.status == InvoiceStatus.PAID
        )
    
    def get_mrr(self) -> float:
        """Get Monthly Recurring Revenue estimate."""
        # Simple approach: last 30 days paid invoices
        thirty_days_ago = datetime.now() - timedelta(days=30)
        return sum(
            inv.amount if inv.currency == Currency.USD else inv.amount / 24500
            for inv in self.invoices
            if inv.status == InvoiceStatus.PAID and inv.paid_date and inv.paid_date > thirty_days_ago
        )
    
    def get_arr(self) -> float:
        """Get Annual Recurring Revenue estimate."""
        return self.get_mrr() * 12
    
    def get_outstanding(self) -> float:
        """Get total outstanding (unpaid) amount."""
        return sum(
            inv.amount if inv.currency == Currency.USD else inv.amount / 24500
            for inv in self.invoices
            if inv.status in [InvoiceStatus.SENT, InvoiceStatus.OVERDUE]
        )
    
    def forecast_monthly(self, months: int = 3) -> List[Forecast]:
        """Generate monthly forecast."""
        mrr = self.get_mrr()
        growth_rate = 0.10  # 10% monthly growth assumption
        
        forecasts = []
        current = datetime.now()
        
        for i in range(months):
            month = (current + timedelta(days=30 * (i + 1))).strftime("%Y-%m")
            projected = mrr * ((1 + growth_rate) ** (i + 1))
            forecasts.append(Forecast(month=month, projected=projected))
        
        return forecasts
    
    def get_stats(self) -> Dict:
        """Get revenue statistics."""
        return {
            "total_invoices": len(self.invoices),
            "paid_invoices": len([i for i in self.invoices if i.status == InvoiceStatus.PAID]),
            "total_revenue_usd": self.get_total_revenue(),
            "mrr": self.get_mrr(),
            "arr": self.get_arr(),
            "outstanding": self.get_outstanding()
        }
