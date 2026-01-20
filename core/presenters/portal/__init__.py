"""
Client Portal Presentation Facade.
"""
from .client_view import ClientViewPresenter
from .invoice_view import InvoiceViewPresenter
from .project_view import ProjectViewPresenter
from .validation import PortalValidator


class ClientPortalPresenter(ClientViewPresenter, ProjectViewPresenter, InvoiceViewPresenter, PortalValidator):
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name

    def format_dashboard_summary(self, stats: dict) -> str:
        return f"╔═══════════════════════════════════════════════════════════╗\n║  📊 {self.agency_name.upper()[:40]:<40} - DASHBOARD  ║\n╠═══════════════════════════════════════════════════════════╣\n║  Total Clients:  {stats.get('total_clients', 0):>10}  Projects: {stats.get('total_projects', 0):>10} ║\n║  Total Invoiced: ${stats.get('total_invoiced', 0):>10,.2f}  Collected: ${stats.get('total_collected', 0):>10,.2f} ║\n╚═══════════════════════════════════════════════════════════╝"
