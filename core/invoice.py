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
import logging
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class InvoiceStatus(Enum):
    """Lifecycle status of a billable invoice."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Currency(Enum):
    """Supported transaction currencies."""
    USD = "USD"
    VND = "VND"
    JPY = "JPY"
    KRW = "KRW"


@dataclass
class InvoiceItem:
    """A single line item record on an invoice."""
    description: str
    quantity: int
    unit_price: float
    
    @property
    def total(self) -> float:
        """Calculate line item total."""
        return float(self.quantity * self.unit_price)


@dataclass
class Invoice:
    """An invoice entity record."""
    id: str
    client_id: str
    client_name: str
    items: List[InvoiceItem]
    currency: Currency
    status: InvoiceStatus = InvoiceStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.now)
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    paid_at: Optional[datetime] = None
    notes: str = ""
    
    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)
    
    @property
    def tax(self) -> float:
        return self.subtotal * 0.10  # 10% Standard VAT
    
    @property
    def total(self) -> float:
        return self.subtotal + self.tax


class InvoiceSystem:
    """
    Invoice and Billing System.
    
    Manages professional client billing, tax calculation, and payment reconciliation.
    """
    
    def __init__(self, agency_name: str = "My Agency"):
        self.agency_name = agency_name
        self.invoices: Dict[str, Invoice] = {}
        logger.info(f"Invoice System initialized for {agency_name}")
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Seed the system with sample invoices."""
        logger.info("Loading demo invoice data...")
        try:
            self.create_invoice("C1", "Acme Corp", [InvoiceItem("SEO Monthly", 1, 1500.0)])
        except Exception as e:
            logger.error(f"Demo data error: {e}")
    
    def create_invoice(
        self,
        client_id: str,
        client_name: str,
        items: List[InvoiceItem],
        currency: Currency = Currency.USD
    ) -> Invoice:
        """Register a new billable invoice."""
        if not items:
            raise ValueError("Invoice must contain at least one item")

        inv = Invoice(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id, client_name=client_name,
            items=items, currency=currency
        )
        self.invoices[inv.id] = inv
        logger.info(f"Invoice generated: {inv.id} for {client_name}")
        return inv
    
    def format_invoice_ascii(self, inv_id: str) -> str:
        """Render a specific invoice as a professional text document."""
        if inv_id not in self.invoices: return "Invoice not found."
        
        inv = self.invoices[inv_id]
        sym = {"USD": "$", "VND": "₫"}.get(inv.currency.value, "$")
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏯 {self.agency_name.upper()[:30]:<30} INVOICE  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  ID: {inv.id:<20} │ Date: {inv.created_at.strftime('%Y-%m-%d')} ║",
            f"║  To: {inv.client_name:<20} │ Status: {inv.status.value.upper():<10} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  ITEM DESCRIPTION                      QTY      TOTAL     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for item in inv.items:
            lines.append(f"║  • {item.description[:30]:<30} {item.quantity:>3}  {sym}{item.total:>10,.0f} ║")
            
        lines.extend([
            "║  ───────────────────────────────────────────────────────  ║",
            f"║  Subtotal: {sym}{inv.subtotal:>15,.0f} {' ' * 28}║",
            f"║  VAT (10%): {sym}{inv.tax:>14,.0f} {' ' * 28}║",
            f"║  TOTAL DUE: {sym}{inv.total:>14,.0f} {' ' * 28}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  [💳 Pay Online]  [📥 Download PDF]  [📧 Send Reminder]   ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("💳 Initializing Invoice System...")
    print("=" * 60)
    
    try:
        sys = InvoiceSystem("Saigon Digital Hub")
        # Display first demo
        if sys.invoices:
            iid = list(sys.invoices.keys())[0]
            print("\n" + sys.format_invoice_ascii(iid))
            
    except Exception as e:
        logger.error(f"Invoice Error: {e}")
