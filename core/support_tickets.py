"""
🎫 Support Tickets - Client Support System
============================================

Manage client support tickets.
Happy clients = Growing business!

Features:
- Ticket creation
- Priority levels
- Status tracking
- Response time SLA
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TicketPriority(Enum):
    """Ticket priority."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketStatus(Enum):
    """Ticket status."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    RESOLVED = "resolved"
    CLOSED = "closed"


@dataclass
class Ticket:
    """A support ticket."""
    id: str
    client: str
    subject: str
    description: str
    priority: TicketPriority
    status: TicketStatus = TicketStatus.OPEN
    assigned_to: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


class SupportTickets:
    """
    Support Tickets System.
    
    Manage client support.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.tickets: Dict[str, Ticket] = {}
        self.sla = {
            TicketPriority.URGENT: timedelta(hours=1),
            TicketPriority.HIGH: timedelta(hours=4),
            TicketPriority.MEDIUM: timedelta(hours=24),
            TicketPriority.LOW: timedelta(hours=48),
        }
    
    def create_ticket(
        self,
        client: str,
        subject: str,
        description: str,
        priority: TicketPriority = TicketPriority.MEDIUM
    ) -> Ticket:
        """Create a ticket."""
        ticket = Ticket(
            id=f"TKT-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            subject=subject,
            description=description,
            priority=priority
        )
        self.tickets[ticket.id] = ticket
        return ticket
    
    def assign(self, ticket: Ticket, agent: str):
        """Assign ticket to agent."""
        ticket.assigned_to = agent
        ticket.status = TicketStatus.IN_PROGRESS
    
    def resolve(self, ticket: Ticket):
        """Resolve a ticket."""
        ticket.status = TicketStatus.RESOLVED
        ticket.resolved_at = datetime.now()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get ticket statistics."""
        open_count = sum(1 for t in self.tickets.values() if t.status == TicketStatus.OPEN)
        resolved = [t for t in self.tickets.values() if t.resolved_at]
        
        avg_resolution = None
        if resolved:
            total = sum((t.resolved_at - t.created_at).total_seconds() for t in resolved)
            avg_resolution = total / len(resolved) / 3600  # hours
        
        return {
            "total": len(self.tickets),
            "open": open_count,
            "resolved": len(resolved),
            "avg_resolution_hours": avg_resolution
        }
    
    def format_dashboard(self) -> str:
        """Format tickets dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  🎫 SUPPORT TICKETS                                       ║",
            f"║  {stats['total']} total │ {stats['open']} open │ {stats['resolved']} resolved             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 SLA TARGETS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        priority_icons = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        
        for priority, target in self.sla.items():
            hours = target.total_seconds() / 3600
            icon = priority_icons[priority.value]
            lines.append(f"║    {icon} {priority.value.upper():<10} │ Response within {hours:.0f} hours       ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT TICKETS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"open": "🔵", "in_progress": "🟡", "resolved": "🟢", "closed": "⚪"}
        
        for ticket in list(self.tickets.values())[-4:]:
            icon = status_icons.get(ticket.status.value, "❓")
            prio = priority_icons[ticket.priority.value]
            lines.append(f"║    {icon} {prio} {ticket.id:<9} │ {ticket.subject[:30]:<30}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Ticket]  [📊 Analytics]  [⚙️ Settings]           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Client happiness!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    support = SupportTickets("Saigon Digital Hub")
    
    print("🎫 Support Tickets")
    print("=" * 60)
    print()
    
    # Create tickets
    t1 = support.create_ticket("Sunrise Realty", "Website down", "Can't access my site", TicketPriority.URGENT)
    t2 = support.create_ticket("Coffee Lab", "Add new product", "Need to add new menu item", TicketPriority.LOW)
    t3 = support.create_ticket("Tech Startup", "SEO report question", "Need help understanding report", TicketPriority.MEDIUM)
    
    # Assign and resolve
    support.assign(t1, "Alex")
    support.resolve(t1)
    
    print(support.format_dashboard())
