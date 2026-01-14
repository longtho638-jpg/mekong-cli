"""
Invoice models for RevenueEngine.

Extracted from revenue_engine.py for clean architecture.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum


class InvoiceStatus(Enum):
    """Invoice payment status."""
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


@dataclass
class Invoice:
    """An invoice record."""
    id: Optional[int] = None
    client_name: str = ""
    amount: float = 0.0
    currency: str = "USD"
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=14))
    paid_date: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    def get_amount_vnd(self) -> int:
        """Get amount in VND (1 USD = 24,500 VND)."""
        if self.currency == "VND":
            return int(self.amount)
        return int(self.amount * 24500)

    def is_overdue(self) -> bool:
        """Check if invoice is overdue."""
        if self.status == InvoiceStatus.PAID:
            return False
        return datetime.now() > self.due_date

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "client_name": self.client_name,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status.value,
            "due_date": self.due_date.isoformat(),
            "paid_date": self.paid_date.isoformat() if self.paid_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class Forecast:
    """Revenue forecast."""
    month: str
    projected: float
    actual: float = 0.0
    confidence: float = 0.8

    def variance(self) -> float:
        """Calculate variance from projection."""
        return self.actual - self.projected

    def variance_percent(self) -> float:
        """Calculate variance as percentage."""
        if self.projected == 0:
            return 0.0
        return (self.variance() / self.projected) * 100

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "month": self.month,
            "projected": self.projected,
            "actual": self.actual,
            "confidence": self.confidence,
            "variance": self.variance()
        }
