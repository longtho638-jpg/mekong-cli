"""
Client Experience Facade and Dashboard.
"""
import logging

from .engine import CXEngine
from .models import Client, Project, ProjectStatus, Report, ServiceType

logger = logging.getLogger(__name__)

__all__ = ["ClientExperience", "CXEngine", "Client", "Project", "ProjectStatus", "Report", "ServiceType"]

class ClientExperience(CXEngine):
    """
    Client Experience System.
    Manages client onboarding, project transparency, and professional reporting.
    """
    def __init__(self, demo_mode: bool = True):
        super().__init__()
        logger.info("Client Experience System initialized")
        if demo_mode: self._create_demo_data()

    def _create_demo_data(self):
        try:
            client = self.onboard_client(company="Saigon Coffee Co.", contact_name="Nguyen Van Minh", contact_email="minh@saigoncoffee.vn", industry="F&B")
            project = self.create_project(client_id=client.id, name="SEO Strategy", service=ServiceType.SEO, budget=5000.0, deliverables=["Keyword Research", "Technical Audit"])
            project.progress = 65
            project.status = ProjectStatus.IN_PROGRESS
        except Exception as e:
            logger.error(f"Demo data error: {e}")

    def format_client_portal(self) -> str:
        lines = ["╔═══════════════════════════════════════════════════════════╗", "║  👥 CLIENT PORTAL - AGENCY OS                            ║", "╠═══════════════════════════════════════════════════════════╣"]
        for client in list(self.clients.values())[:3]:
            c_projects = [p for p in self.projects.values() if p.client_id == client.id]
            active_count = sum(1 for p in c_projects if p.status != ProjectStatus.COMPLETED)
            total_inv = sum(p.budget for p in c_projects)
            avg_prog = sum(p.progress for p in c_projects) / max(1, len(c_projects))
            lines.extend([f"║  🏢 {client.company[:40]:<40}         ║", f"║    👤 Contact: {client.contact_name:<30}         ║", f"║    📊 Status:  {active_count} Active │ {avg_prog:>3.0f}% Progress │ ${total_inv:>8,.0f} ║", "║  " + "─" * 57 + "  ║"])
        lines.extend(["║  [📂 Files]  [💬 Messages]  [📅 Meetings]  [💳 Billing]  ║", "╚═══════════════════════════════════════════════════════════╝"])
        return "\n".join(lines)
