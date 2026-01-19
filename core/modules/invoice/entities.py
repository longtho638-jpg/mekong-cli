"""
Invoice Module - Data Entities
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional


class InvoiceStatus(Enum):
    """Lifecycle status of a billable invoice."""

    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Currency(Enum):
    """Supported transaction currencies."""

    USD = "USD"
    VND = "VND"
    JPY = "JPY"
    KRW = "KRW"


@dataclass
class InvoiceItem:
    """A single line item record on an invoice."""

    description: str
    quantity: int
    unit_price: float

    @property
    def total(self) -> float:
        """Calculate line item total."""
        return float(self.quantity * self.unit_price)


@dataclass
class Invoice:
    """An invoice entity record."""

    id: str
    client_id: str
    client_name: str
    items: List[InvoiceItem]
    currency: Currency
    status: InvoiceStatus = InvoiceStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.now)
    due_date: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    paid_at: Optional[datetime] = None
    notes: str = ""

    @property
    def subtotal(self) -> float:
        return sum(item.total for item in self.items)

    @property
    def tax(self) -> float:
        return self.subtotal * 0.10  # 10% Standard VAT

    @property
    def total(self) -> float:
        return self.subtotal + self.tax
