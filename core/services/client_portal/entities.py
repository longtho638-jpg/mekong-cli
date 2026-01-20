"""
Entity creation and validation logic for Client Portal.
"""
import hashlib
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .models import (
    Client,
    ClientStatus,
    Invoice,
    InvoiceStatus,
    Message,
    Project,
    ProjectStatus,
    ProjectTask,
    TaskStatus,
)

logger = logging.getLogger(__name__)

class EntityFactory:
    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def generate_portal_code(self, client_id: str) -> str:
        """Generate unique portal access code."""
        raw = f"{client_id}{datetime.now().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()

    def generate_client_id(self) -> str:
        return f"CLI-{uuid.uuid4().hex[:8].upper()}"

    def generate_project_id(self) -> str:
        return f"PRJ-{uuid.uuid4().hex[:8].upper()}"

    def generate_task_id(self) -> str:
        return f"TSK-{uuid.uuid4().hex[:6].upper()}"

    def generate_invoice_id(self) -> str:
        return f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"

    def generate_message_id(self) -> str:
        return f"MSG-{uuid.uuid4().hex[:8]}"

    def create_client_entity(
        self, name: str, email: str, company: str, monthly_retainer: float = 0.0, notes: str = ""
    ) -> Client:
        if not self.validate_email(email):
            raise ValueError(f"Invalid email: {email}")
        client_id = self.generate_client_id()
        return Client(
            id=client_id,
            name=name,
            email=email,
            company=company,
            status=ClientStatus.ACTIVE,
            created_at=datetime.now(),
            portal_code=self.generate_portal_code(client_id),
            notes=notes,
            monthly_retainer=monthly_retainer,
        )

    def create_project_entity(
        self, client_id: str, name: str, description: str, budget: float, duration_weeks: int = 4
    ) -> Project:
        if budget < 0:
            raise ValueError("Budget cannot be negative")
        return Project(
            id=self.generate_project_id(),
            client_id=client_id,
            name=name,
            description=description,
            status=ProjectStatus.IN_PROGRESS,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(weeks=duration_weeks),
            budget=budget,
        )

    def create_task_entity(
        self,
        name: str,
        description: str,
        status: TaskStatus = TaskStatus.TODO,
        due_date: Optional[datetime] = None,
        assignee: str = "Team",
    ) -> ProjectTask:
        return ProjectTask(
            id=self.generate_task_id(),
            name=name,
            description=description,
            status=status,
            due_date=due_date,
            assignee=assignee,
        )
