"""
Invoice Manager Agent - Billing & Payment Tracking
Generates invoices and tracks payments.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from enum import Enum
import random


class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class PaymentMethod(Enum):
    PAYOS = "payos"
    VNPAY = "vnpay"
    BANK_TRANSFER = "bank_transfer"
    MOMO = "momo"


@dataclass
class Invoice:
    """Sales invoice"""
    id: str
    deal_id: str
    client_name: str
    amount: float
    currency: str = "VND"
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_method: Optional[PaymentMethod] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    payment_url: Optional[str] = None
    items: List[Dict] = field(default_factory=list)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.due_date is None:
            self.due_date = datetime.now() + timedelta(days=7)


class InvoiceManagerAgent:
    """
    Invoice Manager Agent - Quản lý Hóa đơn
    
    Responsibilities:
    - Generate invoices
    - Create payment links (PayOS/VNPay)
    - Track payment status
    - Send reminders
    """

    # License pricing (VND)
    PRICING = {
        "starter": 0,
        "pro": 2_000_000,       # 2M VND/month
        "enterprise": 10_000_000,  # 10M VND/month
        "founder": 50_000_000,     # 50M VND lifetime
    }

    def __init__(self):
        self.name = "Invoice Manager"
        self.status = "ready"
        self.invoices_db: Dict[str, Invoice] = {}

    def create_invoice(
        self,
        deal_id: str,
        client_name: str,
        tier: str = "pro",
        months: int = 1
    ) -> Invoice:
        """Create invoice for a deal"""
        invoice_id = f"INV-{datetime.now().strftime('%Y%m')}-{random.randint(1000,9999)}"

        unit_price = self.PRICING.get(tier, self.PRICING["pro"])
        amount = unit_price * months if tier != "founder" else unit_price

        items = [
            {
                "description": f"Mekong-CLI {tier.title()} License",
                "quantity": months if tier != "founder" else 1,
                "unit": "tháng" if tier != "founder" else "lifetime",
                "unit_price": unit_price,
                "total": amount
            }
        ]

        invoice = Invoice(
            id=invoice_id,
            deal_id=deal_id,
            client_name=client_name,
            amount=amount,
            items=items
        )

        self.invoices_db[invoice_id] = invoice
        return invoice

    def generate_payment_link(
        self,
        invoice_id: str,
        method: PaymentMethod = PaymentMethod.PAYOS
    ) -> str:
        """Generate payment link for invoice"""
        if invoice_id not in self.invoices_db:
            raise ValueError(f"Invoice not found: {invoice_id}")

        invoice = self.invoices_db[invoice_id]
        invoice.payment_method = method
        invoice.status = InvoiceStatus.SENT

        # Generate mock payment URL (in production: call PayOS/VNPay API)
        if method == PaymentMethod.PAYOS:
            invoice.payment_url = f"https://pay.payos.vn/web/{invoice_id}"
        elif method == PaymentMethod.VNPAY:
            invoice.payment_url = f"https://sandbox.vnpayment.vn/checker/{invoice_id}"
        else:
            invoice.payment_url = f"https://mekong-cli.com/pay/{invoice_id}"

        return invoice.payment_url

    def mark_paid(self, invoice_id: str) -> Invoice:
        """Mark invoice as paid"""
        if invoice_id not in self.invoices_db:
            raise ValueError(f"Invoice not found: {invoice_id}")

        invoice = self.invoices_db[invoice_id]
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = datetime.now()

        return invoice

    def check_overdue(self) -> List[Invoice]:
        """Check for overdue invoices"""
        overdue = []
        now = datetime.now()

        for invoice in self.invoices_db.values():
            if invoice.status == InvoiceStatus.SENT and invoice.due_date < now:
                invoice.status = InvoiceStatus.OVERDUE
                overdue.append(invoice)

        return overdue

    def get_revenue(self) -> Dict:
        """Get revenue statistics"""
        paid = [i for i in self.invoices_db.values() if i.status == InvoiceStatus.PAID]
        pending = [i for i in self.invoices_db.values() if i.status == InvoiceStatus.SENT]

        return {
            "total_revenue": sum(i.amount for i in paid),
            "pending_revenue": sum(i.amount for i in pending),
            "paid_count": len(paid),
            "pending_count": len(pending),
            "overdue_count": len([i for i in self.invoices_db.values() if i.status == InvoiceStatus.OVERDUE])
        }


# Demo
if __name__ == "__main__":
    agent = InvoiceManagerAgent()

    print("🧾 Invoice Manager Agent Demo\n")

    # Create invoice
    invoice = agent.create_invoice(
        deal_id="deal_001",
        client_name="TechVN Co.",
        tier="pro",
        months=3
    )

    print(f"📄 Invoice: {invoice.id}")
    print(f"   Client: {invoice.client_name}")
    print(f"   Amount: {invoice.amount:,.0f} VND")
    print(f"   Due: {invoice.due_date.date()}")

    # Generate payment link
    url = agent.generate_payment_link(invoice.id, PaymentMethod.PAYOS)
    print(f"\n💳 Payment Link: {url}")

    # Mark paid
    agent.mark_paid(invoice.id)
    print(f"✅ Status: {invoice.status.value}")

    # Revenue
    print("\n💰 Revenue:")
    revenue = agent.get_revenue()
    print(f"   Total: {revenue['total_revenue']:,.0f} VND")
    print(f"   Paid: {revenue['paid_count']} invoices")
