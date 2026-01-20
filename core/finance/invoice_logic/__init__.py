"""
Invoice Automation Facade and Dashboard.
"""
from typing import Any, Dict

from .engine import InvoiceEngine
from .models import AutoInvoice, InvoiceStatus, InvoiceType, RecurringSchedule


class InvoiceAutomation(InvoiceEngine):
    """Invoice Automation System."""
    def __init__(self, agency_name: str):
        super().__init__(agency_name)

    def get_stats(self) -> Dict[str, Any]:
        total = sum(inv.amount for inv in self.invoices.values())
        paid = sum(inv.amount for inv in self.invoices.values() if inv.status == InvoiceStatus.PAID)
        return {"total_invoiced": total, "paid": paid, "outstanding": total - paid}

    def format_dashboard(self) -> str:
        stats = self.get_stats()
        lines = ["╔═══════════════════════════════════════════════════════════╗", f"║  💳 INVOICE AUTOMATION - {self.agency_name.upper()[:25]:<25} ║", f"║  ${stats['total_invoiced']:,.0f} total │ ${stats['outstanding']:,.0f} outstanding   ║", "╚═══════════════════════════════════════════════════════════╝"]
        return "\n".join(lines)
