"""
👥 Client Portal Service - Core Business Logic
==============================================

Service layer cho client portal với clean separation of concerns.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid
import re

logger = logging.getLogger(__name__)

class ClientStatus(Enum):
    """Trạng thái lifecycle của client."""
    LEAD = "lead"
    PROSPECT = "prospect"
    ACTIVE = "active"
    PAUSED = "paused"
    CHURNED = "churned"

class ProjectStatus(Enum):
    """Trạng thái project."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class TaskStatus(Enum):
    """Trạng thái task."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class InvoiceStatus(Enum):
    """Trạng thái invoice."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"

@dataclass
class Client:
    """Client entity."""
    id: str
    name: str
    email: str
    company: str
    status: ClientStatus
    created_at: datetime
    portal_code: str
    notes: str = ""
    monthly_retainer: float = 0.0
    total_spent: float = 0.0

@dataclass
class ProjectTask:
    """Task trong project."""
    id: str
    name: str
    description: str
    status: TaskStatus
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assignee: str = "Team"

@dataclass
class Project:
    """Project entity."""
    id: str
    client_id: str
    name: str
    description: str
    status: ProjectStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    tasks: List[ProjectTask] = field(default_factory=list)
    budget: float = 0.0
    spent: float = 0.0
    
    @property
    def progress(self) -> float:
        if not self.tasks:
            return 0.0
        done = sum(1 for t in self.tasks if t.status == TaskStatus.DONE)
        return (done / len(self.tasks)) * 100.0
    
    @property
    def is_on_budget(self) -> bool:
        return self.spent <= self.budget

@dataclass
class Invoice:
    """Invoice entity."""
    id: str
    client_id: str
    project_id: Optional[str]
    amount: float
    status: InvoiceStatus
    due_date: datetime
    paid_date: Optional[datetime] = None
    items: List[Dict[str, Any]] = field(default_factory=list)
    notes: str = ""
    
    @property
    def is_overdue(self) -> bool:
        if self.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > self.due_date

@dataclass
class Message:
    """Message entity."""
    id: str
    client_id: str
    sender: str
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    read: bool = False

class ClientPortalService:
    """Core service cho client portal business logic."""
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        self.stats = {
            "total_clients": 0,
            "active_clients": 0,
            "total_projects": 0,
            "active_projects": 0,
            "total_invoiced": 0.0,
            "total_collected": 0.0
        }
        logger.info(f"Client Portal service initialized for {agency_name}")
    
    def validate_email(self, email: str) -> bool:
        """Validate email format."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def generate_portal_code(self, client_id: str) -> str:
        """Generate unique portal access code."""
        import hashlib
        raw = f"{client_id}{datetime.now().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()
    
    def generate_client_id(self) -> str:
        """Generate unique client ID."""
        return f"CLI-{uuid.uuid4().hex[:8].upper()}"
    
    def generate_project_id(self) -> str:
        """Generate unique project ID."""
        return f"PRJ-{uuid.uuid4().hex[:8].upper()}"
    
    def generate_task_id(self) -> str:
        """Generate unique task ID."""
        return f"TSK-{uuid.uuid4().hex[:6].upper()}"
    
    def generate_invoice_id(self) -> str:
        """Generate unique invoice ID."""
        return f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
    
    def generate_message_id(self) -> str:
        """Generate unique message ID."""
        return f"MSG-{uuid.uuid4().hex[:8]}"
    
    def create_client_entity(
        self,
        name: str,
        email: str,
        company: str,
        monthly_retainer: float = 0.0,
        notes: str = ""
    ) -> Client:
        """Tạo client entity mới."""
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
            monthly_retainer=monthly_retainer
        )
    
    def create_project_entity(
        self,
        client_id: str,
        name: str,
        description: str,
        budget: float,
        duration_weeks: int = 4
    ) -> Project:
        """Tạo project entity mới."""
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
            budget=budget
        )
    
    def create_task_entity(
        self,
        name: str,
        description: str,
        status: TaskStatus = TaskStatus.TODO,
        due_date: Optional[datetime] = None,
        assignee: str = "Team"
    ) -> ProjectTask:
        """Tạo task entity mới."""
        return ProjectTask(
            id=self.generate_task_id(),
            name=name,
            description=description,
            status=status,
            due_date=due_date,
            assignee=assignee
        )
    
    def create_invoice_entity(
        self,
        client_id: str,
        amount: float,
        items: List[Dict[str, Any]],
        project_id: Optional[str] = None,
        status: InvoiceStatus = InvoiceStatus.DRAFT
    ) -> Invoice:
        """Tạo invoice entity mới."""
        if amount < 0:
            raise ValueError("Amount cannot be negative")
        
        invoice = Invoice(
            id=self.generate_invoice_id(),
            client_id=client_id,
            project_id=project_id,
            amount=amount,
            status=status,
            due_date=datetime.now() + timedelta(days=30),
            items=items
        )
        
        # Update stats
        self.stats["total_invoiced"] += amount
        
        if status == InvoiceStatus.PAID:
            invoice.paid_date = datetime.now()
            self.stats["total_collected"] += amount
        
        return invoice
    
    def create_message_entity(
        self,
        client_id: str,
        content: str,
        sender: str = "agency"
    ) -> Message:
        """Tạo message entity mới."""
        return Message(
            id=self.generate_message_id(),
            client_id=client_id,
            sender=sender,
            content=content
        )
    
    def update_client_stats(self, client_count_change: int = 0, active_change: int = 0) -> None:
        """Cập nhật client statistics."""
        self.stats["total_clients"] += client_count_change
        self.stats["active_clients"] += active_change
    
    def update_project_stats(self, project_count_change: int = 0, active_change: int = 0) -> None:
        """Cập nhật project statistics."""
        self.stats["total_projects"] += project_count_change
        self.stats["active_projects"] += active_change
    
    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê hiện tại."""
        return self.stats.copy()
    
    def calculate_project_progress(self, project: Project) -> float:
        """Tính tiến độ project."""
        if not project.tasks:
            return 0.0
        done = sum(1 for t in project.tasks if t.status == TaskStatus.DONE)
        return (done / len(project.tasks)) * 100.0
    
    def is_project_over_budget(self, project: Project) -> bool:
        """Kiểm tra project có vượt ngân sách không."""
        return project.spent > project.budget
    
    def is_invoice_overdue(self, invoice: Invoice) -> bool:
        """Kiểm tra invoice có quá hạn không."""
        if invoice.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > invoice.due_date