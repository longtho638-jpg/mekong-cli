"""
💳 Invoice Automation - Automated Invoicing
=============================================

Automate recurring and project invoices.
Get paid faster!

Features:
- Auto-generation
- Recurring invoices
- Payment reminders
- Late fee calculation
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class InvoiceType(Enum):
    """Invoice types."""
    ONE_TIME = "one_time"
    RECURRING = "recurring"
    MILESTONE = "milestone"


class InvoiceStatus(Enum):
    """Invoice status."""
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    OVERDUE = "overdue"


@dataclass
class AutoInvoice:
    """An automated invoice."""
    id: str
    client: str
    amount: float
    invoice_type: InvoiceType
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    reminder_count: int = 0


@dataclass
class RecurringSchedule:
    """A recurring invoice schedule."""
    id: str
    client: str
    amount: float
    frequency: str  # monthly, quarterly
    next_date: datetime
    active: bool = True
    invoices_generated: int = 0


class InvoiceAutomation:
    """
    Invoice Automation.
    
    Automate invoicing.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.invoices: Dict[str, AutoInvoice] = {}
        self.schedules: Dict[str, RecurringSchedule] = {}
        self.late_fee_percent = 0.05
    
    def create_invoice(
        self,
        client: str,
        amount: float,
        invoice_type: InvoiceType = InvoiceType.ONE_TIME,
        due_days: int = 30
    ) -> AutoInvoice:
        """Create an invoice."""
        invoice = AutoInvoice(
            id=f"INV-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            amount=amount,
            invoice_type=invoice_type,
            due_date=datetime.now() + timedelta(days=due_days)
        )
        self.invoices[invoice.id] = invoice
        return invoice
    
    def setup_recurring(
        self,
        client: str,
        amount: float,
        frequency: str = "monthly"
    ) -> RecurringSchedule:
        """Setup recurring invoices."""
        schedule = RecurringSchedule(
            id=f"REC-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            amount=amount,
            frequency=frequency,
            next_date=datetime.now() + timedelta(days=30)
        )
        self.schedules[schedule.id] = schedule
        return schedule
    
    def send_invoice(self, invoice: AutoInvoice):
        """Send an invoice."""
        invoice.status = InvoiceStatus.SENT
        invoice.sent_at = datetime.now()
    
    def mark_paid(self, invoice: AutoInvoice):
        """Mark invoice as paid."""
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = datetime.now()
    
    def send_reminder(self, invoice: AutoInvoice):
        """Send payment reminder."""
        invoice.reminder_count += 1
    
    def get_overdue(self) -> List[AutoInvoice]:
        """Get overdue invoices."""
        now = datetime.now()
        return [inv for inv in self.invoices.values() 
                if inv.due_date < now and inv.status not in [InvoiceStatus.PAID, InvoiceStatus.DRAFT]]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get invoicing statistics."""
        total = sum(inv.amount for inv in self.invoices.values())
        paid = sum(inv.amount for inv in self.invoices.values() if inv.status == InvoiceStatus.PAID)
        outstanding = total - paid
        recurring = sum(s.amount for s in self.schedules.values() if s.active)
        
        return {
            "total_invoiced": total,
            "paid": paid,
            "outstanding": outstanding,
            "recurring_monthly": recurring,
            "overdue_count": len(self.get_overdue())
        }
    
    def format_dashboard(self) -> str:
        """Format invoicing dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  💳 INVOICE AUTOMATION                                    ║",
            f"║  ${stats['total_invoiced']:,.0f} total │ ${stats['outstanding']:,.0f} outstanding   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 INVOICE SUMMARY                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    💰 Total Invoiced:  ${stats['total_invoiced']:>12,.0f}               ║",
            f"║    ✅ Paid:            ${stats['paid']:>12,.0f}               ║",
            f"║    ⏳ Outstanding:     ${stats['outstanding']:>12,.0f}               ║",
            f"║    🔄 Recurring/mo:    ${stats['recurring_monthly']:>12,.0f}               ║",
            "║                                                           ║",
            "║  📋 RECENT INVOICES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"draft": "📝", "sent": "📤", "viewed": "👀", "paid": "✅", "overdue": "🔴"}
        
        for invoice in list(self.invoices.values())[-4:]:
            icon = status_icons.get(invoice.status.value, "📄")
            lines.append(f"║    {icon} {invoice.id:<10} │ {invoice.client[:15]:<15} │ ${invoice.amount:>8,.0f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🔄 RECURRING SCHEDULES                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for schedule in list(self.schedules.values())[:3]:
            status = "🟢" if schedule.active else "⚪"
            lines.append(f"║    {status} {schedule.client[:15]:<15} │ ${schedule.amount:>8,.0f}/mo │ {schedule.invoices_generated} sent  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Invoice]  [⏰ Reminders]  [📊 Reports]            ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Get paid on time!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    automation = InvoiceAutomation("Saigon Digital Hub")
    
    print("💳 Invoice Automation")
    print("=" * 60)
    print()
    
    # Create invoices
    inv1 = automation.create_invoice("Sunrise Realty", 5000)
    inv2 = automation.create_invoice("Coffee Lab", 2500)
    inv3 = automation.create_invoice("Tech Startup", 8000)
    
    # Send and pay some
    automation.send_invoice(inv1)
    automation.mark_paid(inv1)
    automation.send_invoice(inv2)
    
    # Setup recurring
    automation.setup_recurring("Sunrise Realty", 3000)
    automation.setup_recurring("Fashion Brand", 2000)
    
    print(automation.format_dashboard())
