"""
Ticket Manager Agent Facade.
"""
from typing import Dict

from .engine import TicketEngine
from .models import Priority, Ticket, TicketStatus


class TicketManagerAgent(TicketEngine):
    """Refactored Ticket Manager Agent."""
    def __init__(self):
        super().__init__()
        self.name = "Ticket Manager"
        self.status = "ready"

    def get_metrics(self) -> Dict:
        return {"total_tickets": len(self.tickets), "open": len([t for t in self.tickets.values() if t.status == TicketStatus.OPEN])}

__all__ = ['TicketManagerAgent', 'Priority', 'TicketStatus', 'Ticket']
