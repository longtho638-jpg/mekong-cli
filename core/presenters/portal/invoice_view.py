"""
Formatting logic for Invoice views in the portal.
"""
from typing import List

from .entities_proxy import Invoice


class InvoiceViewPresenter:
    def format_invoice_details(self, invoice: Invoice) -> str:
        icon = {"draft": "📝", "sent": "📤", "paid": "✅", "overdue": "⚠️"}.get(invoice.status.value, "❓")
        lines = [f"📄 Invoice: {invoice.id}", f"💰 Amount: ${invoice.amount:,.2f}", f"📊 Status: {icon} {invoice.status.value}", f"📅 Due: {invoice.due_date.strftime('%Y-%m-%d')}"]
        if invoice.paid_date: lines.append(f"✅ Paid: {invoice.paid_date.strftime('%Y-%m-%d')}")
        if invoice.is_overdue: lines.append("⚠️ OVERDUE!")
        if invoice.items:
            lines.append("\n📝 Items:")
            for item in invoice.items: lines.append(f"  • {item.get('name', 'Unknown')}: ${item.get('amount', 0):,.2f}")
        return "\n".join(lines)

    def format_invoice_list(self, invoices: List[Invoice]) -> str:
        if not invoices: return "No invoices found."
        lines = ["📄 Invoice List:", "=" * 60]
        for inv in invoices:
            icon = {"draft": "📝", "sent": "📤", "paid": "✅", "overdue": "⚠️"}.get(inv.status.value, "❓")
            lines.append(f"{icon} Invoice {inv.id}\n   Client ID: {inv.client_id}\n   Amount: ${inv.amount:,.2f}\n   Due: {inv.due_date.strftime('%Y-%m-%d')}\n" + ("   ⚠️ OVERDUE!\n" if inv.is_overdue else ""))
        return "\n".join(lines)
