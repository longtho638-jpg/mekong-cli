"""
👥 Client Portal Presentation - UI/Formatting Layer
====================================================

Presentation layer cho client portal với formatting và display logic.
"""

import logging
from typing import Any, Dict, List

try:
    from ..services.client_portal_service import Client, ClientStatus, Invoice, Project
except ImportError:
    from services.client_portal_service import Client, ClientStatus, Invoice, Project

logger = logging.getLogger(__name__)


class ClientPortalPresenter:
    """Presenter class cho client portal UI formatting."""

    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        logger.info("Client Portal presenter initialized")

    def format_client_summary(
        self, client: Client, projects: List[Project], invoices: List[Invoice]
    ) -> str:
        """Format client summary cho display."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 CLIENT PORTAL - {client.company[:30]:<30}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Contact: {client.name:<25} Status: {client.status.value:<10}  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  📊 ACTIVE PROJECTS:                                      ║",
        ]

        for project in projects:
            lines.append(
                f"║    • {project.name[:20]:<20} │ Progress: {project.progress:>3.0f}% │ {project.status.value:<10} ║"
            )

        lines.extend(
            [
                "║                                                           ║",
                "║  💰 FINANCIALS:                                           ║",
                f"║    Total Invoiced: ${sum(i.amount for i in invoices):>10,.2f}                    ║",
                f"║    Total Paid:     ${client.total_spent:>10,.2f}                    ║",
                "║                                                           ║",
                "║  [📂 Files]  [💬 Messages]  [📅 Meetings]  [💳 Billing]  ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)

    def format_project_details(self, project: Project) -> str:
        """Format project details cho display."""
        lines = [
            f"📋 Project: {project.name}",
            f"📝 Description: {project.description}",
            f"📊 Progress: {project.progress:.1f}%",
            f"💰 Budget: ${project.budget:,.2f} / Spent: ${project.spent:,.2f}",
            f"📅 Started: {project.start_date.strftime('%Y-%m-%d')}",
            f"🏁 Deadline: {project.end_date.strftime('%Y-%m-%d') if project.end_date else 'Not set'}",
            "",
            "📝 Tasks:",
        ]

        for task in project.tasks:
            status_icon = {"todo": "⏳", "in_progress": "🔄", "review": "👀", "done": "✅"}.get(
                task.status.value, "❓"
            )
            lines.append(f"  {status_icon} {task.name} ({task.status.value})")

        return "\n".join(lines)

    def format_invoice_details(self, invoice: Invoice) -> str:
        """Format invoice details cho display."""
        status_icon = {"draft": "📝", "sent": "📤", "paid": "✅", "overdue": "⚠️"}.get(
            invoice.status.value, "❓"
        )

        lines = [
            f"📄 Invoice: {invoice.id}",
            f"💰 Amount: ${invoice.amount:,.2f}",
            f"📊 Status: {status_icon} {invoice.status.value}",
            f"📅 Due: {invoice.due_date.strftime('%Y-%m-%d')}",
        ]

        if invoice.paid_date:
            lines.append(f"✅ Paid: {invoice.paid_date.strftime('%Y-%m-%d')}")

        if invoice.is_overdue:
            lines.append("⚠️ OVERDUE!")

        if invoice.items:
            lines.append("\n📝 Items:")
            for item in invoice.items:
                lines.append(f"  • {item.get('name', 'Unknown')}: ${item.get('amount', 0):,.2f}")

        return "\n".join(lines)

    def format_dashboard_summary(self, stats: Dict[str, Any]) -> str:
        """Format dashboard summary statistics."""
        return f"""
