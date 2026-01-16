"""
👥 Client Portal - Share Progress with Clients
===============================================

Give your clients a professional portal to:
- View project status
- Track deliverables
- See invoices
- Download assets
- Message you directly

This is the KILLER feature that makes agencies look 10x more professional.
"""

import uuid
import logging
import hashlib
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ClientStatus(Enum):
    """Client lifecycle status."""
    LEAD = "lead"
    PROSPECT = "prospect"
    ACTIVE = "active"
    PAUSED = "paused"
    CHURNED = "churned"


class ProjectStatus(Enum):
    """Project status."""
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


class TaskStatus(Enum):
    """Task status."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


class InvoiceStatus(Enum):
    """Invoice status."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"


@dataclass
class Client:
    """A client in the portal."""
    id: str
    name: str
    email: str
    company: str
    status: ClientStatus
    created_at: datetime
    portal_code: str  # Access code for client portal
    notes: str = ""
    monthly_retainer: float = 0.0
    total_spent: float = 0.0


@dataclass
class ProjectTask:
    """A task within a project."""
    id: str
    name: str
    description: str
    status: TaskStatus
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assignee: str = "Team"


@dataclass
class Project:
    """A client project record."""
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
    """A client invoice record."""
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
    """A message between agency and client."""
    id: str
    client_id: str
    sender: str  # "agency" or "client"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    read: bool = False


