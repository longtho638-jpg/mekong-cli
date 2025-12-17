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

import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid
import hashlib


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
    monthly_retainer: float = 0
    total_spent: float = 0


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
    """A client project."""
    id: str
    client_id: str
    name: str
    description: str
    status: ProjectStatus
    start_date: datetime
    end_date: Optional[datetime]
    tasks: List[ProjectTask] = field(default_factory=list)
    budget: float = 0
    spent: float = 0
    
    @property
    def progress(self) -> float:
        if not self.tasks:
            return 0
        done = sum(1 for t in self.tasks if t.status == TaskStatus.DONE)
        return (done / len(self.tasks)) * 100
    
    @property
    def is_on_budget(self) -> bool:
        return self.spent <= self.budget


@dataclass
class Invoice:
    """A client invoice."""
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
    timestamp: datetime
    read: bool = False


class ClientPortal:
    """
    Client Portal System.
    
    Features:
    - Client management
    - Project tracking
    - Task management
    - Invoice system
    - Messaging
    - Progress reports
    """
    
    def __init__(self, agency_name: str = "Nova Digital"):
        self.agency_name = agency_name
        
        # Data stores
        self.clients: Dict[str, Client] = {}
        self.projects: Dict[str, Project] = {}
        self.invoices: Dict[str, Invoice] = {}
        self.messages: Dict[str, List[Message]] = {}
        
        # Stats
        self.stats = {
            "total_clients": 0,
            "active_clients": 0,
            "total_projects": 0,
            "active_projects": 0,
            "total_invoiced": 0.0,
            "total_collected": 0.0
        }
        
        # Demo data
        self._create_demo_data()
    
    def _generate_portal_code(self, client_id: str) -> str:
        """Generate unique portal access code."""
        raw = f"{client_id}{datetime.now().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()
    
    def _create_demo_data(self):
        """Create demo clients and projects."""
        # Demo client
        client = self.add_client(
            name="John Smith",
            email="john@example.com",
            company="Acme Corp",
            monthly_retainer=2000
        )
        
        # Demo project
        project = self.create_project(
            client_id=client.id,
            name="Website Redesign",
            description="Complete website overhaul with new branding",
            budget=5000,
            duration_weeks=8
        )
        
        # Add tasks
        tasks = [
            ("Research & Discovery", TaskStatus.DONE),
            ("Wireframes & Mockups", TaskStatus.DONE),
            ("Design System", TaskStatus.DONE),
            ("Homepage Development", TaskStatus.IN_PROGRESS),
            ("Inner Pages", TaskStatus.TODO),
            ("Testing & QA", TaskStatus.TODO),
            ("Launch", TaskStatus.TODO)
        ]
        
        for name, status in tasks:
            self.add_task(
                project_id=project.id,
                name=name,
                description=f"Complete {name.lower()}",
                status=status
            )
        
        # Demo invoice
        self.create_invoice(
            client_id=client.id,
            project_id=project.id,
            amount=2500,
            items=[
                {"name": "Phase 1 - Research", "amount": 1000},
                {"name": "Phase 2 - Design", "amount": 1500}
            ],
            status=InvoiceStatus.PAID
        )
    
    # ═══════════════════════════════════════════════════════════
    # Client Management
    # ═══════════════════════════════════════════════════════════
    
    def add_client(
        self,
        name: str,
        email: str,
        company: str,
        monthly_retainer: float = 0,
        notes: str = ""
    ) -> Client:
        """Add a new client."""
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
        
        return client
    
    def get_client(self, client_id: str) -> Optional[Client]:
        """Get client by ID."""
        return self.clients.get(client_id)
    
    def get_client_by_code(self, portal_code: str) -> Optional[Client]:
        """Get client by portal access code."""
        for client in self.clients.values():
            if client.portal_code == portal_code:
                return client
        return None
    
    # ═══════════════════════════════════════════════════════════
    # Project Management
    # ═══════════════════════════════════════════════════════════
    
    def create_project(
        self,
        client_id: str,
        name: str,
        description: str,
        budget: float,
        duration_weeks: int = 4
    ) -> Project:
        """Create a new project."""
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
        
        return project
    
    def get_client_projects(self, client_id: str) -> List[Project]:
        """Get all projects for a client."""
        return [p for p in self.projects.values() if p.client_id == client_id]
    
    def add_task(
        self,
        project_id: str,
        name: str,
        description: str,
        status: TaskStatus = TaskStatus.TODO,
        due_date: Optional[datetime] = None
    ) -> Optional[ProjectTask]:
        """Add a task to a project."""
        if project_id not in self.projects:
            return None
        
        task = ProjectTask(
            id=f"TSK-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            status=status,
            due_date=due_date
        )
        
        self.projects[project_id].tasks.append(task)
        return task
    
    def update_task_status(
        self,
        project_id: str,
        task_id: str,
        status: TaskStatus
    ) -> bool:
        """Update task status."""
        if project_id not in self.projects:
            return False
        
        for task in self.projects[project_id].tasks:
            if task.id == task_id:
                task.status = status
                if status == TaskStatus.DONE:
                    task.completed_at = datetime.now()
                return True
        return False
    
    # ═══════════════════════════════════════════════════════════
    # Invoice Management
    # ═══════════════════════════════════════════════════════════
    
    def create_invoice(
        self,
        client_id: str,
        amount: float,
        items: List[Dict[str, Any]],
        project_id: Optional[str] = None,
        due_days: int = 30,
        status: InvoiceStatus = InvoiceStatus.DRAFT
    ) -> Invoice:
        """Create a new invoice."""
        invoice_id = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
        
        invoice = Invoice(
            id=invoice_id,
            client_id=client_id,
            project_id=project_id,
            amount=amount,
            status=status,
            due_date=datetime.now() + timedelta(days=due_days),
            items=items
        )
        
        self.invoices[invoice_id] = invoice
        self.stats["total_invoiced"] += amount
        
        if status == InvoiceStatus.PAID:
            invoice.paid_date = datetime.now()
            self.stats["total_collected"] += amount
            if client_id in self.clients:
                self.clients[client_id].total_spent += amount
        
        return invoice
    
    def mark_invoice_paid(self, invoice_id: str) -> bool:
        """Mark invoice as paid."""
        if invoice_id not in self.invoices:
            return False
        
        invoice = self.invoices[invoice_id]
        invoice.status = InvoiceStatus.PAID
        invoice.paid_date = datetime.now()
        self.stats["total_collected"] += invoice.amount
        
        if invoice.client_id in self.clients:
            self.clients[invoice.client_id].total_spent += invoice.amount
        
        return True
    
    def get_client_invoices(self, client_id: str) -> List[Invoice]:
        """Get all invoices for a client."""
        return [i for i in self.invoices.values() if i.client_id == client_id]
    
    # ═══════════════════════════════════════════════════════════
    # Messaging
    # ═══════════════════════════════════════════════════════════
    
    def send_message(
        self,
        client_id: str,
        content: str,
        sender: str = "agency"
    ) -> Optional[Message]:
        """Send a message to/from client."""
        if client_id not in self.messages:
            return None
        
        msg = Message(
            id=f"MSG-{uuid.uuid4().hex[:8]}",
            client_id=client_id,
            sender=sender,
            content=content,
            timestamp=datetime.now()
        )
        
        self.messages[client_id].append(msg)
        return msg
    
    def get_messages(self, client_id: str) -> List[Message]:
        """Get all messages for a client."""
        return self.messages.get(client_id, [])
    
    # ═══════════════════════════════════════════════════════════
    # Portal Views
    # ═══════════════════════════════════════════════════════════
    
    def get_client_dashboard(self, client_id: str) -> Dict[str, Any]:
        """Get complete dashboard data for a client."""
        client = self.get_client(client_id)
        if not client:
            return {"error": "Client not found"}
        
        projects = self.get_client_projects(client_id)
        invoices = self.get_client_invoices(client_id)
        messages = self.get_messages(client_id)
        
        # Calculate totals
        total_invoiced = sum(i.amount for i in invoices)
        total_paid = sum(i.amount for i in invoices if i.status == InvoiceStatus.PAID)
        outstanding = total_invoiced - total_paid
        
        return {
            "client": {
                "name": client.name,
                "company": client.company,
                "status": client.status.value,
                "member_since": client.created_at.strftime("%B %Y")
            },
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": p.status.value,
                    "progress": f"{p.progress:.0f}%",
                    "tasks_total": len(p.tasks),
                    "tasks_done": sum(1 for t in p.tasks if t.status == TaskStatus.DONE)
                }
                for p in projects
            ],
            "financials": {
                "total_invoiced": total_invoiced,
                "total_paid": total_paid,
                "outstanding": outstanding,
                "invoices": [
                    {
                        "id": i.id,
                        "amount": i.amount,
                        "status": i.status.value,
                        "due": i.due_date.strftime("%Y-%m-%d")
                    }
                    for i in invoices
                ]
            },
            "messages_unread": sum(1 for m in messages if not m.read and m.sender == "agency"),
            "recent_messages": len(messages)
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get portal statistics."""
        return {
            **self.stats,
            "collection_rate": (
                self.stats["total_collected"] / 
                max(1, self.stats["total_invoiced"])
            ) * 100
        }


# Example usage
if __name__ == "__main__":
    # Initialize portal
    portal = ClientPortal(agency_name="Nova Digital")
    
    print("👥 Client Portal Initialized!")
    print(f"   Agency: {portal.agency_name}")
    print(f"   Clients: {len(portal.clients)}")
    print()
    
    # Get demo client
    client = list(portal.clients.values())[0]
    print(f"✅ Demo Client: {client.name}")
    print(f"   Company: {client.company}")
    print(f"   Portal Code: {client.portal_code}")
    print()
    
    # Get dashboard
    dashboard = portal.get_client_dashboard(client.id)
    
    print("📊 Client Dashboard:")
    print(f"   Projects: {len(dashboard['projects'])}")
    for p in dashboard['projects']:
        print(f"      • {p['name']}: {p['progress']} ({p['tasks_done']}/{p['tasks_total']} tasks)")
    print()
    
    print(f"💰 Financials:")
    print(f"   Invoiced: ${dashboard['financials']['total_invoiced']:,.2f}")
    print(f"   Paid: ${dashboard['financials']['total_paid']:,.2f}")
    print(f"   Outstanding: ${dashboard['financials']['outstanding']:,.2f}")
    print()
    
    # Send a message
    portal.send_message(client.id, "Hi John! Your homepage design is ready for review.")
    print("📨 Message sent!")
    print()
    
    # Portal stats
    stats = portal.get_stats()
    print("📈 Portal Stats:")
    print(f"   Total Clients: {stats['total_clients']}")
    print(f"   Active Projects: {stats['active_projects']}")
    print(f"   Collection Rate: {stats['collection_rate']:.1f}%")
