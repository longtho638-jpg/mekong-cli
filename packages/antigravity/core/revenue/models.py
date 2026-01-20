"""
Revenue Engine Data Models and Enums.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional


class InvoiceStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class Currency(Enum):
    USD = "USD"
    VND = "VND"
    THB = "THB"

@dataclass
class Invoice:
    id: Optional[int] = None
    client_name: str = ""
    amount: float = 0.0
    currency: Currency = Currency.USD
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    paid_date: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    def get_amount_vnd(self) -> int:
        if self.currency == Currency.VND:
            return int(self.amount)
        return int(self.amount * 24500)

@dataclass
class Forecast:
    month: str
    projected: float
    actual: float = 0.0
    confidence: float = 0.8

    def variance(self) -> float:
        return self.actual - self.projected
