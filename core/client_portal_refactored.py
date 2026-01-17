"""
👥 Refactored Client Portal - Main Interface
============================================

Main interface sử dụng refactored services với MVC pattern.
"""

import logging
from typing import Dict, Any, List, Optional

try:
    from .services.client_portal_service import (
        ClientPortalService, Client, Project, Invoice, Message,
        ClientStatus, ProjectStatus, TaskStatus, InvoiceStatus
    )
    from .repositories.client_portal_repository import ClientPortalRepository
    from .presenters.client_portal_presenter import ClientPortalPresenter
except ImportError:
    # Fallback for direct execution
    from services.client_portal_service import (
        ClientPortalService, Client, Project, Invoice, Message,
        ClientStatus, ProjectStatus, TaskStatus, InvoiceStatus
    )
    from repositories.client_portal_repository import ClientPortalRepository
    from presenters.client_portal_presenter import ClientPortalPresenter

logger = logging.getLogger(__name__)

class ClientPortal:
    """
    Refactored Client Portal với MVC architecture.
    
    Sử dụng service layer pattern với clear separation of concerns:
    - Service: Business logic
    - Repository: Data access
    - Presenter: UI formatting
    """
    
    def __init__(self, agency_name: str = "Nova Digital"):
        # Khởi tạo layers
        self.service = ClientPortalService(agency_name)
        self.repository = ClientPortalRepository()
        self.presenter = ClientPortalPresenter(agency_name)
        
        # Load existing data
        self.clients = self.repository.load_clients()
        self.projects = self.repository.load_projects()
        self.invoices = self.repository.load_invoices()
        self.messages = self.repository.load_messages()
        self.service.stats = self.repository.load_stats()
        
        # Create demo data nếu empty
        if not self.clients:
            self._create_demo_data()
        
        logger.info(f"Client Portal initialized for {agency_name}")
    
    def _create_demo_data(self):
        """Tạo demo data cho testing."""
        logger.info("Loading demo client portal data...")
        try:
            client = self.add_client("John Smith", "john@example.com", "Acme Corp", 2000.0)
            project = self.create_project(client.id, "Website Redesign", "Complete overhauled branding", 5000.0)
            
            tasks = [("Discovery", TaskStatus.DONE), ("Homepage", TaskStatus.IN_PROGRESS)]
            for name, status in tasks:
                self.add_task(project.id, name, f"Complete {name.lower()}", status)
            
            self.create_invoice(
                client.id, 
                2500.0, 
                [{"name": "Phase 1", "amount": 2500.0}],
                project_id=project.id, 
                status=InvoiceStatus.PAID
            )
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
        """Thêm client mới với validation."""
        # Validate input
        errors = self.presenter.validate_client_data(name, email, company)
        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")
        
        # Create client entity
        client = self.service.create_client_entity(
            name=name,
            email=email,
            company=company,
            monthly_retainer=monthly_retainer,
            notes=notes
        )
        
        # Save to repository
        self.clients[client.id] = client
        self.messages[client.id] = []
        self.repository.save_clients(self.clients)
        self.repository.save_messages(self.messages)
        
        # Update stats
        self.service.update_client_stats(1, 1)
        self.repository.save_stats(self.service.stats)
        
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
        """Tạo project mới."""
        if client_id not in self.clients:
            raise KeyError("Client not found")
        
        # Validate input
        errors = self.presenter.validate_project_data(name, description, budget)
        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")
        
        # Create project entity
        project = self.service.create_project_entity(
            client_id=client_id,
            name=name,
            description=description,
            budget=budget,
            duration_weeks=duration_weeks
        )
        
        # Save to repository
        self.projects[project.id] = project
        self.repository.save_projects(self.projects)
        
        # Update stats
        self.service.update_project_stats(1, 1)
        self.repository.save_stats(self.service.stats)
        
        logger.info(f"Project created: {name}")
        return project
    
    def add_task(
        self,
        project_id: str,
        name: str,
        description: str,
        status: TaskStatus = TaskStatus.TODO,
        due_date: Optional = None,
        assignee: str = "Team"
    ) -> Optional:
        """Thêm task vào project."""
        if project_id not in self.projects:
            return None
        
        # Create task entity
        task = self.service.create_task_entity(
            name=name,
            description=description,
            status=status,
            due_date=due_date,
            assignee=assignee
        )
        
        # Add to project
        self.projects[project_id].tasks.append(task)
        
        # Save to repository
        self.repository.save_projects(self.projects)
        
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
        """Tạo invoice mới."""
        # Validate input
        errors = self.presenter.validate_invoice_data(amount, items)
        if errors:
            raise ValueError(f"Validation errors: {'; '.join(errors)}")
        
        # Create invoice entity
        invoice = self.service.create_invoice_entity(
            client_id=client_id,
            amount=amount,
            items=items,
            project_id=project_id,
            status=status
        )
        
        # Save to repository
        self.invoices[invoice.id] = invoice
        self.repository.save_invoices(self.invoices)
        self.repository.save_stats(self.service.stats)
        
        # Update client total spent if paid
        if status == InvoiceStatus.PAID and client_id in self.clients:
            self.clients[client_id].total_spent += amount
            self.repository.save_clients(self.clients)
        
        logger.info(f"Invoice {invoice.id} created for {amount}")
        return invoice
    
    def send_message(self, client_id: str, content: str, sender: str = "agency") -> bool:
        """Gửi message trong portal."""
        if client_id not in self.messages:
            return False
        
        # Create message entity
        message = self.service.create_message_entity(
            client_id=client_id,
            content=content,
            sender=sender
        )
        
        # Save to repository
        self.messages[client_id].append(message)
        self.repository.save_messages(self.messages)
        
        logger.info(f"Message sent to {client_id} from {sender}")
        return True
    
    def get_client_projects(self, client_id: str) -> List[Project]:
        """Lấy projects của client."""
        return [p for p in self.projects.values() if p.client_id == client_id]
    
    def get_client_invoices(self, client_id: str) -> List[Invoice]:
        """Lấy invoices của client."""
        return [i for i in self.invoices.values() if i.client_id == client_id]
    
    def get_client_messages(self, client_id: str, unread_only: bool = False) -> List[Message]:
        """Lấy messages của client."""
        if client_id not in self.messages:
            return []
        
        messages = self.messages[client_id]
        if unread_only:
            return [m for m in messages if not m.read]
        return messages
    
    def mark_messages_read(self, client_id: str, message_ids: List[str]) -> bool:
        """Đánh dấu messages đã đọc."""
        if client_id not in self.messages:
            return False
        
        updated = False
        for message in self.messages[client_id]:
            if message.id in message_ids:
                message.read = True
                updated = True
        
        if updated:
            self.repository.save_messages(self.messages)
        
        return updated
    
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
    
    def get_all_clients(self) -> List[Client]:
        """Lấy tất cả clients."""
        return list(self.clients.values())
    
    def get_all_projects(self) -> List[Project]:
        """Lấy tất cả projects."""
        return list(self.projects.values())
    
    def get_all_invoices(self) -> List[Invoice]:
        """Lấy tất cả invoices."""
        return list(self.invoices.values())
    
    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê."""
        return self.service.get_stats()
    
    def delete_client(self, client_id: str) -> bool:
        """Xóa client và related data."""
        if client_id not in self.clients:
            return False
        
        # Remove client
        del self.clients[client_id]
        
        # Remove related messages
        if client_id in self.messages:
            del self.messages[client_id]
        
        # Update stats
        self.service.update_client_stats(-1, -1)
        
        # Save changes
        self.repository.save_clients(self.clients)
        self.repository.save_messages(self.messages)
        self.repository.save_stats(self.service.stats)
        
        logger.info(f"Client {client_id} deleted")
        return True