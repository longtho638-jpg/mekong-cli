"""
Ticket Manager core logic.
"""
import random
from datetime import datetime
from typing import Dict, List

from .models import Priority, Ticket, TicketStatus


class TicketEngine:
    PRIORITY_KEYWORDS = {
        Priority.URGENT: ["khẩn cấp", "urgent", "ngay", "critical", "block"],
        Priority.HIGH: ["lỗi", "bug", "không hoạt động", "broken", "error"],
    }

    def __init__(self):
        self.tickets: Dict[str, Ticket] = {}

    def detect_priority(self, text: str) -> Priority:
        text_lower = text.lower()
        for p, kws in self.PRIORITY_KEYWORDS.items():
            if any(kw in text_lower for kw in kws): return p
        return Priority.MEDIUM

    def create_ticket(self, subject: str, description: str, customer_id: str, customer_name: str, channel: str = "zalo") -> Ticket:
        tid = f"TKT-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        ticket = Ticket(id=tid, subject=subject, description=description, customer_id=customer_id, customer_name=customer_name, channel=channel, priority=self.detect_priority(f"{subject} {description}"))
        self.tickets[tid] = ticket
        return ticket