╔═══════════════════════════════════════════════════════════╗
║  📊 {self.agency_name.upper()[:40]:<40} - DASHBOARD  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  👥 CLIENTS                                               ║
║  ─────────────────────────────────────                    ║
║  Total:         {stats.get("total_clients", 0):>10}                        ║
║  Active:        {stats.get("active_clients", 0):>10}                        ║
║                                                           ║
║  🚀 PROJECTS                                              ║
║  ─────────────────────────────────────                    ║
║  Total:         {stats.get("total_projects", 0):>10}                        ║
║  Active:        {stats.get("active_projects", 0):>10}                        ║
║                                                           ║
║  💰 FINANCIALS                                             ║
║  ─────────────────────────────────────                    ║
║  Total Invoiced: ${stats.get("total_invoiced", 0):>10,.2f}                   ║
║  Total Collected: ${stats.get("total_collected", 0):>10,.2f}                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"""

    def format_client_list(self, clients: List[Client]) -> str:
        """Format list của clients cho display."""
        if not clients:
            return "No clients found."

        lines = ["👥 Client List:", "=" * 60]

        for client in clients:
            status_icon = {
                ClientStatus.LEAD: "🎯",
                ClientStatus.PROSPECT: "🔍",
                ClientStatus.ACTIVE: "✅",
                ClientStatus.PAUSED: "⏸️",
                ClientStatus.CHURNED: "❌",
            }.get(client.status, "❓")

            lines.append(f"{status_icon} {client.company} - {client.name} ({client.email})")
            lines.append(
                f"   Monthly: ${client.monthly_retainer:,.2f} | Total: ${client.total_spent:,.2f}"
            )
            lines.append("")

        return "\n".join(lines)

    def format_project_list(self, projects: List[Project]) -> str:
        """Format list của projects cho display."""
        if not projects:
            return "No projects found."

        lines = ["🚀 Project List:", "=" * 60]

        for project in projects:
            lines.append(f"📋 {project.name}")
            lines.append(f"   Client ID: {project.client_id}")
            lines.append(f"   Progress: {project.progress:.1f}% | Budget: ${project.budget:,.2f}")
            lines.append(f"   Status: {project.status.value}")
            lines.append("")

        return "\n".join(lines)

    def format_invoice_list(self, invoices: List[Invoice]) -> str:
        """Format list của invoices cho display."""
        if not invoices:
            return "No invoices found."

        lines = ["📄 Invoice List:", "=" * 60]

        for invoice in invoices:
            status_icon = {"draft": "📝", "sent": "📤", "paid": "✅", "overdue": "⚠️"}.get(
                invoice.status.value, "❓"
            )

            lines.append(f"{status_icon} Invoice {invoice.id}")
            lines.append(f"   Client ID: {invoice.client_id}")
            lines.append(f"   Amount: ${invoice.amount:,.2f}")
            lines.append(f"   Due: {invoice.due_date.strftime('%Y-%m-%d')}")

            if invoice.is_overdue:
                lines.append("   ⚠️ OVERDUE!")

            lines.append("")

        return "\n".join(lines)

    def validate_client_data(self, name: str, email: str, company: str) -> List[str]:
        """Validate client data và return list errors."""
        errors = []

        if not name or len(name.strip()) < 2:
            errors.append("Client name must be at least 2 characters")

        if not email or "@" not in email:
            errors.append("Valid email address is required")

        if not company or len(company.strip()) < 2:
            errors.append("Company name must be at least 2 characters")

        return errors

    def validate_project_data(self, name: str, description: str, budget: float) -> List[str]:
        """Validate project data và return list errors."""
        errors = []

        if not name or len(name.strip()) < 2:
            errors.append("Project name must be at least 2 characters")

        if not description or len(description.strip()) < 10:
            errors.append("Project description must be at least 10 characters")

        if budget < 0:
            errors.append("Budget cannot be negative")

        return errors

    def validate_invoice_data(self, amount: float, items: List[Dict[str, Any]]) -> List[str]:
        """Validate invoice data và return list errors."""
        errors = []

        if amount <= 0:
            errors.append("Invoice amount must be greater than 0")

        if not items:
            errors.append("Invoice must have at least one item")

        total_items_amount = sum(item.get("amount", 0) for item in items)
        if abs(total_items_amount - amount) > 0.01:
            errors.append(
                f"Item amounts (${total_items_amount:.2f}) must equal invoice amount (${amount:.2f})"
            )

        return errors
