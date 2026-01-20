"""
Data models and Enums for Invoice Automation.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class InvoiceType(Enum):
    ONE_TIME = "one_time"
    RECURRING = "recurring"
    MILESTONE = "milestone"

class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    OVERDUE = "overdue"

@dataclass
class AutoInvoice:
    id: str
    client: str
    amount: float
    invoice_type: InvoiceType
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    reminder_count: int = 0

@dataclass
class RecurringSchedule:
    id: str
    client: str
    amount: float
    frequency: str  # monthly, quarterly
    next_date: datetime
    active: bool = True
    invoices_generated: int = 0
