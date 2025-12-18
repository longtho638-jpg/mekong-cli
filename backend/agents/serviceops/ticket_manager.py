"""
Ticket Manager Agent - Support Ticket Tracking
Manages tickets, priority, and SLA compliance.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class Priority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"


@dataclass
class Ticket:
    """Support ticket"""
    id: str
    subject: str
    description: str
    customer_id: str
    customer_name: str
    channel: str
    priority: Priority = Priority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    assignee: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    resolution_time: Optional[timedelta] = None
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.sla_deadline is None:
            # Set SLA based on priority
            sla_hours = {
                Priority.URGENT: 2,
                Priority.HIGH: 8,
                Priority.MEDIUM: 24,
                Priority.LOW: 72,
            }
            self.sla_deadline = self.created_at + timedelta(hours=sla_hours[self.priority])
    
    @property
    def is_sla_breached(self) -> bool:
        if self.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            return False
        return datetime.now() > self.sla_deadline


class TicketManagerAgent:
    """
    Ticket Manager Agent - Quản lý Ticket hỗ trợ
    
    Responsibilities:
    - Create tickets from conversations
    - Assign priority based on content
    - Track SLA compliance
    - Generate resolution metrics
    """
    
    # Priority keywords
    PRIORITY_KEYWORDS = {
        Priority.URGENT: ["khẩn cấp", "urgent", "ngay", "critical", "block"],
        Priority.HIGH: ["lỗi", "bug", "không hoạt động", "broken", "error"],
        Priority.MEDIUM: ["hỗ trợ", "help", "hướng dẫn", "question"],
        Priority.LOW: ["đề xuất", "feedback", "suggestion", "nice to have"],
    }
    
    def __init__(self):
        self.name = "Ticket Manager"
        self.status = "ready"
        self.tickets: Dict[str, Ticket] = {}
        
    def detect_priority(self, text: str) -> Priority:
        """Detect priority from text content"""
        text_lower = text.lower()
        
        for priority, keywords in self.PRIORITY_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                return priority
        
        return Priority.MEDIUM
    
    def create_ticket(
        self,
        subject: str,
        description: str,
        customer_id: str,
        customer_name: str,
        channel: str = "zalo"
    ) -> Ticket:
        """Create a new support ticket"""
        ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000,9999)}"
        
        ticket = Ticket(
            id=ticket_id,
            subject=subject,
            description=description,
            customer_id=customer_id,
            customer_name=customer_name,
            channel=channel,
            priority=self.detect_priority(f"{subject} {description}")
        )
        
        self.tickets[ticket_id] = ticket
        return ticket
    
    def update_status(self, ticket_id: str, status: TicketStatus) -> Ticket:
        """Update ticket status"""
        if ticket_id not in self.tickets:
            raise ValueError(f"Ticket not found: {ticket_id}")
            
        ticket = self.tickets[ticket_id]
        ticket.status = status
        ticket.updated_at = datetime.now()
        
        if status == TicketStatus.RESOLVED:
            ticket.resolution_time = datetime.now() - ticket.created_at
            
        return ticket
    
    def assign(self, ticket_id: str, assignee: str) -> Ticket:
        """Assign ticket to agent"""
        if ticket_id not in self.tickets:
            raise ValueError(f"Ticket not found: {ticket_id}")
            
        ticket = self.tickets[ticket_id]
        ticket.assignee = assignee
        ticket.status = TicketStatus.IN_PROGRESS
        ticket.updated_at = datetime.now()
        
        return ticket
    
    def get_by_status(self, status: TicketStatus) -> List[Ticket]:
        """Get tickets by status"""
        return [t for t in self.tickets.values() if t.status == status]
    
    def get_sla_breached(self) -> List[Ticket]:
        """Get SLA breached tickets"""
        return [t for t in self.tickets.values() if t.is_sla_breached]
    
    def get_metrics(self) -> Dict:
        """Get support metrics"""
        all_tickets = list(self.tickets.values())
        resolved = [t for t in all_tickets if t.status == TicketStatus.RESOLVED]
        
        avg_resolution = None
        if resolved:
            total_mins = sum(t.resolution_time.total_seconds() / 60 for t in resolved if t.resolution_time)
            avg_resolution = total_mins / len(resolved) if resolved else 0
        
        return {
            "total_tickets": len(all_tickets),
            "open": len([t for t in all_tickets if t.status == TicketStatus.OPEN]),
            "in_progress": len([t for t in all_tickets if t.status == TicketStatus.IN_PROGRESS]),
            "resolved": len(resolved),
            "sla_breached": len(self.get_sla_breached()),
            "avg_resolution_mins": round(avg_resolution, 1) if avg_resolution else None,
            "by_priority": {
                p.value: len([t for t in all_tickets if t.priority == p])
                for p in Priority
            }
        }


# Demo
if __name__ == "__main__":
    manager = TicketManagerAgent()
    
    print("🎫 Ticket Manager Agent Demo\n")
    
    # Create tickets
    ticket1 = manager.create_ticket(
        subject="Lỗi deploy không hoạt động",
        description="Khi chạy mekong deploy thì bị lỗi timeout",
        customer_id="user_001",
        customer_name="Nguyễn Văn A",
        channel="zalo"
    )
    
    ticket2 = manager.create_ticket(
        subject="Hỏi về giá Enterprise",
        description="Công ty tôi muốn dùng cho 50 người",
        customer_id="user_002",
        customer_name="Trần B",
        channel="email"
    )
    
    print(f"📋 Ticket 1: {ticket1.id}")
    print(f"   Subject: {ticket1.subject}")
    print(f"   Priority: {ticket1.priority.value}")
    print(f"   SLA: {ticket1.sla_deadline.strftime('%Y-%m-%d %H:%M')}")
    
    print(f"\n📋 Ticket 2: {ticket2.id}")
    print(f"   Subject: {ticket2.subject}")
    print(f"   Priority: {ticket2.priority.value}")
    
    # Update status
    manager.assign(ticket1.id, "Support Bot")
    manager.update_status(ticket1.id, TicketStatus.RESOLVED)
    
    # Metrics
    print("\n📊 Metrics:")
    metrics = manager.get_metrics()
    print(f"   Total: {metrics['total_tickets']}")
    print(f"   Resolved: {metrics['resolved']}")
    print(f"   Avg Resolution: {metrics['avg_resolution_mins']} mins")
