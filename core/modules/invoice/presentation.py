"""
Invoice Module - Presentation Layer
"""
from .services import InvoiceSystem

class InvoicePresenter:
    """Handles visual formatting of Invoices."""

    @staticmethod
    def format_invoice_ascii(system: InvoiceSystem, inv_id: str) -> str:
        """Render a specific invoice as a professional text document."""
        if inv_id not in system.invoices: return "Invoice not found."

        inv = system.invoices[inv_id]
        sym = {"USD": "$", "VND": "₫"}.get(inv.currency.value, "$")

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏯 {system.agency_name.upper()[:30]:<30} INVOICE  ║",
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
