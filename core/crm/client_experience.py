"""
👥 Client Experience - WOW for Agency Clients
===============================================

Client-facing features that make agencies look amazing.

Features:
- Client onboarding
- Project dashboard
- Automated reports
- Invoice tracking
"""

import logging
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class ProjectStatus(Enum):
    """Project lifecycle status."""

    DISCOVERY = "discovery"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"


class ServiceType(Enum):
    """Service categories offered by the agency."""

    SEO = "seo"
    PPC = "ppc"
    CONTENT = "content"
    SOCIAL = "social"
    BRANDING = "branding"
    WEBSITE = "website"


@dataclass
class Client:
    """An agency client entity."""

    id: str
    company: str
    contact_name: str
    contact_email: str
    phone: Optional[str] = None
    industry: str = "N/A"
    onboarded_at: datetime = field(default_factory=datetime.now)
    notes: str = ""


@dataclass
class Project:
    """A client project record."""

    id: str
    client_id: str
    name: str
    service: ServiceType
    status: ProjectStatus = ProjectStatus.DISCOVERY
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None
    budget: float = 0.0
    deliverables: List[str] = field(default_factory=list)
    progress: int = 0  # 0-100

    def __post_init__(self):
        if not 0 <= self.progress <= 100:
            raise ValueError("Progress must be between 0 and 100")


@dataclass
class Report:
    """A generated performance report for a client."""

    id: str
    client_id: str
    project_id: str
    period: str  # e.g., "2024-12"
    metrics: Dict[str, Any] = field(default_factory=dict)
    generated_at: datetime = field(default_factory=datetime.now)


class ClientExperience:
    """
    Client Experience System.

    Manages client onboarding, project transparency, and professional reporting.
    """

    def __init__(self, demo_mode: bool = True):
        self.clients: Dict[str, Client] = {}
        self.projects: Dict[str, Project] = {}
        self.reports: List[Report] = []

        logger.info("Client Experience System initialized")
        if demo_mode:
            self._create_demo_data()

    def _validate_email(self, email: str) -> bool:
        """Simple email format validation."""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def _create_demo_data(self):
        """Pre-fill with sample client and project."""
        logger.info("Loading demo client experience data...")
        try:
            client = self.onboard_client(
                company="Saigon Coffee Co.",
                contact_name="Nguyen Van Minh",
                contact_email="minh@saigoncoffee.vn",
                industry="F&B",
            )

            project = self.create_project(
                client_id=client.id,
                name="SEO Strategy",
                service=ServiceType.SEO,
                budget=5000.0,
                deliverables=["Keyword Research", "Technical Audit"],
            )

            project.progress = 65
            project.status = ProjectStatus.IN_PROGRESS
        except Exception as e:
            logger.error(f"Demo data error: {e}")

    def onboard_client(
        self, company: str, contact_name: str, contact_email: str, **kwargs
    ) -> Client:
        """Register a new agency client."""
        if not self._validate_email(contact_email):
            logger.error(f"Invalid email: {contact_email}")
            raise ValueError(f"Invalid contact email: {contact_email}")

        client = Client(
            id=f"CL-{uuid.uuid4().hex[:6].upper()}",
            company=company,
            contact_name=contact_name,
            contact_email=contact_email,
            **kwargs,
        )

        self.clients[client.id] = client
        logger.info(f"Client onboarded: {company} ({client.id})")
        return client

    def create_project(
        self,
        client_id: str,
        name: str,
        service: ServiceType,
        budget: float = 0.0,
        deliverables: Optional[List[str]] = None,
    ) -> Project:
        """Launch a new project for an onboarded client."""
        if client_id not in self.clients:
            logger.error(f"Client {client_id} not found")
            raise KeyError("Invalid Client ID")

        project = Project(
            id=f"PR-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            name=name,
            service=service,
            budget=budget,
            deliverables=deliverables or [],
        )

        self.projects[project.id] = project
        logger.info(f"Project created: {name} for {self.clients[client_id].company}")
        return project

    def generate_report(self, client_id: str, project_id: str) -> Report:
        """Create a monthly performance snapshot."""
        period = datetime.now().strftime("%Y-%m")

        # Simulate analytics metrics
        metrics = {
            "traffic": {"value": 12500, "change": "+15%"},
            "leads": {"value": 45, "change": "+22%"},
            "roi": {"value": "3.2x", "change": "+0.4x"},
        }

        report = Report(
            id=f"RP-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            project_id=project_id,
            period=period,
            metrics=metrics,
        )

        self.reports.append(report)
        logger.info(f"Report generated for {period}")
        return report

    def format_client_portal(self) -> str:
        """Render ASCII Client Portal."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  👥 CLIENT PORTAL - AGENCY OS                            ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        for client in list(self.clients.values())[:3]:
            # Get project summary
            c_projects = [p for p in self.projects.values() if p.client_id == client.id]
            active_count = sum(1 for p in c_projects if p.status != ProjectStatus.COMPLETED)
            total_inv = sum(p.budget for p in c_projects)
            avg_prog = sum(p.progress for p in c_projects) / max(1, len(c_projects))

            lines.append(f"║  🏢 {client.company[:40]:<40}         ║")
            lines.append(f"║    👤 Contact: {client.contact_name:<30}         ║")
            lines.append(
                f"║    📊 Status:  {active_count} Active │ {avg_prog:>3.0f}% Progress │ ${total_inv:>8,.0f} ║"
            )
            lines.append("║  " + "─" * 57 + "  ║")

        lines.append("║  [📂 Files]  [💬 Messages]  [📅 Meetings]  [💳 Billing]  ║")
        lines.append("╚═══════════════════════════════════════════════════════════╝")

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👥 Initializing Client Experience System...")
    print("=" * 60)

    try:
        cx = ClientExperience()

        # Add another client for demo
        c2 = cx.onboard_client("Global Tech", "Sarah Connor", "sarah@global.tech")
        cx.create_project(c2.id, "PPC Ads", ServiceType.PPC, 2500.0)

        print("\n" + cx.format_client_portal())

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
