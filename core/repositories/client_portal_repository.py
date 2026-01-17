"""
👥 Client Portal Repository - Data Access Layer
================================================

Repository pattern cho client portal data persistence.
"""

import json
import logging
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path

try:
    from ..services.client_portal_service import (
        Client, Project, ProjectTask, Invoice, Message,
        ClientStatus, ProjectStatus, TaskStatus, InvoiceStatus
    )
except ImportError:
    from services.client_portal_service import (
        Client, Project, ProjectTask, Invoice, Message,
        ClientStatus, ProjectStatus, TaskStatus, InvoiceStatus
    )

logger = logging.getLogger(__name__)

class ClientPortalRepository:
    """Repository cho client portal data operations."""
    
    def __init__(self, storage_path: str = "data/client_portal"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # File paths
        self.clients_file = self.storage_path / "clients.json"
        self.projects_file = self.storage_path / "projects.json"
        self.invoices_file = self.storage_path / "invoices.json"
        self.messages_file = self.storage_path / "messages.json"
        self.stats_file = self.storage_path / "stats.json"
        
        logger.info(f"Client Portal repository initialized at {storage_path}")
    
    # ═══════════════════════════════════════════════════════════
    # Client Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_clients(self, clients: Dict[str, Client]) -> bool:
        """Lưu danh sách clients."""
        try:
            data = {}
            for client_id, client in clients.items():
                data[client_id] = {
                    "id": client.id,
                    "name": client.name,
                    "email": client.email,
                    "company": client.company,
                    "status": client.status.value,
                    "created_at": client.created_at.isoformat(),
                    "portal_code": client.portal_code,
                    "notes": client.notes,
                    "monthly_retainer": client.monthly_retainer,
                    "total_spent": client.total_spent
                }
            
            with open(self.clients_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(clients)} clients")
            return True
        except Exception as e:
            logger.error(f"Failed to save clients: {e}")
            return False
    
    def load_clients(self) -> Dict[str, Client]:
        """Tải danh sách clients."""
        try:
            if not self.clients_file.exists():
                return {}
            
            with open(self.clients_file, 'r') as f:
                data = json.load(f)
            
            clients = {}
            for client_id, client_data in data.items():
                client = Client(
                    id=client_data["id"],
                    name=client_data["name"],
                    email=client_data["email"],
                    company=client_data["company"],
                    status=ClientStatus(client_data["status"]),
                    created_at=datetime.fromisoformat(client_data["created_at"]),
                    portal_code=client_data["portal_code"],
                    notes=client_data.get("notes", ""),
                    monthly_retainer=client_data.get("monthly_retainer", 0.0),
                    total_spent=client_data.get("total_spent", 0.0)
                )
                clients[client_id] = client
            
            logger.info(f"Loaded {len(clients)} clients")
            return clients
        except Exception as e:
            logger.error(f"Failed to load clients: {e}")
            return {}
    
    # ═══════════════════════════════════════════════════════════
    # Project Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_projects(self, projects: Dict[str, Project]) -> bool:
        """Lưu danh sách projects."""
        try:
            data = {}
            for project_id, project in projects.items():
                # Serialize tasks
                tasks_data = []
                for task in project.tasks:
                    tasks_data.append({
                        "id": task.id,
                        "name": task.name,
                        "description": task.description,
                        "status": task.status.value,
                        "due_date": task.due_date.isoformat() if task.due_date else None,
                        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                        "assignee": task.assignee
                    })
                
                data[project_id] = {
                    "id": project.id,
                    "client_id": project.client_id,
                    "name": project.name,
                    "description": project.description,
                    "status": project.status.value,
                    "start_date": project.start_date.isoformat(),
                    "end_date": project.end_date.isoformat() if project.end_date else None,
                    "tasks": tasks_data,
                    "budget": project.budget,
                    "spent": project.spent
                }
            
            with open(self.projects_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(projects)} projects")
            return True
        except Exception as e:
            logger.error(f"Failed to save projects: {e}")
            return False
    
    def load_projects(self) -> Dict[str, Project]:
        """Tải danh sách projects."""
        try:
            if not self.projects_file.exists():
                return {}
            
            with open(self.projects_file, 'r') as f:
                data = json.load(f)
            
            projects = {}
            for project_id, project_data in data.items():
                # Deserialize tasks
                tasks = []
                for task_data in project_data.get("tasks", []):
                    task = ProjectTask(
                        id=task_data["id"],
                        name=task_data["name"],
                        description=task_data["description"],
                        status=TaskStatus(task_data["status"]),
                        due_date=datetime.fromisoformat(task_data["due_date"]) if task_data.get("due_date") else None,
                        completed_at=datetime.fromisoformat(task_data["completed_at"]) if task_data.get("completed_at") else None,
                        assignee=task_data.get("assignee", "Team")
                    )
                    tasks.append(task)
                
                project = Project(
                    id=project_data["id"],
                    client_id=project_data["client_id"],
                    name=project_data["name"],
                    description=project_data["description"],
                    status=ProjectStatus(project_data["status"]),
                    start_date=datetime.fromisoformat(project_data["start_date"]),
                    end_date=datetime.fromisoformat(project_data["end_date"]) if project_data.get("end_date") else None,
                    tasks=tasks,
                    budget=project_data.get("budget", 0.0),
                    spent=project_data.get("spent", 0.0)
                )
                projects[project_id] = project
            
            logger.info(f"Loaded {len(projects)} projects")
            return projects
        except Exception as e:
            logger.error(f"Failed to load projects: {e}")
            return {}
    
    # ═══════════════════════════════════════════════════════════
    # Invoice Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_invoices(self, invoices: Dict[str, Invoice]) -> bool:
        """Lưu danh sách invoices."""
        try:
            data = {}
            for invoice_id, invoice in invoices.items():
                data[invoice_id] = {
                    "id": invoice.id,
                    "client_id": invoice.client_id,
                    "project_id": invoice.project_id,
                    "amount": invoice.amount,
                    "status": invoice.status.value,
                    "due_date": invoice.due_date.isoformat(),
                    "paid_date": invoice.paid_date.isoformat() if invoice.paid_date else None,
                    "items": invoice.items,
                    "notes": invoice.notes
                }
            
            with open(self.invoices_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved {len(invoices)} invoices")
            return True
        except Exception as e:
            logger.error(f"Failed to save invoices: {e}")
            return False
    
    def load_invoices(self) -> Dict[str, Invoice]:
        """Tải danh sách invoices."""
        try:
            if not self.invoices_file.exists():
                return {}
            
            with open(self.invoices_file, 'r') as f:
                data = json.load(f)
            
            invoices = {}
            for invoice_id, invoice_data in data.items():
                invoice = Invoice(
                    id=invoice_data["id"],
                    client_id=invoice_data["client_id"],
                    project_id=invoice_data.get("project_id"),
                    amount=invoice_data["amount"],
                    status=InvoiceStatus(invoice_data["status"]),
                    due_date=datetime.fromisoformat(invoice_data["due_date"]),
                    paid_date=datetime.fromisoformat(invoice_data["paid_date"]) if invoice_data.get("paid_date") else None,
                    items=invoice_data.get("items", []),
                    notes=invoice_data.get("notes", "")
                )
                invoices[invoice_id] = invoice
            
            logger.info(f"Loaded {len(invoices)} invoices")
            return invoices
        except Exception as e:
            logger.error(f"Failed to load invoices: {e}")
            return {}
    
    # ═══════════════════════════════════════════════════════════
    # Message Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_messages(self, messages: Dict[str, List[Message]]) -> bool:
        """Lưu messages theo client."""
        try:
            data = {}
            for client_id, message_list in messages.items():
                messages_data = []
                for message in message_list:
                    messages_data.append({
                        "id": message.id,
                        "client_id": message.client_id,
                        "sender": message.sender,
                        "content": message.content,
                        "timestamp": message.timestamp.isoformat(),
                        "read": message.read
                    })
                data[client_id] = messages_data
            
            with open(self.messages_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            total_messages = sum(len(msg_list) for msg_list in messages.values())
            logger.info(f"Saved {total_messages} messages for {len(messages)} clients")
            return True
        except Exception as e:
            logger.error(f"Failed to save messages: {e}")
            return False
    
    def load_messages(self) -> Dict[str, List[Message]]:
        """Tải messages theo client."""
        try:
            if not self.messages_file.exists():
                return {}
            
            with open(self.messages_file, 'r') as f:
                data = json.load(f)
            
            messages = {}
            for client_id, messages_data in data.items():
                message_list = []
                for message_data in messages_data:
                    message = Message(
                        id=message_data["id"],
                        client_id=message_data["client_id"],
                        sender=message_data["sender"],
                        content=message_data["content"],
                        timestamp=datetime.fromisoformat(message_data["timestamp"]),
                        read=message_data.get("read", False)
                    )
                    message_list.append(message)
                messages[client_id] = message_list
            
            total_messages = sum(len(msg_list) for msg_list in messages.values())
            logger.info(f"Loaded {total_messages} messages for {len(messages)} clients")
            return messages
        except Exception as e:
            logger.error(f"Failed to load messages: {e}")
            return {}
    
    # ═══════════════════════════════════════════════════════════
    # Stats Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_stats(self, stats: Dict[str, Any]) -> bool:
        """Lưu thống kê."""
        try:
            with open(self.stats_file, 'w') as f:
                json.dump(stats, f, indent=2)
            
            logger.info("Stats saved successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to save stats: {e}")
            return False
    
    def load_stats(self) -> Dict[str, Any]:
        """Tải thống kê."""
        try:
            if not self.stats_file.exists():
                return {
                    "total_clients": 0,
                    "active_clients": 0,
                    "total_projects": 0,
                    "active_projects": 0,
                    "total_invoiced": 0.0,
                    "total_collected": 0.0
                }
            
            with open(self.stats_file, 'r') as f:
                stats = json.load(f)
            
            logger.info("Stats loaded successfully")
            return stats
        except Exception as e:
            logger.error(f"Failed to load stats: {e}")
            return {
                "total_clients": 0,
                "active_clients": 0,
                "total_projects": 0,
                "active_projects": 0,
                "total_invoiced": 0.0,
                "total_collected": 0.0
            }