class ClientPortal:
    """
    Client Portal System.
    
    Manages client interactions, projects, financials, and messaging.
    """
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        self.clients: Dict[str, Client] = {}
        self.projects: Dict[str, Project] = {}
        self.invoices: Dict[str, Invoice] = {}
        self.messages: Dict[str, List[Message]] = {}
        
        self.stats = {
            "total_clients": 0,
            "active_clients": 0,
            "total_projects": 0,
            "active_projects": 0,
            "total_invoiced": 0.0,
            "total_collected": 0.0
        }
        
        logger.info(f"Client Portal initialized for {agency_name}")
        self._create_demo_data()
    
    def _validate_email(self, email: str) -> bool:
        """Basic email format validation."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _generate_portal_code(self, client_id: str) -> str:
        """Generate unique portal access code."""
        raw = f"{client_id}{datetime.now().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()
    
    def _create_demo_data(self):
        """Pre-populate with sample agency data."""
        logger.info("Loading demo client portal data...")
        try:
            client = self.add_client("John Smith", "john@example.com", "Acme Corp", 2000.0)
            proj = self.create_project(client.id, "Website Redesign", "Complete overhauled branding", 5000.0)
            
            tasks = [("Discovery", TaskStatus.DONE), ("Homepage", TaskStatus.IN_PROGRESS)]
            for name, status in tasks:
                self.add_task(proj.id, name, f"Complete {name.lower()}", status)
                
            self.create_invoice(client.id, 2500.0, [{"name": "Phase 1", "amount": 2500.0}], 
                                project_id=proj.id, status=InvoiceStatus.PAID)
        except Exception as e:
            logger.error(f"Demo data error: {e}")
    
    def add_client(
        self,
        name: str,
        email: str,
        company: str,
        monthly_retainer: float = 0.0,
        notes: str = ""
    ) -> Client:
        """Register a new portal-accessible client."""
        if not self._validate_email(email):
            raise ValueError(f"Invalid email: {email}")

        client_id = f"CLI-{uuid.uuid4().hex[:8].upper()}"
        client = Client(
            id=client_id,
            name=name,
            email=email,
            company=company,
            status=ClientStatus.ACTIVE,
            created_at=datetime.now(),
            portal_code=self._generate_portal_code(client_id),
            notes=notes,
            monthly_retainer=monthly_retainer
        )
        
        self.clients[client_id] = client
        self.messages[client_id] = []
        self.stats["total_clients"] += 1
        self.stats["active_clients"] += 1
        
        logger.info(f"Client added to portal: {company}")
        return client
    
    def create_project(
        self,
        client_id: str,
        name: str,
        description: str,
        budget: float,
        duration_weeks: int = 4
    ) -> Project:
        """Initiate a new project for a client."""
        if client_id not in self.clients:
            raise KeyError("Client not found")
        if budget < 0:
            raise ValueError("Budget cannot be negative")

        project_id = f"PRJ-{uuid.uuid4().hex[:8].upper()}"
        project = Project(
            id=project_id,
            client_id=client_id,
            name=name,
            description=description,
            status=ProjectStatus.IN_PROGRESS,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(weeks=duration_weeks),
            budget=budget
        )
        
        self.projects[project_id] = project
        self.stats["total_projects"] += 1
        self.stats["active_projects"] += 1
        logger.info(f"Project created: {name}")
        return project
    
    def add_task(
        self,
        project_id: str,
        name: str,
        description: str,
        status: TaskStatus = TaskStatus.TODO
    ) -> Optional[ProjectTask]:
        """Add a trackable task to a project."""
        if project_id not in self.projects:
            return None
        
        task = ProjectTask(
            id=f"TSK-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            status=status
        )
        
        self.projects[project_id].tasks.append(task)
        logger.debug(f"Task '{name}' added to {project_id}")
        return task
    
    def create_invoice(
        self,
        client_id: str,
        amount: float,
        items: List[Dict[str, Any]],
        project_id: Optional[str] = None,
        status: InvoiceStatus = InvoiceStatus.DRAFT
    ) -> Invoice:
        """Generate a new invoice record."""
        if amount < 0:
            raise ValueError("Amount cannot be negative")

        invoice_id = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
        invoice = Invoice(
            id=invoice_id,
            client_id=client_id,
            project_id=project_id,
            amount=amount,
            status=status,
            due_date=datetime.now() + timedelta(days=30),
            items=items
        )
        
        self.invoices[invoice_id] = invoice
        self.stats["total_invoiced"] += amount
        
        if status == InvoiceStatus.PAID:
            invoice.paid_date = datetime.now()
            self.stats["total_collected"] += amount
            if client_id in self.clients:
                self.clients[client_id].total_spent += amount
        
        logger.info(f"Invoice {invoice_id} created for {amount}")
        return invoice
    
    def send_message(self, client_id: str, content: str, sender: str = "agency") -> bool:
        """Send a message within the portal."""
        if client_id not in self.messages:
            return False
        
        msg = Message(id=f"MSG-{uuid.uuid4().hex[:8]}", client_id=client_id, sender=sender, content=content)
        self.messages[client_id].append(msg)
        logger.info(f"Message sent to {client_id} from {sender}")
        return True
    
    def format_client_summary(self, client_id: str) -> str:
        """Render a text dashboard for a specific client."""
        client = self.clients.get(client_id)
        if not client: return "Client not found."
        
        projects = [p for p in self.projects.values() if p.client_id == client_id]
        invoices = [i for i in self.invoices.values() if i.client_id == client_id]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 CLIENT PORTAL - {client.company[:30]:<30}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Contact: {client.name:<25} Status: {client.status.value:<10}  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  📊 ACTIVE PROJECTS:                                      ║",
        ]
        
        for p in projects:
            lines.append(f"║    • {p.name[:20]:<20} │ Progress: {p.progress:>3.0f}% │ {p.status.value:<10} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  💰 FINANCIALS:                                           ║",
            f"║    Total Invoiced: ${sum(i.amount for i in invoices):>10,.2f}                    ║",
            f"║    Total Paid:     ${client.total_spent:>10,.2f}                    ║",
            "║                                                           ║",
            "║  [📂 Files]  [💬 Messages]  [📅 Meetings]  [💳 Billing]  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("👥 Initializing Client Portal...")
    print("=" * 60)
    
    try:
        portal = ClientPortal("Saigon Digital Hub")
        # Get first client
        if portal.clients:
            cid = list(portal.clients.keys())[0]
            print("\n" + portal.format_client_summary(cid))
            
            portal.send_message(cid, "Your design draft is ready!")
            print("\n📨 Unread Messages:", sum(1 for m in portal.messages[cid] if not m.read))
            
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
