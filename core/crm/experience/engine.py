"""
Client Experience management engine.
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Dict, List, Optional

from .models import Client, Project, ProjectStatus, Report, ServiceType

logger = logging.getLogger(__name__)

class CXEngine:
    def __init__(self):
        self.clients: Dict[str, Client] = {}
        self.projects: Dict[str, Project] = {}
        self.reports: List[Report] = []

    def _validate_email(self, email: str) -> bool:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def onboard_client(
        self, company: str, contact_name: str, contact_email: str, **kwargs
    ) -> Client:
        if not self._validate_email(contact_email):
            raise ValueError(f"Invalid contact email: {contact_email}")
        client = Client(id=f"CL-{uuid.uuid4().hex[:6].upper()}", company=company, contact_name=contact_name, contact_email=contact_email, **kwargs)
        self.clients[client.id] = client
        logger.info(f"Client onboarded: {company}")
        return client

    def create_project(self, client_id: str, name: str, service: ServiceType, budget: float = 0.0, deliverables: Optional[List[str]] = None) -> Project:
        if client_id not in self.clients: raise KeyError("Invalid Client ID")
        project = Project(id=f"PR-{uuid.uuid4().hex[:6].upper()}", client_id=client_id, name=name, service=service, budget=budget, deliverables=deliverables or [])
        self.projects[project.id] = project
        return project

    def generate_report(self, client_id: str, project_id: str) -> Report:
        period = datetime.now().strftime("%Y-%m")
        metrics = {"traffic": {"value": 12500, "change": "+15%"}, "leads": {"value": 45, "change": "+22%"}, "roi": {"value": "3.2x", "change": "+0.4x"}}
        report = Report(id=f"RP-{uuid.uuid4().hex[:6].upper()}", client_id=client_id, project_id=project_id, period=period, metrics=metrics)
        self.reports.append(report)
        return report
