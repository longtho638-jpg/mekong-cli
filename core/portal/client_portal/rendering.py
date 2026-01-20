"""
Rendering and formatting logic for the portal.
"""
from typing import Any, Dict

from .base import BasePortal


class RenderingOps(BasePortal):
    def format_client_summary(self, client_id: str) -> str:
        """Format client summary cho display."""
        client = self.clients.get(client_id)
        if not client:
            return "Client not found."

        projects = self.get_client_projects(client_id)
        invoices = self.get_client_invoices(client_id)

        return self.presenter.format_client_summary(client, projects, invoices)

    def format_dashboard_summary(self) -> str:
        """Format dashboard summary."""
        return self.presenter.format_dashboard_summary(self.service.stats)

    def format_project_details(self, project_id: str) -> str:
        """Format project details."""
        project = self.projects.get(project_id)
        if not project:
            return "Project not found."

        return self.presenter.format_project_details(project)

    def format_invoice_details(self, invoice_id: str) -> str:
        """Format invoice details."""
        invoice = self.invoices.get(invoice_id)
        if not invoice:
            return "Invoice not found."

        return self.presenter.format_invoice_details(invoice)

    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê."""
        return self.service.get_stats()
