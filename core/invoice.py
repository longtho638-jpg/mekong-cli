"""
💳 Invoice System - Professional Billing
==========================================

Invoice generation and payment tracking for agency clients.

Features:
- Professional invoice generation
- Payment status tracking
- Multi-currency support
- Automated reminders
"""

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum


class InvoiceStatus(Enum):
    """Invoice status."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Currency(Enum):
    """Supported currencies."""
    USD = "USD"
    VND = "VND"
    JPY = "JPY"
    KRW = "KRW"


@dataclass
class InvoiceItem:
    """A line item on an invoice."""
    description: str
    quantity: int
    unit_price: float
    
    @property
    def total(self) -> float:
        return self.quantity * self.unit_price


@dataclass
class Invoice:
    """An invoice for a client."""
    id: str
    client_id: str
    client_name: str
    items: List[InvoiceItem]
    currency: Currency
    status: InvoiceStatus
    created_at: datetime
    due_date: datetime
    paid_at: Optional[datetime] = None
    notes: str = ""
    
    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)
    
    @property
    def tax_rate(self) -> float:
        return 0.10  # 10% VAT
    
    @property
    def tax(self) -> float:
        return self.subtotal * self.tax_rate
    
    @property
    def total(self) -> float:
        return self.subtotal + self.tax


class InvoiceSystem:
    """
    Invoice and Payment System.
    
    Generate professional invoices and track payments.
    """
    
    def __init__(self):
        self.invoices: Dict[str, Invoice] = {}
        
        # Currency symbols
        self.symbols = {
            Currency.USD: "$",
            Currency.VND: "₫",
            Currency.JPY: "¥",
            Currency.KRW: "₩"
        }
        
        # Exchange rates (to USD)
        self.rates = {
            Currency.USD: 1.0,
            Currency.VND: 24500,
            Currency.JPY: 150,
            Currency.KRW: 1300
        }
        
        # Create demo invoices
        self._create_demo_data()
    
    def _create_demo_data(self):
        """Create demo invoices."""
        # Demo invoice 1: USD
        self.create_invoice(
            client_id="CL-001",
            client_name="Saigon Coffee Co.",
            items=[
                InvoiceItem("SEO Monthly Retainer", 1, 500),
                InvoiceItem("Content Writing (5 posts)", 5, 100),
                InvoiceItem("Technical Audit", 1, 300),
            ],
            currency=Currency.USD
        )
        
        # Demo invoice 2: VND
        self.create_invoice(
            client_id="CL-002",
            client_name="Hanoi Tech Startup",
            items=[
                InvoiceItem("Website Development", 1, 25000000),
                InvoiceItem("SEO Setup", 1, 5000000),
            ],
            currency=Currency.VND
        )
    
    def create_invoice(
        self,
        client_id: str,
        client_name: str,
        items: List[InvoiceItem],
        currency: Currency = Currency.USD,
        due_days: int = 30
    ) -> Invoice:
        """Create a new invoice."""
        invoice = Invoice(
            id=f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}",
            client_id=client_id,
            client_name=client_name,
            items=items,
            currency=currency,
            status=InvoiceStatus.DRAFT,
            created_at=datetime.now(),
            due_date=datetime.now() + timedelta(days=due_days)
        )
        
        self.invoices[invoice.id] = invoice
        return invoice
    
    def mark_paid(self, invoice_id: str) -> bool:
        """Mark invoice as paid."""
        if invoice_id not in self.invoices:
            return False
        
        self.invoices[invoice_id].status = InvoiceStatus.PAID
        self.invoices[invoice_id].paid_at = datetime.now()
        return True
    
    def format_currency(self, amount: float, currency: Currency) -> str:
        """Format amount with currency symbol."""
        symbol = self.symbols[currency]
        
        if currency == Currency.VND:
            return f"{amount:,.0f}{symbol}"
        elif currency in [Currency.JPY, Currency.KRW]:
            return f"{symbol}{amount:,.0f}"
        else:
            return f"{symbol}{amount:,.2f}"
    
    def format_invoice(self, invoice: Invoice) -> str:
        """Format invoice as ASCII."""
        currency = invoice.currency
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🏯 AGENCY OS - INVOICE                                   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Invoice: {invoice.id:<20}                     ║",
            f"║  Date: {invoice.created_at.strftime('%Y-%m-%d'):<23}                     ║",
            f"║  Due: {invoice.due_date.strftime('%Y-%m-%d'):<24}                     ║",
            f"║  Status: {invoice.status.value.upper():<21}                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Bill To: {invoice.client_name:<20}                     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ITEMS                                            AMOUNT  ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for item in invoice.items:
            desc = item.description[:35]
            amount = self.format_currency(item.total, currency)
            lines.append(f"║  {desc:<35} {amount:>15}  ║")
        
        lines.extend([
            "║  ─────────────────────────────────────────────────────── ║",
            f"║  Subtotal:                               {self.format_currency(invoice.subtotal, currency):>15}  ║",
            f"║  Tax (10%):                              {self.format_currency(invoice.tax, currency):>15}  ║",
            f"║  TOTAL:                                  {self.format_currency(invoice.total, currency):>15}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get invoice summary."""
        total_invoices = len(self.invoices)
        paid = sum(1 for i in self.invoices.values() if i.status == InvoiceStatus.PAID)
        pending = sum(1 for i in self.invoices.values() if i.status in [InvoiceStatus.SENT, InvoiceStatus.DRAFT])
        
        # Calculate totals in USD
        total_value = 0
        for inv in self.invoices.values():
            rate = self.rates[inv.currency]
            total_value += inv.total / rate
        
        return {
            "total_invoices": total_invoices,
            "paid": paid,
            "pending": pending,
            "total_value_usd": f"${total_value:,.2f}"
        }


# Example usage
if __name__ == "__main__":
    system = InvoiceSystem()
    
    print("💳 Invoice System")
    print("=" * 50)
    print()
    
    # Show summary
    summary = system.get_summary()
    print("📊 Summary:")
    print(f"   Total Invoices: {summary['total_invoices']}")
    print(f"   Paid: {summary['paid']}")
    print(f"   Pending: {summary['pending']}")
    print(f"   Total Value: {summary['total_value_usd']}")
    print()
    
    # Show first invoice
    invoice = list(system.invoices.values())[0]
    print(system.format_invoice(invoice))
