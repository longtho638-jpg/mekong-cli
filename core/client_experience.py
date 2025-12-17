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

import os
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum


class ProjectStatus(Enum):
    """Project status."""
    DISCOVERY = "discovery"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"


class ServiceType(Enum):
    """Service types offered."""
    SEO = "seo"
    PPC = "ppc"
    CONTENT = "content"
    SOCIAL = "social"
    BRANDING = "branding"
    WEBSITE = "website"


@dataclass
class Client:
    """An agency client."""
    id: str
    company: str
    contact_name: str
    contact_email: str
    phone: Optional[str] = None
    industry: str = ""
    onboarded_at: datetime = field(default_factory=datetime.now)
    notes: str = ""


@dataclass
class Project:
    """A client project."""
    id: str
    client_id: str
    name: str
    service: ServiceType
    status: ProjectStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    budget: float = 0
    deliverables: List[str] = field(default_factory=list)
    progress: int = 0  # 0-100


@dataclass
class Report:
    """An automated client report."""
    id: str
    client_id: str
    project_id: str
    period: str  # "2024-12"
    metrics: Dict[str, Any] = field(default_factory=dict)
    generated_at: datetime = field(default_factory=datetime.now)


class ClientExperience:
    """
    Client Experience System.
    
    Make agency's clients feel WOW with:
    - Professional onboarding
    - Project visibility
    - Automated reports
    """
    
    def __init__(self):
        self.clients: Dict[str, Client] = {}
        self.projects: Dict[str, Project] = {}
        self.reports: List[Report] = []
        
        # Service pricing (base)
        self.pricing = {
            ServiceType.SEO: {"monthly": 500, "setup": 0},
            ServiceType.PPC: {"monthly": 1000, "setup": 500},
            ServiceType.CONTENT: {"monthly": 800, "setup": 0},
            ServiceType.SOCIAL: {"monthly": 600, "setup": 200},
            ServiceType.BRANDING: {"monthly": 0, "setup": 5000},
            ServiceType.WEBSITE: {"monthly": 100, "setup": 3000},
        }
        
        # Create demo data
        self._create_demo_data()
    
    def _create_demo_data(self):
        """Create demo clients and projects."""
        # Demo client
        client = self.onboard_client(
            company="Saigon Coffee Co.",
            contact_name="Nguyen Van Minh",
            contact_email="minh@saigoncoffee.vn",
            industry="F&B"
        )
        
        # Demo project
        project = self.create_project(
            client_id=client.id,
            name="SEO + Content Strategy",
            service=ServiceType.SEO,
            budget=5000,
            deliverables=["Keyword Research", "10 Blog Posts", "Technical Audit"]
        )
        
        # Update progress
        project.progress = 65
        project.status = ProjectStatus.IN_PROGRESS
    
    # ═══════════════════════════════════════════════════════════
    # Client Management
    # ═══════════════════════════════════════════════════════════
    
    def onboard_client(
        self,
        company: str,
        contact_name: str,
        contact_email: str,
        **kwargs
    ) -> Client:
        """Onboard a new client."""
        client = Client(
            id=f"CL-{uuid.uuid4().hex[:6].upper()}",
            company=company,
            contact_name=contact_name,
            contact_email=contact_email,
            **kwargs
        )
        
        self.clients[client.id] = client
        return client
    
    def get_client_dashboard(self, client_id: str) -> Dict[str, Any]:
        """Get client dashboard data."""
        client = self.clients.get(client_id)
        if not client:
            return {"error": "Client not found"}
        
        # Get client's projects
        projects = [p for p in self.projects.values() if p.client_id == client_id]
        
        active = [p for p in projects if p.status not in [ProjectStatus.COMPLETED]]
        completed = [p for p in projects if p.status == ProjectStatus.COMPLETED]
        
        total_budget = sum(p.budget for p in projects)
        avg_progress = sum(p.progress for p in active) / max(1, len(active))
        
        return {
            "client": {
                "company": client.company,
                "contact": client.contact_name
            },
            "summary": {
                "active_projects": len(active),
                "completed_projects": len(completed),
                "total_investment": f"${total_budget:,.0f}",
                "avg_progress": f"{avg_progress:.0f}%"
            },
            "projects": [
                {
                    "name": p.name,
                    "service": p.service.value,
                    "status": p.status.value,
                    "progress": p.progress
                }
                for p in projects
            ]
        }
    
    # ═══════════════════════════════════════════════════════════
    # Project Management
    # ═══════════════════════════════════════════════════════════
    
    def create_project(
        self,
        client_id: str,
        name: str,
        service: ServiceType,
        budget: float = 0,
        deliverables: List[str] = None
    ) -> Project:
        """Create a new project."""
        project = Project(
            id=f"PR-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            name=name,
            service=service,
            status=ProjectStatus.DISCOVERY,
            start_date=datetime.now(),
            budget=budget,
            deliverables=deliverables or []
        )
        
        self.projects[project.id] = project
        return project
    
    def update_progress(self, project_id: str, progress: int) -> bool:
        """Update project progress."""
        if project_id not in self.projects:
            return False
        
        project = self.projects[project_id]
        project.progress = min(100, max(0, progress))
        
        if progress >= 100:
            project.status = ProjectStatus.COMPLETED
            project.end_date = datetime.now()
        elif progress > 0:
            project.status = ProjectStatus.IN_PROGRESS
        
        return True
    
    # ═══════════════════════════════════════════════════════════
    # Automated Reports
    # ═══════════════════════════════════════════════════════════
    
    def generate_report(self, client_id: str, project_id: str) -> Report:
        """Generate an automated report."""
        period = datetime.now().strftime("%Y-%m")
        
        project = self.projects.get(project_id)
        
        # Demo metrics
        metrics = {
            "traffic": {"value": 12500, "change": "+15%"},
            "leads": {"value": 45, "change": "+22%"},
            "conversions": {"value": 12, "change": "+8%"},
            "roi": {"value": "3.2x", "change": "+0.4x"}
        }
        
        report = Report(
            id=f"RP-{uuid.uuid4().hex[:6].upper()}",
            client_id=client_id,
            project_id=project_id,
            period=period,
            metrics=metrics
        )
        
        self.reports.append(report)
        return report
    
    def format_report_email(self, report: Report) -> str:
        """Format report as email template."""
        client = self.clients.get(report.client_id)
        project = self.projects.get(report.project_id)
        
        metrics = report.metrics
        
        html = f"""
🏯 AGENCY OS - MONTHLY REPORT
{'=' * 50}

Hello {client.contact_name}! 👋

Here's your {report.period} performance summary for "{project.name}":

📊 KEY METRICS
{'─' * 30}
  Traffic:     {metrics['traffic']['value']:,} ({metrics['traffic']['change']})
  Leads:       {metrics['leads']['value']} ({metrics['leads']['change']})
  Conversions: {metrics['conversions']['value']} ({metrics['conversions']['change']})
  ROI:         {metrics['roi']['value']} ({metrics['roi']['change']})

📈 PROJECT PROGRESS
{'─' * 30}
  Status:   {project.status.value}
  Progress: {project.progress}%
  
✨ You're crushing it!

Best regards,
Your Agency Team 🏯
        """
        
        return html.strip()
    
    def format_client_portal(self) -> str:
        """Format client portal as ASCII."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  👥 AGENCY OS - CLIENT PORTAL                            ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]
        
        for client in list(self.clients.values())[:3]:
            dashboard = self.get_client_dashboard(client.id)
            summary = dashboard["summary"]
            
            lines.append(f"║  {client.company[:20]:<20}                           ║")
            lines.append(f"║    Active: {summary['active_projects']}  |  Progress: {summary['avg_progress']}  |  {summary['total_investment']}    ║")
            lines.append("║                                                           ║")
        
        lines.append("╚═══════════════════════════════════════════════════════════╝")
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cx = ClientExperience()
    
    print("👥 Client Experience System")
    print("=" * 50)
    print()
    
    # Show client portal
    print(cx.format_client_portal())
    print()
    
    # Get client dashboard
    client_id = list(cx.clients.keys())[0]
    dashboard = cx.get_client_dashboard(client_id)
    
    print("📊 Client Dashboard:")
    print(f"   Company: {dashboard['client']['company']}")
    print(f"   Active Projects: {dashboard['summary']['active_projects']}")
    print(f"   Investment: {dashboard['summary']['total_investment']}")
    print(f"   Avg Progress: {dashboard['summary']['avg_progress']}")
    print()
    
    # Generate report
    project_id = list(cx.projects.keys())[0]
    report = cx.generate_report(client_id, project_id)
    
    print("📧 Report Email Preview:")
    print(cx.format_report_email(report))
